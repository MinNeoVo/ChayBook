/*
 * Add Google/Facebook identities without rebuilding the existing database.
 * Run against ChayBook_Project before starting the updated backend.
 * Existing users, password hashes, roles and statuses are preserved.
 * The script is transactional and can be run more than once.
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'ChayBook_Project'
    THROW 51000, 'Select the ChayBook_Project database before running this migration.', 1;

IF OBJECT_ID(N'dbo.[USER]', N'U') IS NULL
    THROW 51001, 'The existing dbo.[USER] table was not found.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @passwordType sysname;
    DECLARE @passwordLength smallint;
    DECLARE @passwordCollation sysname;
    DECLARE @passwordNullable bit;

    SELECT @passwordType = TYPE_NAME(system_type_id),
           @passwordLength = max_length,
           @passwordCollation = collation_name,
           @passwordNullable = is_nullable
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.[USER]') AND name = N'password_hash';

    IF @passwordType IS NULL OR @passwordType NOT IN (N'varchar', N'nvarchar')
        THROW 51002, 'Expected a varchar/nvarchar password_hash column; inspect the schema before migrating.', 1;

    -- Keep the live column type, length and collation (both old VARCHAR and
    -- newer NVARCHAR versions of the ChayBook schema are supported).
    IF @passwordNullable = 0
    BEGIN
        DECLARE @lengthSql nvarchar(10) = CASE
            WHEN @passwordLength = -1 THEN N'max'
            WHEN @passwordType = N'nvarchar' THEN CONVERT(nvarchar(10), @passwordLength / 2)
            ELSE CONVERT(nvarchar(10), @passwordLength)
        END;
        DECLARE @alterPassword nvarchar(max) =
            N'ALTER TABLE dbo.[USER] ALTER COLUMN password_hash '
            + @passwordType + N'(' + @lengthSql + N') COLLATE '
            + @passwordCollation + N' NULL;';
        EXEC sys.sp_executesql @alterPassword;
    END;

    IF OBJECT_ID(N'dbo.USER_SOCIAL_IDENTITY', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.USER_SOCIAL_IDENTITY (
            social_identity_id BIGINT IDENTITY(1,1) NOT NULL,
            user_id INT NOT NULL,
            provider VARCHAR(20) COLLATE Latin1_General_100_BIN2 NOT NULL,
            provider_user_id VARCHAR(255) COLLATE Latin1_General_100_BIN2 NOT NULL,
            created_at DATETIME2(7) NOT NULL
                CONSTRAINT DF_SOCIAL_CREATED_AT DEFAULT SYSUTCDATETIME(),
            CONSTRAINT PK_USER_SOCIAL_IDENTITY PRIMARY KEY (social_identity_id),
            CONSTRAINT FK_SOCIAL_USER FOREIGN KEY (user_id) REFERENCES dbo.[USER] (user_id),
            CONSTRAINT UQ_SOCIAL_PROVIDER_SUBJECT UNIQUE (provider, provider_user_id),
            CONSTRAINT UQ_SOCIAL_USER_PROVIDER UNIQUE (user_id, provider),
            CONSTRAINT CK_SOCIAL_PROVIDER CHECK (provider IN ('GOOGLE', 'FACEBOOK')),
            CONSTRAINT CK_SOCIAL_SUBJECT_NONEMPTY CHECK (LEN(LTRIM(RTRIM(provider_user_id))) > 0)
        );
    END;

    -- An existing table is accepted only when its essential shape and
    -- constraints match this migration. Never silently reuse a weaker schema.
    DECLARE @socialTableId int = OBJECT_ID(N'dbo.USER_SOCIAL_IDENTITY');
    IF (SELECT COUNT(*) FROM sys.columns WHERE object_id = @socialTableId) <> 5
        THROW 51003, 'Unexpected USER_SOCIAL_IDENTITY columns; inspect the existing table.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @socialTableId
                   AND name = N'social_identity_id' AND TYPE_NAME(system_type_id) = N'bigint'
                   AND is_identity = 1 AND is_nullable = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @socialTableId
                      AND name = N'user_id' AND TYPE_NAME(system_type_id) = N'int' AND is_nullable = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @socialTableId
                      AND name = N'provider' AND TYPE_NAME(system_type_id) = N'varchar'
                      AND max_length = 20 AND is_nullable = 0 AND collation_name = N'Latin1_General_100_BIN2')
       OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @socialTableId
                      AND name = N'provider_user_id' AND TYPE_NAME(system_type_id) = N'varchar'
                      AND max_length = 255 AND is_nullable = 0 AND collation_name = N'Latin1_General_100_BIN2')
       OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = @socialTableId
                      AND name = N'created_at' AND TYPE_NAME(system_type_id) = N'datetime2'
                      AND scale = 7 AND is_nullable = 0 AND default_object_id <> 0)
        THROW 51004, 'USER_SOCIAL_IDENTITY has incompatible column definitions.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.key_constraints k
        JOIN sys.index_columns c ON c.object_id = k.parent_object_id AND c.index_id = k.unique_index_id
        WHERE k.parent_object_id = @socialTableId AND k.type = 'PK' AND c.key_ordinal = 1
          AND COL_NAME(c.object_id, c.column_id) = N'social_identity_id'
          AND (SELECT COUNT(*) FROM sys.index_columns p WHERE p.object_id = c.object_id
               AND p.index_id = c.index_id AND p.key_ordinal > 0) = 1
    )
        THROW 51005, 'USER_SOCIAL_IDENTITY primary key is missing or incompatible.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys f
        JOIN sys.foreign_key_columns c ON c.constraint_object_id = f.object_id
        WHERE f.parent_object_id = @socialTableId AND f.referenced_object_id = OBJECT_ID(N'dbo.[USER]')
          AND f.is_disabled = 0 AND f.is_not_trusted = 0
          AND f.delete_referential_action = 0 AND f.update_referential_action = 0
          AND COL_NAME(c.parent_object_id, c.parent_column_id) = N'user_id'
          AND COL_NAME(c.referenced_object_id, c.referenced_column_id) = N'user_id'
    )
        THROW 51006, 'USER_SOCIAL_IDENTITY requires a trusted foreign key to dbo.[USER].', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        JOIN sys.index_columns a ON a.object_id = i.object_id AND a.index_id = i.index_id AND a.key_ordinal = 1
        JOIN sys.index_columns b ON b.object_id = i.object_id AND b.index_id = i.index_id AND b.key_ordinal = 2
        WHERE i.object_id = @socialTableId AND i.name = N'UQ_SOCIAL_PROVIDER_SUBJECT'
          AND i.is_unique = 1 AND i.is_disabled = 0 AND i.has_filter = 0
          AND COL_NAME(a.object_id, a.column_id) = N'provider'
          AND COL_NAME(b.object_id, b.column_id) = N'provider_user_id'
          AND (SELECT COUNT(*) FROM sys.index_columns c WHERE c.object_id = i.object_id
               AND c.index_id = i.index_id AND c.key_ordinal > 0) = 2
    ) OR NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        JOIN sys.index_columns a ON a.object_id = i.object_id AND a.index_id = i.index_id AND a.key_ordinal = 1
        JOIN sys.index_columns b ON b.object_id = i.object_id AND b.index_id = i.index_id AND b.key_ordinal = 2
        WHERE i.object_id = @socialTableId AND i.name = N'UQ_SOCIAL_USER_PROVIDER'
          AND i.is_unique = 1 AND i.is_disabled = 0 AND i.has_filter = 0
          AND COL_NAME(a.object_id, a.column_id) = N'user_id'
          AND COL_NAME(b.object_id, b.column_id) = N'provider'
          AND (SELECT COUNT(*) FROM sys.index_columns c WHERE c.object_id = i.object_id
               AND c.index_id = i.index_id AND c.key_ordinal > 0) = 2
    )
        THROW 51007, 'Required social-identity uniqueness constraints are missing or incompatible.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = @socialTableId
                   AND name = N'CK_SOCIAL_PROVIDER' AND is_disabled = 0 AND is_not_trusted = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = @socialTableId
                      AND name = N'CK_SOCIAL_SUBJECT_NONEMPTY' AND is_disabled = 0 AND is_not_trusted = 0)
        THROW 51008, 'Required social-identity check constraints are missing or disabled.', 1;

    COMMIT TRANSACTION;
    PRINT 'Social authentication migration completed successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

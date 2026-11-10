USE ChayBook_Project;
GO

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Gỡ mọi khóa ngoại tham chiếu tới bảng VIDEO
    DECLARE @DropForeignKeys NVARCHAR(MAX) = N'';

    SELECT @DropForeignKeys +=
        N'ALTER TABLE '
        + QUOTENAME(SCHEMA_NAME(parent_table.schema_id))
        + N'.' + QUOTENAME(parent_table.name)
        + N' DROP CONSTRAINT ' + QUOTENAME(fk.name) + N';'
    FROM sys.foreign_keys fk
    JOIN sys.tables parent_table
        ON parent_table.object_id = fk.parent_object_id
    WHERE fk.referenced_object_id = OBJECT_ID(N'dbo.VIDEO');

    IF @DropForeignKeys <> N''
        EXEC sys.sp_executesql @DropForeignKeys;

    -- Xóa các đối tượng phụ thuộc vào ADMIN_CONTENT_DECISION.video_id
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = N'CK_ADMIN_CONTENT_DECISION_ONE_CONTENT'
          AND parent_object_id = OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION')
    )
    BEGIN
        ALTER TABLE dbo.ADMIN_CONTENT_DECISION
        DROP CONSTRAINT CK_ADMIN_CONTENT_DECISION_ONE_CONTENT;
    END;

    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_ADMIN_CONTENT_DECISION_VIDEO'
          AND object_id = OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION')
    )
    BEGIN
        DROP INDEX IX_ADMIN_CONTENT_DECISION_VIDEO
        ON dbo.ADMIN_CONTENT_DECISION;
    END;

    -- Xóa cột video_id khỏi các bảng
    IF COL_LENGTH(N'dbo.AI_MODERATION', N'video_id') IS NOT NULL
        ALTER TABLE dbo.AI_MODERATION DROP COLUMN video_id;

    IF COL_LENGTH(N'dbo.ADMIN_CONTENT_DECISION', N'video_id') IS NOT NULL
        ALTER TABLE dbo.ADMIN_CONTENT_DECISION DROP COLUMN video_id;

    -- Sau khi chỉ còn POST, decision phải gắn với một post
    IF COL_LENGTH(N'dbo.ADMIN_CONTENT_DECISION', N'post_id') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.ADMIN_CONTENT_DECISION
        ADD CONSTRAINT CK_ADMIN_CONTENT_DECISION_ONE_CONTENT
            CHECK (post_id IS NOT NULL);
    END;

    -- Xóa bảng VIDEO
    IF OBJECT_ID(N'dbo.VIDEO', N'U') IS NOT NULL
        DROP TABLE dbo.VIDEO;

    COMMIT TRANSACTION;

    PRINT N'Đã xóa bảng VIDEO và các liên kết video khỏi moderation.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
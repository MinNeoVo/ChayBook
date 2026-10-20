USE ChayBook_Project;
GO

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Thêm moderation_status nếu chưa có.
    IF COL_LENGTH(N'dbo.AI_MODERATION', N'moderation_status') IS NULL
    BEGIN
        ALTER TABLE dbo.AI_MODERATION
        ADD moderation_status NVARCHAR(20) NULL;
    END;

    -- Biên dịch các câu dùng cột mới sau khi cột đã được thêm.
    EXEC sys.sp_executesql N'
        UPDATE dbo.AI_MODERATION
        SET moderation_status = N''COMPLETED''
        WHERE moderation_status IS NULL;
    ';

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.AI_MODERATION')
          AND name = N'DF_AI_MODERATION_moderation_status'
    )
    BEGIN
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.AI_MODERATION
            ADD CONSTRAINT DF_AI_MODERATION_moderation_status
                DEFAULT N''PROCESSING'' FOR moderation_status;
        ';
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.AI_MODERATION')
          AND name = N'CK_AI_MODERATION_moderation_status'
    )
    BEGIN
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.AI_MODERATION
            ADD CONSTRAINT CK_AI_MODERATION_moderation_status
                CHECK (moderation_status IN
                    (N''PROCESSING'', N''COMPLETED'', N''FAILED''));
        ';
    END;

    -- Tạo bảng lịch sử quyết định admin nếu chưa có.
    IF OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ADMIN_CONTENT_DECISION
        (
            decision_id INT IDENTITY(1,1) NOT NULL,
            post_id INT NULL,
            video_id INT NULL,
            admin_id INT NOT NULL,
            previous_status NVARCHAR(50) NOT NULL,
            [decision] NVARCHAR(20) NOT NULL,
            reason NVARCHAR(MAX) NULL,
            decided_at DATETIME2(0) NOT NULL
                CONSTRAINT DF_ADMIN_CONTENT_DECISION_decided_at
                DEFAULT GETDATE(),

            CONSTRAINT PK_ADMIN_CONTENT_DECISION
                PRIMARY KEY (decision_id),

            CONSTRAINT FK_ADMIN_CONTENT_DECISION_POST
                FOREIGN KEY (post_id) REFERENCES dbo.POST(post_id),

            CONSTRAINT FK_ADMIN_CONTENT_DECISION_VIDEO
                FOREIGN KEY (video_id) REFERENCES dbo.VIDEO(video_id),

            CONSTRAINT FK_ADMIN_CONTENT_DECISION_ADMIN
                FOREIGN KEY (admin_id) REFERENCES dbo.[USER](user_id),

            CONSTRAINT CK_ADMIN_CONTENT_DECISION_ONE_CONTENT
                CHECK (
                    (post_id IS NOT NULL AND video_id IS NULL)
                    OR
                    (post_id IS NULL AND video_id IS NOT NULL)
                ),

            CONSTRAINT CK_ADMIN_CONTENT_DECISION_VALUE
                CHECK ([decision] IN
                    (N'APPROVED', N'REJECTED', N'REMOVED')),

            CONSTRAINT CK_ADMIN_CONTENT_DECISION_REJECT_REASON
                CHECK (
                    [decision] <> N'REJECTED'
                    OR (
                        reason IS NOT NULL
                        AND LEN(LTRIM(RTRIM(reason))) > 0
                    )
                )
        );
    END;

    -- Tạo index nếu chưa có.
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION')
          AND name = N'IX_ADMIN_CONTENT_DECISION_POST'
    )
    BEGIN
        CREATE INDEX IX_ADMIN_CONTENT_DECISION_POST
            ON dbo.ADMIN_CONTENT_DECISION(post_id, decided_at);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION')
          AND name = N'IX_ADMIN_CONTENT_DECISION_VIDEO'
    )
    BEGIN
        CREATE INDEX IX_ADMIN_CONTENT_DECISION_VIDEO
            ON dbo.ADMIN_CONTENT_DECISION(video_id, decided_at);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION')
          AND name = N'IX_ADMIN_CONTENT_DECISION_ADMIN'
    )
    BEGIN
        CREATE INDEX IX_ADMIN_CONTENT_DECISION_ADMIN
            ON dbo.ADMIN_CONTENT_DECISION(admin_id, decided_at);
    END;

    COMMIT TRANSACTION;

    SELECT N'Migration hoàn tất.' AS result;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
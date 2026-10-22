-- Run in the explicitly selected database after approval. Existing guest history
-- remains unclaimed (NULL); never assign legacy conversations to a new guest.
SET XACT_ABORT ON;
SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH('dbo.AI_CONVERSATION','guest_key') IS NULL
        ALTER TABLE dbo.AI_CONVERSATION ADD guest_key VARCHAR(64) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.AI_CONVERSATION') AND name='CK_AI_CONVERSATION_GUEST_OWNER')
        EXEC sys.sp_executesql N'ALTER TABLE dbo.AI_CONVERSATION WITH CHECK ADD CONSTRAINT CK_AI_CONVERSATION_GUEST_OWNER CHECK
            (guest_key IS NULL OR (user_id IS NULL AND LEN(guest_key)=64 AND guest_key NOT LIKE ''%[^0-9a-f]%''));';
    ALTER TABLE dbo.AI_CONVERSATION WITH CHECK CHECK CONSTRAINT CK_AI_CONVERSATION_GUEST_OWNER;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

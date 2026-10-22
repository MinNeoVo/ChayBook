-- Run once on an existing ChayBook_Project database before starting the updated backend.
SET XACT_ABORT ON;
SET NOCOUNT ON;
BEGIN TRY
BEGIN TRANSACTION;
IF OBJECT_ID('AUTH_OTP_CHALLENGE', 'U') IS NULL
BEGIN
    CREATE TABLE AUTH_OTP_CHALLENGE (
        challenge_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        purpose VARCHAR(30) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        attempts INT NOT NULL CONSTRAINT DF_AUTH_OTP_ATTEMPTS DEFAULT 0,
        verified BIT NOT NULL CONSTRAINT DF_AUTH_OTP_VERIFIED DEFAULT 0,
        username VARCHAR(50) NULL,
        password_hash VARCHAR(255) NULL,
        full_name VARCHAR(255) NULL,
        CONSTRAINT UQ_AUTH_OTP_EMAIL_PURPOSE UNIQUE (email, purpose),
        CONSTRAINT CK_AUTH_OTP_PURPOSE CHECK (purpose IN ('REGISTER', 'PASSWORD_RESET'))
    );
END;
IF (SELECT COUNT(*) FROM sys.columns WHERE object_id=OBJECT_ID('dbo.AUTH_OTP_CHALLENGE')
    AND name IN ('challenge_id','email','purpose','otp_hash','expires_at','attempts','verified','username','password_hash','full_name')) <> 10
    THROW 51020, 'AUTH_OTP_CHALLENGE has an incompatible schema.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID('dbo.AUTH_OTP_CHALLENGE') AND name='UQ_AUTH_OTP_EMAIL_PURPOSE')
    THROW 51021, 'AUTH_OTP_CHALLENGE is missing its email/purpose unique constraint.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.AUTH_OTP_CHALLENGE') AND name='CK_AUTH_OTP_PURPOSE')
    THROW 51022, 'AUTH_OTP_CHALLENGE is missing its purpose check constraint.', 1;
ALTER TABLE dbo.AUTH_OTP_CHALLENGE WITH CHECK CHECK CONSTRAINT ALL;
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

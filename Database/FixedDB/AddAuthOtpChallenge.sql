-- Run once on an existing ChayBook_Project database before starting the updated backend.
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
GO

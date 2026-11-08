USE ChayBook_Project;
GO

IF OBJECT_ID(N'dbo.NOTIFICATION', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NOTIFICATION (
        notification_id INT IDENTITY(1,1) PRIMARY KEY,
        recipient_user_id INT NOT NULL,
        actor_user_id INT NULL,
        post_id INT NULL,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        target_url NVARCHAR(255) NULL,
        is_read BIT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_NOTIFICATION_RECIPIENT
            FOREIGN KEY (recipient_user_id)
            REFERENCES dbo.[USER](user_id),

        CONSTRAINT FK_NOTIFICATION_ACTOR
            FOREIGN KEY (actor_user_id)
            REFERENCES dbo.[USER](user_id),

        CONSTRAINT FK_NOTIFICATION_POST
            FOREIGN KEY (post_id)
            REFERENCES dbo.POST(post_id)
    );

    CREATE INDEX IX_NOTIFICATION_RECIPIENT_CREATED
        ON dbo.NOTIFICATION(recipient_user_id, is_read, created_at DESC);
END;
GO


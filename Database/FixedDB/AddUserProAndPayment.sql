-- Script thêm tính năng User Pro và Thanh toán PayOS vào ChayBook
-- Ngày tạo: 2026-11-15

-- 1. Thêm cột pro_expires_at vào bảng [USER] nếu chưa có
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[USER]') 
      AND name = 'pro_expires_at'
)
BEGIN
    ALTER TABLE [USER] ADD pro_expires_at DATETIME NULL;
    PRINT N'Đã thêm cột pro_expires_at vào bảng [USER].';
END
GO

-- 2. Tạo bảng USER_PAYMENT lưu lịch sử đơn hàng và thanh toán PayOS
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'USER_PAYMENT')
BEGIN
    CREATE TABLE USER_PAYMENT (
        payment_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        order_code BIGINT NOT NULL UNIQUE,
        amount INT NOT NULL,
        plan_type NVARCHAR(50) NOT NULL DEFAULT N'PRO_MONTHLY',
        duration_days INT NOT NULL DEFAULT 30,
        status NVARCHAR(20) NOT NULL DEFAULT N'PENDING', -- PENDING, PAID, CANCELLED, EXPIRED
        checkout_url NVARCHAR(1000) NULL,
        qr_code NVARCHAR(MAX) NULL,
        payment_link_id NVARCHAR(255) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        paid_at DATETIME NULL,

        CONSTRAINT FK_USER_PAYMENT_USER FOREIGN KEY (user_id) REFERENCES [USER](user_id)
    );

    CREATE INDEX IX_USER_PAYMENT_ORDER_CODE ON USER_PAYMENT(order_code);
    CREATE INDEX IX_USER_PAYMENT_USER_ID ON USER_PAYMENT(user_id);

    PRINT N'Đã tạo bảng USER_PAYMENT.';
END
GO

-- 3. Tạo bảng USER_DAILY_USAGE lưu hạn mức sử dụng chatbot trong ngày của Free user (5 câu/ngày)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'USER_DAILY_USAGE')
BEGIN
    CREATE TABLE USER_DAILY_USAGE (
        usage_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        usage_date DATE NOT NULL,
        chatbot_count INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_USER_DAILY_USAGE_USER FOREIGN KEY (user_id) REFERENCES [USER](user_id),
        CONSTRAINT UQ_USER_DAILY_USAGE UNIQUE (user_id, usage_date)
    );

    CREATE INDEX IX_USER_DAILY_USAGE_USER_DATE ON USER_DAILY_USAGE(user_id, usage_date);

    PRINT N'Đã tạo bảng USER_DAILY_USAGE.';
END
GO


SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- =============================================
    -- 1. USER: Thông tin tài khoản
    -- USER là từ khóa nên luôn đặt trong dấu []
    -- =============================================
    CREATE TABLE dbo.[USER] (
        user_id INT IDENTITY(1,1) NOT NULL,
        username NVARCHAR(50) NOT NULL,
        email NVARCHAR(254) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name NVARCHAR(150) NOT NULL,
        avatar_url NVARCHAR(2048) NULL,
        role VARCHAR(30) NOT NULL
            CONSTRAINT DF_USER_role DEFAULT ('USER'),
        status VARCHAR(30) NOT NULL
            CONSTRAINT DF_USER_status DEFAULT ('ACTIVE'),
        created_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_USER_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_USER_updated_at DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_USER PRIMARY KEY (user_id),
        CONSTRAINT UQ_USER_username UNIQUE (username),
        CONSTRAINT UQ_USER_email UNIQUE (email)
    );

    -- =============================================
    -- 2. ALLERGY: Danh mục dị ứng
    -- =============================================
    CREATE TABLE dbo.ALLERGY (
        allergy_id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_ALLERGY PRIMARY KEY (allergy_id),
        CONSTRAINT UQ_ALLERGY_name UNIQUE (name)
    );

    -- =============================================
    -- 3. USER_ALLERGY: Dị ứng của từng người dùng
    -- Khóa chính ghép ngăn một người đăng ký
    -- trùng cùng một loại dị ứng
    -- =============================================
    CREATE TABLE dbo.USER_ALLERGY (
        user_id INT NOT NULL,
        allergy_id INT NOT NULL,

        CONSTRAINT PK_USER_ALLERGY
            PRIMARY KEY (user_id, allergy_id),

        CONSTRAINT FK_USER_ALLERGY_USER
            FOREIGN KEY (user_id)
            REFERENCES dbo.[USER] (user_id),

        CONSTRAINT FK_USER_ALLERGY_ALLERGY
            FOREIGN KEY (allergy_id)
            REFERENCES dbo.ALLERGY (allergy_id)
    );

    -- =============================================
    -- 4. BMI_RECORD: Lịch sử chỉ số BMI
    -- Quy ước: height tính bằng cm, weight bằng kg
    -- Backend tính bmi trước khi lưu
    -- =============================================
    CREATE TABLE dbo.BMI_RECORD (
        bmi_id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        height FLOAT NOT NULL,
        weight FLOAT NOT NULL,
        bmi FLOAT NOT NULL,
        category NVARCHAR(50) NOT NULL,
        calculated_at DATETIME2(0) NOT NULL
            CONSTRAINT DF_BMI_RECORD_calculated_at
            DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_BMI_RECORD PRIMARY KEY (bmi_id),

        CONSTRAINT FK_BMI_RECORD_USER
            FOREIGN KEY (user_id)
            REFERENCES dbo.[USER] (user_id),

        CONSTRAINT CK_BMI_RECORD_height CHECK (height > 0),
        CONSTRAINT CK_BMI_RECORD_weight CHECK (weight > 0),
        CONSTRAINT CK_BMI_RECORD_bmi CHECK (bmi > 0)
    );

    -- Hỗ trợ tra cứu người dùng theo loại dị ứng
    CREATE INDEX IX_USER_ALLERGY_allergy_id
        ON dbo.USER_ALLERGY (allergy_id);

    -- Hỗ trợ lấy lịch sử BMI theo người dùng và thời gian
    CREATE INDEX IX_BMI_RECORD_user_calculated_at
        ON dbo.BMI_RECORD (user_id, calculated_at DESC);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
USE ChayBook_Project;
GO

-- 1. Bổ sung cột status cho bảng CATEGORY (nếu chưa có)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'status' AND Object_ID = Object_ID(N'CATEGORY')
)
BEGIN
    ALTER TABLE CATEGORY
    ADD status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_CATEGORY_STATUS DEFAULT N'ACTIVE',
        CONSTRAINT CK_CATEGORY_STATUS
            CHECK (status IN (N'ACTIVE', N'DELETED'));
END
GO

-- 2. Bổ sung cột status cho bảng RECIPE (nếu chưa có)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'status' AND Object_ID = Object_ID(N'RECIPE')
)
BEGIN
    ALTER TABLE RECIPE
    ADD status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_RECIPE_STATUS DEFAULT N'ACTIVE',
        CONSTRAINT CK_RECIPE_STATUS
            CHECK (status IN (N'ACTIVE', N'DELETED'));
END
GO

-- 3. Bổ sung cột status và các trường phân cấp cho bảng COMMENT (nếu chưa có)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'status' AND Object_ID = Object_ID(N'COMMENT')
)
BEGIN
    ALTER TABLE dbo.[COMMENT]
    ADD
        parent_comment_id INT NULL,
        reply_to_comment_id INT NULL,
        status VARCHAR(20) NOT NULL
            CONSTRAINT DF_COMMENT_STATUS DEFAULT ('ACTIVE'),
        edited_at DATETIME2 NULL;
END
GO

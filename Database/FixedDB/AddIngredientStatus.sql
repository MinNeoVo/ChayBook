USE ChayBook_Project;
GO

IF COL_LENGTH(N'dbo.INGREDIENT', N'status') IS NULL
BEGIN
    ALTER TABLE dbo.INGREDIENT
    ADD status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_INGREDIENT_Status
        DEFAULT N'ACTIVE' WITH VALUES;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_INGREDIENT_Status'
      AND parent_object_id = OBJECT_ID(N'dbo.INGREDIENT')
)
BEGIN
    ALTER TABLE dbo.INGREDIENT WITH CHECK
    ADD CONSTRAINT CK_INGREDIENT_Status
        CHECK (status IN (N'ACTIVE', N'DELETED'));
END;
GO

SELECT ingredient_id, name, status
FROM dbo.INGREDIENT
ORDER BY ingredient_id;
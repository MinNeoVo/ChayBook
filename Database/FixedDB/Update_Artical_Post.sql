USE ChayBook_Project;
GO

IF COL_LENGTH('dbo.ARTICLE', 'media_type') IS NULL
    ALTER TABLE dbo.ARTICLE
    ADD media_type VARCHAR(10) NULL;

IF COL_LENGTH('dbo.ARTICLE', 'media_public_id') IS NULL
    ALTER TABLE dbo.ARTICLE
    ADD media_public_id VARCHAR(255) NULL;

IF COL_LENGTH('dbo.POST', 'media_type') IS NULL
    ALTER TABLE dbo.POST
    ADD media_type VARCHAR(10) NULL;

IF COL_LENGTH('dbo.POST', 'media_public_id') IS NULL
    ALTER TABLE dbo.POST
    ADD media_public_id VARCHAR(255) NULL;
GO
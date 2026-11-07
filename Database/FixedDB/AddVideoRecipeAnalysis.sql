USE ChayBook_Project;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE dbo.VIDEO_SUBMISSION (
    submission_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,

    source_type VARCHAR(20) NOT NULL,
    source_url NVARCHAR(2048) NULL,
    storage_key NVARCHAR(255) NULL,
    duration_seconds DECIMAL(10,3) NOT NULL,

    include_summary BIT NOT NULL DEFAULT 0,
    dietary_rule VARCHAR(20) NOT NULL,
    policy_version VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    decision_code VARCHAR(80) NULL,
    review_json NVARCHAR(MAX) NULL,
    error_code VARCHAR(80) NULL,

    attempt_token UNIQUEIDENTIFIER NULL,
    lease_until DATETIME2 NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_VIDEO_SUBMISSION_USER
        FOREIGN KEY (user_id) REFERENCES dbo.[USER](user_id),

    CONSTRAINT CK_VIDEO_SUBMISSION_SOURCE
        CHECK (
            (source_type = 'UPLOAD'
             AND storage_key IS NOT NULL
             AND source_url IS NULL)
            OR
            (source_type = 'YOUTUBE'
             AND source_url IS NOT NULL
             AND storage_key IS NULL)
        ),

    CONSTRAINT CK_VIDEO_SUBMISSION_DURATION
        CHECK (duration_seconds > 0),

    CONSTRAINT CK_VIDEO_SUBMISSION_STATUS
        CHECK (status IN (
            'QUEUED', 'CHECKING', 'ACCEPTED',
            'REJECTED', 'UNDETERMINED', 'FAILED'
        )),

    CONSTRAINT CK_VIDEO_SUBMISSION_REVIEW_JSON
        CHECK (review_json IS NULL OR ISJSON(review_json) = 1)
);

CREATE TABLE dbo.VIDEO_RECIPE_ANALYSIS (
    analysis_id INT IDENTITY(1,1) PRIMARY KEY,
    submission_id INT NOT NULL UNIQUE,

    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    extracted_json NVARCHAR(MAX) NULL,
    draft_json NVARCHAR(MAX) NULL,
    error_code VARCHAR(80) NULL,

    version BIGINT NOT NULL DEFAULT 0,
    attempt_token UNIQUEIDENTIFIER NULL,
    lease_until DATETIME2 NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_VIDEO_ANALYSIS_SUBMISSION
        FOREIGN KEY (submission_id)
        REFERENCES dbo.VIDEO_SUBMISSION(submission_id),

    CONSTRAINT CK_VIDEO_ANALYSIS_STATUS
        CHECK (status IN (
            'QUEUED', 'PROCESSING', 'READY', 'PARTIAL',
            'NO_RECIPE', 'FAILED', 'CONFIRMED'
        )),

    CONSTRAINT CK_VIDEO_ANALYSIS_EXTRACTED_JSON
        CHECK (extracted_json IS NULL OR ISJSON(extracted_json) = 1),

    CONSTRAINT CK_VIDEO_ANALYSIS_DRAFT_JSON
        CHECK (draft_json IS NULL OR ISJSON(draft_json) = 1)
);

CREATE TABLE dbo.USER_RECIPE (
    user_recipe_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    analysis_id INT NOT NULL UNIQUE,

    name NVARCHAR(255) NOT NULL,
    recipe_json NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_USER_RECIPE_USER
        FOREIGN KEY (user_id) REFERENCES dbo.[USER](user_id),

    CONSTRAINT FK_USER_RECIPE_ANALYSIS
        FOREIGN KEY (analysis_id)
        REFERENCES dbo.VIDEO_RECIPE_ANALYSIS(analysis_id),

    CONSTRAINT CK_USER_RECIPE_JSON
        CHECK (ISJSON(recipe_json) = 1)
);

CREATE INDEX IX_VIDEO_SUBMISSION_QUEUE
    ON dbo.VIDEO_SUBMISSION(status, created_at);

CREATE INDEX IX_VIDEO_ANALYSIS_QUEUE
    ON dbo.VIDEO_RECIPE_ANALYSIS(status, created_at);

CREATE INDEX IX_USER_RECIPE_OWNER
    ON dbo.USER_RECIPE(user_id, created_at);

COMMIT TRANSACTION;
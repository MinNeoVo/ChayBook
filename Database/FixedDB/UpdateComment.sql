-- KIỂM TRA DỮ LIỆU CŨ:
-- Kết quả không có dòng nào thì có thể tiếp tục.
-- Nếu có dòng trả về, cần xử lý dữ liệu đó trước khi đặt NOT NULL.
SELECT comment_id, post_id, user_id, created_at
FROM dbo.[COMMENT]
WHERE post_id IS NULL
   OR user_id IS NULL
   OR created_at IS NULL;

-- NỘI DUNG TIẾNG VIỆT.
ALTER TABLE dbo.[COMMENT]
ALTER COLUMN content NVARCHAR(MAX) NOT NULL;
GO

-- MỖI COMMENT PHẢI THUỘC 1 BÀI VIẾT VÀ 1 NGƯỜI VIẾT.
ALTER TABLE dbo.[COMMENT]
ALTER COLUMN post_id INT NOT NULL;

ALTER TABLE dbo.[COMMENT]
ALTER COLUMN user_id INT NOT NULL;

ALTER TABLE dbo.[COMMENT]
ALTER COLUMN created_at DATETIME NOT NULL;
GO

ALTER TABLE dbo.[COMMENT]
ADD
    parent_comment_id INT NULL,
    reply_to_comment_id INT NULL,
    status VARCHAR(20) NOT NULL
        CONSTRAINT DF_COMMENT_STATUS DEFAULT ('ACTIVE'),
    edited_at DATETIME2 NULL;
GO

ALTER TABLE dbo.[COMMENT]
ADD CONSTRAINT FK_COMMENT_PARENT
    FOREIGN KEY (parent_comment_id)
    REFERENCES dbo.[COMMENT](comment_id);

ALTER TABLE dbo.[COMMENT]
ADD CONSTRAINT FK_COMMENT_REPLY_TO
    FOREIGN KEY (reply_to_comment_id)
    REFERENCES dbo.[COMMENT](comment_id);
GO

ALTER TABLE dbo.[COMMENT]
ADD CONSTRAINT CK_COMMENT_STATUS
    CHECK (status IN ('ACTIVE', 'DELETED'));

ALTER TABLE dbo.[COMMENT]
ADD CONSTRAINT CK_COMMENT_REPLY_STRUCTURE
    CHECK (
        (
            parent_comment_id IS NULL
            AND reply_to_comment_id IS NULL
        )
        OR
        (
            parent_comment_id IS NOT NULL
            AND reply_to_comment_id IS NOT NULL
        )
    );

ALTER TABLE dbo.[COMMENT]
ADD CONSTRAINT CK_COMMENT_NOT_SELF_PARENT
    CHECK (parent_comment_id <> comment_id);

ALTER TABLE dbo.[COMMENT]
ADD CONSTRAINT CK_COMMENT_NOT_SELF_REPLY
    CHECK (reply_to_comment_id <> comment_id);
GO

CREATE INDEX IX_COMMENT_POST_PARENT_CREATED
ON dbo.[COMMENT] (
    post_id,
    parent_comment_id,
    created_at DESC,
    comment_id DESC
)
INCLUDE (status, user_id);
GO

CREATE INDEX IX_COMMENT_PARENT_STATUS_CREATED
ON dbo.[COMMENT] (
    parent_comment_id,
    status,
    created_at,
    comment_id
)
INCLUDE (post_id);
GO
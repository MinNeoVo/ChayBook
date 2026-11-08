package com.chaybook.backend.notification.repository;

import com.chaybook.backend.notification.dto.NotificationItemResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbcTemplate;
    private final AtomicBoolean tableChecked = new AtomicBoolean(false);

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void ensureTableExists() {
        if (tableChecked.get()) {
            return;
        }
        try {
            jdbcTemplate.execute("""
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
                            CONSTRAINT FK_NOTIFICATION_RECIPIENT FOREIGN KEY (recipient_user_id) REFERENCES dbo.[USER](user_id),
                            CONSTRAINT FK_NOTIFICATION_ACTOR FOREIGN KEY (actor_user_id) REFERENCES dbo.[USER](user_id),
                            CONSTRAINT FK_NOTIFICATION_POST FOREIGN KEY (post_id) REFERENCES dbo.POST(post_id)
                        );
                        CREATE INDEX IX_NOTIFICATION_RECIPIENT_CREATED
                            ON dbo.NOTIFICATION(recipient_user_id, is_read, created_at DESC);
                    END
                    """);
            tableChecked.set(true);
        } catch (Exception ignored) {
            // In H2 or mock test environments where SQL Server DDL syntax differs
        }
    }

    public List<Integer> findActiveAdminUserIds() {
        return jdbcTemplate.query(
                "SELECT user_id FROM [USER] WHERE UPPER(role) = 'ADMIN' AND UPPER(status) = 'ACTIVE'",
                (rs, rowNum) -> rs.getInt("user_id")
        );
    }

    public PostOwnerInfo findPostOwnerInfo(Integer postId) {
        List<PostOwnerInfo> rows = jdbcTemplate.query(
                "SELECT user_id, title FROM POST WHERE post_id = ?",
                (rs, rowNum) -> new PostOwnerInfo(
                        rs.getObject("user_id") == null ? null : rs.getInt("user_id"),
                        rs.getString("title")
                ),
                postId
        );
        return rows.isEmpty() ? null : rows.getFirst();
    }

    public void insertNotification(
            Integer recipientUserId,
            Integer actorUserId,
            Integer postId,
            String type,
            String title,
            String message,
            String targetUrl
    ) {
        ensureTableExists();
        jdbcTemplate.update(
                """
                INSERT INTO NOTIFICATION
                    (recipient_user_id, actor_user_id, post_id, type, title, message, target_url, is_read, created_at)
                VALUES
                    (?, ?, ?, ?, ?, ?, ?, 0, GETDATE())
                """,
                recipientUserId,
                actorUserId,
                postId,
                type,
                title,
                message,
                targetUrl
        );
    }

    public List<NotificationItemResponse> findByRecipientUserId(Integer recipientUserId, int limit) {
        ensureTableExists();
        return jdbcTemplate.query(
                """
                SELECT TOP (?)
                    notification_id,
                    post_id,
                    type,
                    title,
                    message,
                    target_url,
                    is_read,
                    created_at
                FROM NOTIFICATION
                WHERE recipient_user_id = ?
                ORDER BY created_at DESC, notification_id DESC
                """,
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp("created_at");
                    LocalDateTime createdAt = ts == null ? null : ts.toLocalDateTime();
                    return new NotificationItemResponse(
                            rs.getInt("notification_id"),
                            rs.getObject("post_id") == null ? null : rs.getInt("post_id"),
                            rs.getString("type"),
                            rs.getString("title"),
                            rs.getString("message"),
                            rs.getString("target_url"),
                            rs.getBoolean("is_read"),
                            createdAt
                    );
                },
                limit,
                recipientUserId
        );
    }

    public long countUnreadByRecipientUserId(Integer recipientUserId) {
        ensureTableExists();
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT_BIG(*) FROM NOTIFICATION WHERE recipient_user_id = ? AND is_read = 0",
                Long.class,
                recipientUserId
        );
        return count == null ? 0L : count;
    }

    public int markAsRead(Integer notificationId, Integer recipientUserId) {
        ensureTableExists();
        return jdbcTemplate.update(
                "UPDATE NOTIFICATION SET is_read = 1 WHERE notification_id = ? AND recipient_user_id = ?",
                notificationId,
                recipientUserId
        );
    }

    public int markAllAsRead(Integer recipientUserId) {
        ensureTableExists();
        return jdbcTemplate.update(
                "UPDATE NOTIFICATION SET is_read = 1 WHERE recipient_user_id = ? AND is_read = 0",
                recipientUserId
        );
    }

    public record PostOwnerInfo(Integer userId, String title) {
    }
}


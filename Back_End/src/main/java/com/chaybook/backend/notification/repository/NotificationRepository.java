package com.chaybook.backend.notification.repository;

import com.chaybook.backend.notification.dto.NotificationItemResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Repository
public class NotificationRepository {

    private static final Logger log = LoggerFactory.getLogger(NotificationRepository.class);

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
        } catch (Exception exception) {
            log.warn("Không thể kiểm tra/khởi tạo bảng NOTIFICATION: {}", exception.getMessage());
        }
    }

    /**
     * Đồng bộ tự động các bài viết đang chờ duyệt (PENDING) thành thông báo cho Admin
     * và các bài viết đã được Admin duyệt (APPROVED / REJECTED) thành thông báo cho User
     * nếu chưa tồn tại bản ghi thông báo tương ứng trong bảng NOTIFICATION.
     */
    public void syncNotificationsForUser(Integer userId) {
        ensureTableExists();
        try {
            List<String> roles = jdbcTemplate.query(
                    "SELECT UPPER(role) AS role FROM [USER] WHERE user_id = ?",
                    (rs, rowNum) -> rs.getString("role"),
                    userId
            );
            if (roles.isEmpty()) {
                return;
            }
            String role = roles.getFirst();

            if ("ADMIN".equals(role)) {
                // Tự động tạo thông báo cho Admin đối với các bài viết mới/đang chờ duyệt (PENDING)
                jdbcTemplate.update("""
                        INSERT INTO NOTIFICATION
                            (recipient_user_id, actor_user_id, post_id, type, title, message, target_url, is_read, created_at)
                        SELECT
                            ?,
                            p.user_id,
                            p.post_id,
                            N'NEW_POST_PENDING',
                            N'Bài viết mới chờ duyệt',
                            N'Người dùng ' + COALESCE(NULLIF(LTRIM(RTRIM(u.full_name)), N''), u.username, N'ẩn danh')
                                + N' vừa tạo bài viết "' + COALESCE(p.title, N'') + N'" đang chờ phê duyệt.',
                            N'/admin/posts-videos',
                            0,
                            COALESCE(p.created_at, GETDATE())
                        FROM POST p
                        LEFT JOIN [USER] u ON u.user_id = p.user_id
                        WHERE UPPER(p.status) = 'PENDING'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM NOTIFICATION n
                              WHERE n.recipient_user_id = ?
                                AND n.post_id = p.post_id
                                AND n.type = N'NEW_POST_PENDING'
                          )
                        """,
                        userId,
                        userId
                );
            } else {
                // Tự động tạo thông báo cho User khi bài viết của họ đã được Admin duyệt (APPROVED)
                jdbcTemplate.update("""
                        INSERT INTO NOTIFICATION
                            (recipient_user_id, actor_user_id, post_id, type, title, message, target_url, is_read, created_at)
                        SELECT
                            p.user_id,
                            NULL,
                            p.post_id,
                            N'POST_APPROVED',
                            N'Bài viết đã được duyệt',
                            N'Bài viết "' + COALESCE(p.title, N'') + N'" của bạn đã được Admin phê duyệt và hiển thị trên Cộng đồng.',
                            N'/community',
                            0,
                            COALESCE(p.updated_at, p.created_at, GETDATE())
                        FROM POST p
                        WHERE p.user_id = ?
                          AND UPPER(p.status) = 'APPROVED'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM NOTIFICATION n
                              WHERE n.recipient_user_id = p.user_id
                                AND n.post_id = p.post_id
                                AND n.type = N'POST_APPROVED'
                          )
                        """,
                        userId
                );

                // Tự động tạo thông báo cho User khi bài viết của họ bị từ chối (REJECTED)
                jdbcTemplate.update("""
                        INSERT INTO NOTIFICATION
                            (recipient_user_id, actor_user_id, post_id, type, title, message, target_url, is_read, created_at)
                        SELECT
                            p.user_id,
                            NULL,
                            p.post_id,
                            N'POST_REJECTED',
                            N'Bài viết chưa được duyệt',
                            N'Bài viết "' + COALESCE(p.title, N'') + N'" của bạn chưa được phê duyệt.',
                            N'/profile',
                            0,
                            COALESCE(p.updated_at, p.created_at, GETDATE())
                        FROM POST p
                        WHERE p.user_id = ?
                          AND UPPER(p.status) = 'REJECTED'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM NOTIFICATION n
                              WHERE n.recipient_user_id = p.user_id
                                AND n.post_id = p.post_id
                                AND n.type = N'POST_REJECTED'
                          )
                        """,
                        userId
                );
            }
        } catch (Exception exception) {
            log.warn("Không thể đồng bộ thông báo cho userId={}: {}", userId, exception.getMessage());
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

    public void insertNotificationIfAbsent(
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
                IF NOT EXISTS (
                    SELECT 1
                    FROM NOTIFICATION
                    WHERE recipient_user_id = ?
                      AND post_id = ?
                      AND type = ?
                )
                BEGIN
                    INSERT INTO NOTIFICATION
                        (recipient_user_id, actor_user_id, post_id, type, title, message, target_url, is_read, created_at)
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?, 0, GETDATE())
                END
                """,
                recipientUserId,
                postId,
                type,
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
                SELECT
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
                OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
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
                recipientUserId,
                limit
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

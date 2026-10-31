package com.chaybook.backend.admin.post.repository;

import com.chaybook.backend.admin.post.dto.AdminPostVideoResponse;
import com.chaybook.backend.admin.post.enums.AdminContentStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Repository
public class AdminPostVideoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    private static final String CONTENT_UNION = """
        SELECT
            p.post_id AS content_id,
            'POST' AS content_type,
            p.title AS title,
            CAST(COALESCE(p.content, N'') AS NVARCHAR(MAX)) AS description,
            COALESCE(NULLIF(LTRIM(RTRIM(u.full_name)), ''), u.username) AS creator,
            p.created_at AS submitted_at,
            p.status AS status,
            p.image_url AS thumbnail_url,
            CAST(NULL AS VARCHAR(255)) AS media_url,
            ai.result AS ai_result,
            ai.reason AS ai_reason,
            ai.confidence AS ai_confidence,
            ai.moderation_status AS moderation_status,
            admin_decision.reason AS admin_reason
        FROM POST p
        LEFT JOIN [USER] u ON u.user_id = p.user_id
        OUTER APPLY (
            SELECT TOP 1
                am.result,
                am.reason,
                am.confidence,
                am.moderation_status
            FROM AI_MODERATION am
            WHERE am.post_id = p.post_id
            ORDER BY am.created_at DESC, am.moderation_id DESC
        ) ai
        OUTER APPLY (
            SELECT TOP 1 d.reason
            FROM ADMIN_CONTENT_DECISION d
            WHERE d.post_id = p.post_id
              AND d.decision = 'REJECTED'
              AND UPPER(p.status) = 'REJECTED'
            ORDER BY d.decided_at DESC, d.decision_id DESC
        ) admin_decision

        UNION ALL

        SELECT
            v.video_id AS content_id,
            'VIDEO' AS content_type,
            v.title AS title,
            CAST(COALESCE(v.description, N'') AS NVARCHAR(MAX)) AS description,
            COALESCE(NULLIF(LTRIM(RTRIM(u.full_name)), ''), u.username) AS creator,
            v.created_at AS submitted_at,
            v.status AS status,
            v.thumbnail_url AS thumbnail_url,
            v.video_url AS media_url,
            ai.result AS ai_result,
            ai.reason AS ai_reason,
            ai.confidence AS ai_confidence,
            ai.moderation_status AS moderation_status,
            admin_decision.reason AS admin_reason
        FROM VIDEO v
        LEFT JOIN [USER] u ON u.user_id = v.created_by
        OUTER APPLY (
            SELECT TOP 1
                am.result,
                am.reason,
                am.confidence,
                am.moderation_status
            FROM AI_MODERATION am
            WHERE am.video_id = v.video_id
            ORDER BY am.created_at DESC, am.moderation_id DESC
        ) ai
        OUTER APPLY (
            SELECT TOP 1 d.reason
            FROM ADMIN_CONTENT_DECISION d
            WHERE d.video_id = v.video_id
              AND d.decision = 'REJECTED'
              AND UPPER(v.status) = 'REJECTED'
            ORDER BY d.decided_at DESC, d.decision_id DESC
        ) admin_decision
        """;

    private static final String FILTERED_CONTENT = """
            SELECT *
            FROM (%s) content
            WHERE UPPER(COALESCE(content.status, '')) <> :removedStatus
              AND (:contentType = 'ALL' OR content.content_type = :contentType)
              AND (:status IS NULL OR UPPER(content.status) = :status)
              AND (
                    :keyword = ''
                    OR LOWER(CAST(content.content_id AS VARCHAR(20))) LIKE :searchPattern
                    OR LOWER(content.title) LIKE :searchPattern
                    OR LOWER(COALESCE(content.creator, '')) LIKE :searchPattern
                    OR LOWER(COALESCE(content.description, '')) LIKE :searchPattern
              )
            """.formatted(CONTENT_UNION);

    public AdminPostVideoResponse.Page search(
            String contentType,
            String status,
            String keyword,
            int page,
            int size
    ) {
        String normalizedKeyword = keyword == null
                ? ""
                : keyword.strip().toLowerCase(Locale.ROOT);

        Query countQuery = entityManager.createNativeQuery(
                "SELECT COUNT_BIG(*) FROM (" + FILTERED_CONTENT + ") filtered"
        );
        bindFilters(countQuery, contentType, status, normalizedKeyword);

        long totalElements = ((Number) countQuery.getSingleResult()).longValue();
        int offset = page * size;
        String searchPattern = "%" + normalizedKeyword + "%";

        Query dataQuery = entityManager.createNativeQuery("""
                SELECT
                    content_id,
                    content_type,
                    title,
                    description,
                    creator,
                    submitted_at,
                    status,
                    thumbnail_url,
                    media_url,
                    ai_result,
                    ai_reason,
                    ai_confidence,
                    moderation_status,
                    admin_reason
                FROM (%s) filtered
                ORDER BY submitted_at DESC, content_type ASC, content_id DESC
                OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY
                """.formatted(FILTERED_CONTENT));

        bindFilters(dataQuery, contentType, status, normalizedKeyword);
        dataQuery.setParameter("offset", offset);
        dataQuery.setParameter("size", size);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = dataQuery.getResultList();

        List<AdminPostVideoResponse> items = rows.stream()
                .map(this::toResponse)
                .toList();

        int totalPages = totalElements == 0
                ? 0
                : (int) Math.ceil((double) totalElements / size);

        return new AdminPostVideoResponse.Page(
                items,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    public AdminPostVideoResponse.Statistics getStatistics() {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                SELECT
                    COUNT_BIG(*) AS total_submission,
                    COALESCE(SUM(CASE WHEN UPPER(status) = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_count,
                    COALESCE(SUM(CASE WHEN UPPER(status) = 'APPROVED' THEN 1 ELSE 0 END), 0) AS approved_count,
                    COALESCE(SUM(CASE WHEN UPPER(status) = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected_count
                FROM (
                    SELECT status FROM POST
                    UNION ALL
                    SELECT status FROM VIDEO
                ) submissions
                WHERE UPPER(COALESCE(status, '')) <> 'REMOVED'
                """).getSingleResult();

        return new AdminPostVideoResponse.Statistics(
                ((Number) row[0]).longValue(),
                ((Number) row[1]).longValue(),
                ((Number) row[2]).longValue(),
                ((Number) row[3]).longValue()
        );
    }

    public AdminPostVideoResponse findDetail(String type, Integer id) {
        Query query = entityManager.createNativeQuery("""
                SELECT content_id, content_type, title, description, creator,
                       submitted_at, 
                       status, 
                       thumbnail_url, 
                       media_url,
                       ai_result,
                       ai_reason,
                     ai_confidence,
                  moderation_status,
                     admin_reason
                FROM (%s) content
                WHERE content_type = :type AND content_id = :id
                  AND UPPER(COALESCE(status, '')) <> 'REMOVED'
                """.formatted(CONTENT_UNION));
        query.setParameter("type", type);
        query.setParameter("id", id);
        try {
            return toResponse((Object[]) query.getSingleResult());
        } catch (NoResultException exception) {
            return null;
        }
    }

    public String findStatus(String type, Integer id) {
        String sql = "POST".equals(type)
                ? "SELECT status FROM POST WHERE post_id = :id"
                : "SELECT status FROM VIDEO WHERE video_id = :id";

        try {
            Object result = entityManager.createNativeQuery(sql)
                    .setParameter("id", id)
                    .getSingleResult();
            return result == null ? null : result.toString();
        } catch (NoResultException exception) {
            return null;
        }
    }

    public int updateStatus(
            String type,
            Integer id,
            String currentStatus,
            String nextStatus
    ) {
        String sql = "POST".equals(type)
                ? """
                  UPDATE POST
                  SET status = :nextStatus, updated_at = GETDATE()
                  WHERE post_id = :id AND status = :currentStatus
                  """
                : """
                  UPDATE VIDEO
                  SET status = :nextStatus, updated_at = GETDATE()
                  WHERE video_id = :id AND status = :currentStatus
                  """;

        return entityManager.createNativeQuery(sql)
                .setParameter("nextStatus", nextStatus)
                .setParameter("currentStatus", currentStatus)
                .setParameter("id", id)
                .executeUpdate();
    }

    private void bindFilters(
            Query query,
            String contentType,
            String status,
            String keyword
    ) {
        query.setParameter("contentType", contentType);
        query.setParameter("status", status);
        query.setParameter("keyword", keyword);
        query.setParameter("searchPattern", "%" + keyword + "%");
        query.setParameter("removedStatus", AdminContentStatus.REMOVED.name());
    }

    private AdminPostVideoResponse toResponse(Object[] row) {
        return new AdminPostVideoResponse(
                ((Number) row[0]).intValue(),
                stringValue(row[1]),
                stringValue(row[2]),
                stringValue(row[3]),
                stringValue(row[4]),
                dateValue(row[5]),
                stringValue(row[6]),
                stringValue(row[7]),
                stringValue(row[8]),
                stringValue(row[9]),
                stringValue(row[10]),
                doubleValue(row[11]),
                stringValue(row[12]),
                stringValue(row[13])
        );
    }

    private Double doubleValue(Object value) {
        return value == null ? null : ((Number) value).doubleValue();
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private LocalDateTime dateValue(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }
        return LocalDateTime.parse(value.toString().replace(' ', 'T'));
    }


    public void insertDecision(
            String type,
            Integer contentId,
            Integer adminId,
            String previousStatus,
            String decision,
            String reason
    ) {
        boolean isPost = "POST".equals(type);
        boolean hasReason = reason != null && !reason.isBlank();

        String contentColumn = isPost ? "post_id" : "video_id";
        String reasonColumn = hasReason ? ", reason" : "";
        String reasonValue = hasReason ? ", :reason" : "";

        String sql = """
            INSERT INTO ADMIN_CONTENT_DECISION
                (%s, admin_id, previous_status, decision%s, decided_at)
            VALUES
                (:contentId, :adminId, :previousStatus, :decision%s, SYSDATETIME())
            """.formatted(contentColumn, reasonColumn, reasonValue);

        var query = entityManager.createNativeQuery(sql)
                .setParameter("contentId", contentId)
                .setParameter("adminId", adminId)
                .setParameter("previousStatus", previousStatus)
                .setParameter("decision", decision);

        if (hasReason) {
            query.setParameter("reason", reason.strip());
        }

        query.executeUpdate();
    }


    public int markLatestModerationReviewed(
            String type,
            Integer contentId,
            Integer adminId
    ) {
        boolean isPost = "POST".equals(type);
        String contentColumn = isPost ? "post_id" : "video_id";

        String sql = """
            UPDATE AI_MODERATION
            SET reviewed_by = :adminId,
                reviewed_at = SYSDATETIME()
            WHERE moderation_id = (
                SELECT TOP 1 moderation_id
                FROM AI_MODERATION
                WHERE %s = :contentId
                ORDER BY created_at DESC, moderation_id DESC
            )
            """.formatted(contentColumn);

        return entityManager.createNativeQuery(sql)
                .setParameter("adminId", adminId)
                .setParameter("contentId", contentId)
                .executeUpdate();
    }
}

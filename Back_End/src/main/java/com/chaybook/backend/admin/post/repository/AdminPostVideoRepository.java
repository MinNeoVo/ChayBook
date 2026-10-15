package com.chaybook.backend.admin.post.repository;

import com.chaybook.backend.admin.post.dto.AdminPostVideoResponse;
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
                CAST(NULL AS VARCHAR(255)) AS media_url
            FROM POST p
            LEFT JOIN [USER] u ON u.user_id = p.user_id

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
                v.video_url AS media_url
            FROM VIDEO v
            LEFT JOIN [USER] u ON u.user_id = v.created_by
            """;

    private static final String FILTERED_CONTENT = """
            SELECT *
            FROM (%s) content
            WHERE UPPER(COALESCE(content.status, '')) <> 'REMOVED'
              AND (:contentType = 'ALL' OR content.content_type = :contentType)
              AND (:status = 'ALL' OR UPPER(content.status) = :status)
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
                    media_url
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
                       submitted_at, status, thumbnail_url, media_url
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
                stringValue(row[8])
        );
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
}

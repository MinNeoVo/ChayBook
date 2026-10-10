package com.chaybook.backend.admin.dashboard.repository;

import com.chaybook.backend.community.entity.Post;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface AdminDashboardStatisticsRepository
        extends Repository<Post, Integer> {

    interface InteractionRateProjection {
        long getPostsWithInteractions();

        long getTotalApprovedPosts();
    }

    interface DailyInteractionProjection {
        LocalDate getActivityDate();

        long getLikeCount();

        long getBookmarkCount();

        long getCommentCount();
    }

    interface TopContributorProjection {
        Integer getUserId();

        String getDisplayName();

        String getAvatarUrl();

        long getContributionCount();
    }

    @Query(value = """
            SELECT
                COALESCE(
                    SUM(approved.hasInteraction),
                    CONVERT(BIGINT, 0)
                ) AS postsWithInteractions,
                COUNT_BIG(*) AS totalApprovedPosts
            FROM (
                SELECT CASE WHEN
                    EXISTS (
                        SELECT 1
                        FROM POST_INTERACTION pi
                        WHERE pi.post_id = p.post_id
                          AND pi.type IN ('LIKE', 'BOOKMARK')
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM [COMMENT] cm
                        WHERE cm.post_id = p.post_id
                        AND cm.status = 'ACTIVE'
                    )
                    THEN CONVERT(BIGINT, 1)
                    ELSE CONVERT(BIGINT, 0)
                END AS hasInteraction
                FROM POST p
                WHERE p.status = 'APPROVED'
            ) approved
            """, nativeQuery = true)
    InteractionRateProjection getInteractionRate();

    @Query(value = """
            SELECT
                daily.activity_date AS activityDate,
                SUM(daily.like_count) AS likeCount,
                SUM(daily.bookmark_count) AS bookmarkCount,
                SUM(daily.comment_count) AS commentCount
            FROM (
                SELECT
                    CAST(pi.created_at AS DATE) AS activity_date,
                    COUNT_BIG(*) AS like_count,
                    CONVERT(BIGINT, 0) AS bookmark_count,
                    CONVERT(BIGINT, 0) AS comment_count
                FROM POST_INTERACTION pi
                INNER JOIN POST p ON p.post_id = pi.post_id
                WHERE p.status = 'APPROVED'
                  AND pi.type = 'LIKE'
                  AND pi.created_at >= :fromInclusive
                  AND pi.created_at < :toExclusive
                GROUP BY CAST(pi.created_at AS DATE)

                UNION ALL

                SELECT
                    CAST(pi.created_at AS DATE) AS activity_date,
                    CONVERT(BIGINT, 0) AS like_count,
                    COUNT_BIG(*) AS bookmark_count,
                    CONVERT(BIGINT, 0) AS comment_count
                FROM POST_INTERACTION pi
                INNER JOIN POST p ON p.post_id = pi.post_id
                WHERE p.status = 'APPROVED'
                  AND pi.type = 'BOOKMARK'
                  AND pi.created_at >= :fromInclusive
                  AND pi.created_at < :toExclusive
                GROUP BY CAST(pi.created_at AS DATE)

                UNION ALL

                SELECT
                    CAST(cm.created_at AS DATE) AS activity_date,
                    CONVERT(BIGINT, 0) AS like_count,
                    CONVERT(BIGINT, 0) AS bookmark_count,
                    COUNT_BIG(*) AS comment_count
                FROM [COMMENT] cm
                INNER JOIN POST p ON p.post_id = cm.post_id
                WHERE p.status = 'APPROVED'
                  AND cm.status = 'ACTIVE'
                  AND cm.created_at >= :fromInclusive
                  AND cm.created_at < :toExclusive
                GROUP BY CAST(cm.created_at AS DATE)
            ) daily
            GROUP BY daily.activity_date
            ORDER BY daily.activity_date
            """, nativeQuery = true)
    List<DailyInteractionProjection> findDailyInteractions(
            @Param("fromInclusive") LocalDateTime fromInclusive,
            @Param("toExclusive") LocalDateTime toExclusive
    );

    @Query(value = """
            SELECT TOP 5
                u.user_id AS userId,
                COALESCE(
                    NULLIF(LTRIM(RTRIM(u.full_name)), ''),
                    u.username
                ) AS displayName,
                u.avatar_url AS avatarUrl,
                COUNT_BIG(p.post_id) AS contributionCount
            FROM [USER] u
            INNER JOIN POST p ON p.user_id = u.user_id
            WHERE u.role = 'USER'
              AND u.status = 'ACTIVE'
              AND p.status = 'APPROVED'
            GROUP BY u.user_id, u.full_name, u.username, u.avatar_url
            ORDER BY COUNT_BIG(p.post_id) DESC, u.user_id ASC
            """, nativeQuery = true)
    List<TopContributorProjection> findTopContributors();
}

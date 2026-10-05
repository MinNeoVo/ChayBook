package com.chaybook.backend.community.repository;

import com.chaybook.backend.community.entity.PostInteraction;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostInteractionRepository extends JpaRepository<PostInteraction, Integer> {
    interface InteractionCount {
        Integer getPostId();

        String getInteractionType();

        long getTotal();
    }

    interface CurrentUserInteraction {
        Integer getPostId();

        String getInteractionType();
    }

    @Query("""
            SELECT p.postId AS postId,
                   i.type AS interactionType,
                   COUNT(i) AS total
            FROM PostInteraction i
            JOIN i.post p
            LEFT JOIN p.category c
            WHERE p.status = 'APPROVED'
              AND (:categoryId IS NULL OR c.categoryId = :categoryId)
              AND i.type IN ('LIKE', 'BOOKMARK')
            GROUP BY p.postId, i.type
            """)
    List<InteractionCount> findInteractionCounts(
            @Param("categoryId") Integer categoryId
    );

    // Các bài mà người đang đăng nhập đã LIKE hoặc BOOKMARK.
    @Query("""
            SELECT DISTINCT p.postId AS postId,
                            i.type AS interactionType
            FROM PostInteraction i
            JOIN i.post p
            LEFT JOIN p.category c
            WHERE p.status = 'APPROVED'
              AND (:categoryId IS NULL OR c.categoryId = :categoryId)
              AND i.user.userId = :userId
              AND i.type IN ('LIKE', 'BOOKMARK')
            """)
    List<CurrentUserInteraction> findCurrentUserInteractions(
            @Param("categoryId") Integer categoryId,
            @Param("userId") Integer userId
    );

    boolean existsByPost_PostIdAndUser_UserIdAndType(
            Integer postId,
            Integer userId,
            String type
    );

    @Modifying
    @Query("""
        DELETE FROM PostInteraction i
        WHERE i.post.postId = :postId
          AND i.user.userId = :userId
          AND i.type = :type
        """)
    int deleteInteraction(
            @Param("postId") Integer postId,
            @Param("userId") Integer userId,
            @Param("type") String type
    );

    /**
     * Đếm tương tác (LIKE/BOOKMARK) cho tất cả bài viết của một user cụ thể.
     * Dùng cho trang Profile.
     */
    @Query("""
            SELECT p.postId AS postId,
                   i.type AS interactionType,
                   COUNT(i) AS total
            FROM PostInteraction i
            JOIN i.post p
            WHERE p.user.userId = :authorId
              AND p.status <> 'DELETED'
              AND i.type IN ('LIKE', 'BOOKMARK')
            GROUP BY p.postId, i.type
            """)
    List<InteractionCount> findInteractionCountsByAuthor(
            @Param("authorId") Integer authorId
    );

    /**
     * Các bài viết (của một author) mà người đăng nhập đã LIKE hoặc BOOKMARK.
     * Dùng cho trang Profile.
     */
    @Query("""
            SELECT DISTINCT p.postId AS postId,
                            i.type AS interactionType
            FROM PostInteraction i
            JOIN i.post p
            WHERE p.user.userId = :authorId
              AND p.status <> 'DELETED'
              AND i.user.userId = :currentUserId
              AND i.type IN ('LIKE', 'BOOKMARK')
            """)
    List<CurrentUserInteraction> findCurrentUserInteractionsByAuthor(
            @Param("authorId") Integer authorId,
            @Param("currentUserId") Integer currentUserId
    );

}

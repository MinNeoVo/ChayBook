package com.chaybook.backend.community.repository;

import com.chaybook.backend.community.entity.PostInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
}

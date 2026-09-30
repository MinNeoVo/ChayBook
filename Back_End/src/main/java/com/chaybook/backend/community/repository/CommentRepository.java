package com.chaybook.backend.community.repository;

import com.chaybook.backend.community.entity.Comment;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Integer> {
    interface CommentCount {
        Integer getPostId();

        long getTotal();
    }

    @Query("""
            SELECT p.postId AS postId,
                   COUNT(cm) AS total
            FROM Comment cm
            JOIN cm.post p
            LEFT JOIN p.category c
            WHERE p.status = 'APPROVED'
              AND (:categoryId IS NULL OR c.categoryId = :categoryId)
            GROUP BY p.postId
            """)
    List<CommentCount> findCommentCounts(
            @Param("categoryId") Integer categoryId
    );
}

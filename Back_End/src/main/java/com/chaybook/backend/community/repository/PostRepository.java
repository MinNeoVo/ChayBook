package com.chaybook.backend.community.repository;

import com.chaybook.backend.community.entity.Post;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {
    @Query("""
            SELECT p
            FROM Post p
            LEFT JOIN FETCH p.user
            LEFT JOIN FETCH p.category c
            WHERE p.status = 'APPROVED'
              AND (:categoryId IS NULL OR c.categoryId = :categoryId)
            ORDER BY p.createdAt DESC, p.postId DESC
            """)
    List<Post> findApprovedPosts(
            @Param("categoryId") Integer categoryId
    );
}

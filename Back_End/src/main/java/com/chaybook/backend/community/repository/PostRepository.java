package com.chaybook.backend.community.repository;

import com.chaybook.backend.community.entity.Post;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p
        FROM Post p
        WHERE p.postId = :postId
        """)
    Optional<Post> findByIdForUpdate(
            @Param("postId") Integer postId
    );

    @Query("""
            SELECT p
            FROM Post p
            LEFT JOIN FETCH p.user
            LEFT JOIN FETCH p.category
            WHERE p.user.userId = :userId
              AND p.status <> 'DELETED'
            ORDER BY p.createdAt DESC, p.postId DESC
            """)
    List<Post> findPostsByUserId(
            @Param("userId") Integer userId
    );
}

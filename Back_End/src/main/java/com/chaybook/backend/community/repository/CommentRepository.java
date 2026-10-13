package com.chaybook.backend.community.repository;

import com.chaybook.backend.community.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository
        extends JpaRepository<Comment, Integer> {

    String VISIBLE_ROOT_CONDITION = """
            c.post.postId = :postId
            AND c.parentComment IS NULL
            AND (
                c.status = 'ACTIVE'
                OR (
                    c.status = 'DELETED'
                    AND EXISTS (
                        SELECT r.commentId
                        FROM Comment r
                        WHERE r.parentComment = c
                          AND r.status = 'ACTIVE'
                    )
                )
            )
            """;

    @EntityGraph(attributePaths = {"user"})
    @Query(
            value = "SELECT c FROM Comment c WHERE "
                    + VISIBLE_ROOT_CONDITION
                    + " ORDER BY c.createdAt DESC, c.commentId DESC",
            countQuery = "SELECT COUNT(c) FROM Comment c WHERE "
                    + VISIBLE_ROOT_CONDITION
    )
    Page<Comment> findRootComments(
            @Param("postId") Integer postId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "user",
            "parentComment",
            "replyToComment",
            "replyToComment.user"
    })
    @Query(
            value = """
                    SELECT c
                    FROM Comment c
                    WHERE c.post.postId = :postId
                      AND c.parentComment.commentId = :rootId
                      AND c.status = 'ACTIVE'
                    ORDER BY c.createdAt ASC, c.commentId ASC
                    """,
            countQuery = """
                    SELECT COUNT(c)
                    FROM Comment c
                    WHERE c.post.postId = :postId
                      AND c.parentComment.commentId = :rootId
                      AND c.status = 'ACTIVE'
                    """
    )
    Page<Comment> findReplies(
            @Param("postId") Integer postId,
            @Param("rootId") Integer rootId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "user",
            "parentComment",
            "replyToComment",
            "replyToComment.user"
    })
    @Query("""
            SELECT c
            FROM Comment c
            WHERE c.commentId = :commentId
              AND c.post.postId = :postId
            """)
    Optional<Comment> findInPost(
            @Param("postId") Integer postId,
            @Param("commentId") Integer commentId
    );

    interface ReplyCount {
        Integer getRootId();

        long getTotal();
    }

    @Query("""
            SELECT c.parentComment.commentId AS rootId,
                   COUNT(c) AS total
            FROM Comment c
            WHERE c.parentComment.commentId IN :rootIds
              AND c.status = 'ACTIVE'
            GROUP BY c.parentComment.commentId
            """)
    List<ReplyCount> findReplyCounts(
            @Param("rootIds") List<Integer> rootIds
    );

    long countByPost_PostIdAndStatus(
            Integer postId,
            String status
    );

    long countByParentComment_CommentIdAndStatus(
            Integer rootId,
            String status
    );

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
              AND cm.status = 'ACTIVE'
              AND (:categoryId IS NULL OR c.categoryId = :categoryId)
            GROUP BY p.postId
            """)
    List<CommentCount> findCommentCounts(
            @Param("categoryId") Integer categoryId
    );

    @Query("""
            SELECT p.postId AS postId,
                   COUNT(cm) AS total
            FROM Comment cm
            JOIN cm.post p
            WHERE p.user.userId = :authorId
              AND p.status <> 'DELETED'
              AND cm.status = 'ACTIVE'
            GROUP BY p.postId
            """)
    List<CommentCount> findCommentCountsByAuthor(
            @Param("authorId") Integer authorId
    );

    @Query("""
            SELECT cm.post.postId AS postId,
                   COUNT(cm) AS total
            FROM Comment cm
            WHERE cm.post.postId IN :postIds
              AND cm.status = 'ACTIVE'
            GROUP BY cm.post.postId
            """)
    List<CommentCount> findCommentCountsByPostIds(
            @Param("postIds") List<Integer> postIds
    );
}
package com.chaybook.backend.video.repository;

import com.chaybook.backend.video.entity.VideoSubmission;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VideoSubmissionRepository
        extends JpaRepository<VideoSubmission, Integer> {

    @Query("""
        SELECT s FROM VideoSubmission s
        WHERE s.user.userId = :userId
          AND (s.status IN ('QUEUED', 'CHECKING')
            OR (s.status = 'ACCEPTED' AND EXISTS (
                SELECT a.analysisId FROM VideoAnalysis a
                WHERE a.submission = s AND a.status IN ('QUEUED', 'PROCESSING')
            )))
        ORDER BY s.createdAt ASC, s.submissionId ASC
        """)
    List<VideoSubmission> findActiveByUserId(@Param("userId") Integer userId, Pageable pageable);

    Optional<VideoSubmission> findBySubmissionIdAndUser_UserId(
            Integer submissionId,
            Integer userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s
        FROM VideoSubmission s
        WHERE s.submissionId = :submissionId
        """)
    Optional<VideoSubmission> findByIdForUpdate(
            @Param("submissionId") Integer submissionId
    );

    List<VideoSubmission>
    findByStatusOrderByCreatedAtAscSubmissionIdAsc(
            String status,
            Pageable pageable
    );

    List<VideoSubmission> findByStatusAndLeaseUntilBefore(
            String status,
            LocalDateTime time
    );
}

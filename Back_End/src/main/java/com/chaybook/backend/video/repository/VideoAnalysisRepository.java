package com.chaybook.backend.video.repository;

import com.chaybook.backend.video.entity.VideoAnalysis;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VideoAnalysisRepository
        extends JpaRepository<VideoAnalysis, Integer> {

    Optional<VideoAnalysis> findBySubmission_SubmissionId(
            Integer submissionId
    );

    @Query("""
        SELECT a
        FROM VideoAnalysis a
        JOIN FETCH a.submission s
        WHERE a.analysisId = :analysisId
          AND s.user.userId = :userId
        """)
    Optional<VideoAnalysis> findOwned(
            @Param("analysisId") Integer analysisId,
            @Param("userId") Integer userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT a
        FROM VideoAnalysis a
        WHERE a.analysisId = :analysisId
          AND a.submission.user.userId = :userId
        """)
    Optional<VideoAnalysis> findOwnedForUpdate(
            @Param("analysisId") Integer analysisId,
            @Param("userId") Integer userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT a
        FROM VideoAnalysis a
        WHERE a.analysisId = :analysisId
        """)
    Optional<VideoAnalysis> findByIdForUpdate(
            @Param("analysisId") Integer analysisId
    );

    List<VideoAnalysis>
    findByStatusOrderByCreatedAtAscAnalysisIdAsc(
            String status,
            Pageable pageable
    );

    List<VideoAnalysis> findByStatusAndLeaseUntilBefore(
            String status,
            LocalDateTime time
    );
}
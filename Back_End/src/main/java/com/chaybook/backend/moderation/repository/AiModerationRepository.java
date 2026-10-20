package com.chaybook.backend.moderation.repository;

import com.chaybook.backend.moderation.entity.AiModeration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiModerationRepository
        extends JpaRepository<AiModeration, Integer> {

    boolean existsByPost_PostId(Integer postId);
}
package com.chaybook.backend.moderation.service.impl;

import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.moderation.client.GroqModerationClient;
import com.chaybook.backend.moderation.dto.ModerationAssessment;
import com.chaybook.backend.moderation.entity.AiModeration;
import com.chaybook.backend.moderation.repository.AiModerationRepository;
import com.chaybook.backend.moderation.service.AiModerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiModerationServiceImpl implements AiModerationService {

    private static final Logger log =
            LoggerFactory.getLogger(AiModerationServiceImpl.class);

    private final AiModerationRepository moderationRepository;
    private final GroqModerationClient groqModerationClient;

    public AiModerationServiceImpl(
            AiModerationRepository moderationRepository,
            GroqModerationClient groqModerationClient
    ) {
        this.moderationRepository = moderationRepository;
        this.groqModerationClient = groqModerationClient;
    }

    @Override
    @Transactional
    public void moderatePost(Post post) {
        if (post == null || post.getPostId() == null) {
            throw new IllegalArgumentException(
                    "Post đã lưu và có ID mới được đưa đi moderation"
            );
        }

        if (moderationRepository.existsByPost_PostId(post.getPostId())) {
            log.info(
                    "AI moderation đã có sẵn cho postId={}",
                    post.getPostId()
            );
            return;
        }

        AiModeration moderation = new AiModeration();
        moderation.setPost(post);
        moderation.setModerationStatus("PROCESSING");

        moderation = moderationRepository.saveAndFlush(moderation);

        try {
            ModerationAssessment assessment =
                    groqModerationClient.evaluate(
                            post.getTitle(),
                            post.getContent()
                    );

            moderation.setResult(assessment.result());
            moderation.setReason(assessment.reason());
            moderation.setConfidence(assessment.confidence());
            moderation.setModerationStatus("COMPLETED");

        } catch (IllegalStateException exception) {
            // Giữ POST ở PENDING; chỉ đánh dấu lần xử lý AI bị lỗi.
            moderation.setModerationStatus("FAILED");

            log.error(
                    "AI moderation thất bại cho postId={}",
                    post.getPostId(),
                    exception
            );
        }

        moderationRepository.saveAndFlush(moderation);
    }
}
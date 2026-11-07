package com.chaybook.backend.moderation.service.impl;

import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.community.repository.PostRepository;
import com.chaybook.backend.moderation.dto.ModerationAssessment;
import com.chaybook.backend.moderation.entity.AiModeration;
import com.chaybook.backend.moderation.provider.ModerationProvider;
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
    private final PostRepository postRepository;
    private final ModerationProvider moderationProvider;

    public AiModerationServiceImpl(
            AiModerationRepository moderationRepository,
            PostRepository postRepository,
            ModerationProvider moderationProvider
    ) {
        this.moderationRepository = moderationRepository;
        this.postRepository = postRepository;
        this.moderationProvider = moderationProvider;
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
            ModerationAssessment assessment = moderationProvider.evaluate(
                    post.getTitle(),
                    post.getContent(),
                    post.getImageUrl()
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
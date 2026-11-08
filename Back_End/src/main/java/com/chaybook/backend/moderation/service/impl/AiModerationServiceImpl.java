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
import com.chaybook.backend.moderation.speech.SpeechToTextProvider;
import com.chaybook.backend.moderation.video.VideoAnalysis;
import com.chaybook.backend.moderation.video.VideoAnalyzer;
import java.util.List;


@Service
public class AiModerationServiceImpl implements AiModerationService {

    private static final Logger log =
            LoggerFactory.getLogger(AiModerationServiceImpl.class);

    private final AiModerationRepository moderationRepository;
    private final PostRepository postRepository;
    private final ModerationProvider moderationProvider;
    private final VideoAnalyzer videoAnalyzer;
    private final SpeechToTextProvider speechToTextProvider;

    public AiModerationServiceImpl(
            AiModerationRepository moderationRepository,
            PostRepository postRepository,
            ModerationProvider moderationProvider,
            VideoAnalyzer videoAnalyzer,
            SpeechToTextProvider speechToTextProvider
    ) {
        this.moderationRepository = moderationRepository;
        this.postRepository = postRepository;
        this.moderationProvider = moderationProvider;
        this.videoAnalyzer = videoAnalyzer;
        this.speechToTextProvider = speechToTextProvider;
    }

    @Override
    public void moderatePost(Integer postId) {
        if (postId == null) {
            throw new IllegalArgumentException("postId không được để trống");
        }

        if (moderationRepository.existsByPost_PostId(postId)) {
            log.info("AI moderation đã có sẵn cho postId={}", postId);
            return;
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy postId=" + postId
                ));

        AiModeration moderation = new AiModeration();
        moderation.setPost(post);
        moderation.setModerationStatus("PROCESSING");
        moderation = moderationRepository.saveAndFlush(moderation);

        try {
            String transcript = null;
            List<String> visualInputs = List.of();
            String processingFailure = null;

            if ("video".equalsIgnoreCase(post.getMediaType())) {
                VideoAnalysis videoAnalysis = videoAnalyzer.analyze(post.getImageUrl());
                visualInputs = videoAnalysis.frameDataUrls();

                if (videoAnalysis.hasFailure()) {
                    processingFailure = videoAnalysis.failureReason();
                }

                if (videoAnalysis.hasAudio()) {
                    try {
                        transcript = speechToTextProvider.transcribe(
                                videoAnalysis.audioBytes()
                        );

                        if (transcript == null || transcript.isBlank()) {
                            processingFailure = appendFailure(
                                    processingFailure,
                                    "Whisper không trích xuất được lời từ audio."
                            );
                        }
                    } catch (Exception exception) {
                        processingFailure = appendFailure(
                                processingFailure,
                                "Lỗi tại bước Speech-to-Text (Whisper)."
                        );
                        log.error("Whisper thất bại cho postId={}", postId, exception);
                    }
                }

                if (visualInputs == null || visualInputs.isEmpty()) {
                    processingFailure = appendFailure(
                            processingFailure,
                            "Không trích xuất được frame để kiểm tra hình ảnh."
                    );
                }

            } else if (post.getImageUrl() != null && !post.getImageUrl().isBlank()) {
                visualInputs = List.of(post.getImageUrl());
            }

            ModerationAssessment assessment = moderationProvider.evaluate(
                    post.getTitle(),
                    post.getContent(),
                    transcript,
                    visualInputs,
                    "video".equalsIgnoreCase(post.getMediaType())
            );

            if (processingFailure != null) {
                assessment = new ModerationAssessment(
                        "NEEDS_REVIEW",
                        assessment.reason()
                                + " "
                                + processingFailure
                                + " Admin vui lòng tự kiểm chứng nội dung.",
                        assessment.confidence()
                );
            }

            moderation.setResult(assessment.result());
            moderation.setReason(assessment.reason());
            moderation.setConfidence(assessment.confidence());
            moderation.setModerationStatus("COMPLETED");

        } catch (Exception exception) {
            moderation.setModerationStatus("FAILED");
            moderation.setResult("NEEDS_REVIEW");
            moderation.setReason(
                    "Không thể hoàn tất bước kiểm duyệt. "
                            + "Admin vui lòng tự kiểm chứng nội dung."
            );

            log.error(
                    "AI moderation thất bại cho postId={}",
                    postId,
                    exception
            );
        }

        moderationRepository.saveAndFlush(moderation);
    }

    private String appendFailure(String current, String next) {
        if (current == null || current.isBlank()) {
            return next;
        }
        return current + " " + next;
    }
}

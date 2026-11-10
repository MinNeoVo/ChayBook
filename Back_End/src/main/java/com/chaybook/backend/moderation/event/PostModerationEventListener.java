package com.chaybook.backend.moderation.event;

import com.chaybook.backend.moderation.service.AiModerationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class PostModerationEventListener {

    private static final Logger log =
            LoggerFactory.getLogger(PostModerationEventListener.class);

    private final AiModerationService moderationService;

    public PostModerationEventListener(AiModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(PostModerationRequestedEvent event) {
        try {
            moderationService.moderatePost(event.postId());
        } catch (Exception exception) {
            log.error(
                    "Không thể xử lý moderation cho postId={}",
                    event.postId(),
                    exception
            );
        }
    }
}
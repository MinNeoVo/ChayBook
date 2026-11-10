package com.chaybook.backend.video.service.impl;
import org.slf4j.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VideoJobScheduler {
    private static final Logger log = LoggerFactory.getLogger(VideoJobScheduler.class);
    private final VideoJobStore jobs;
    private final VideoProcessingService processing;
    private final PrivateVideoStorage storage;
    public VideoJobScheduler(VideoJobStore jobs, VideoProcessingService processing,
            PrivateVideoStorage storage) {
        this.jobs = jobs; this.processing = processing; this.storage = storage;
    }

    @Scheduled(fixedDelayString = "${chaybook.video.poll-delay-ms:3000}", scheduler = "videoScheduler")
    public void tick() {
        try {
            jobs.recoverExpired();
            processing.processAnalysis();
            processing.processReview();
        } catch (RuntimeException e) {
            log.warn("Video worker tick failed: {}", e.getClass().getSimpleName());
        }
    }

    @Scheduled(fixedDelayString = "${chaybook.video.cleanup-delay-ms:3600000}", scheduler = "videoScheduler")
    public void cleanup() {
        try { storage.removeExpired(); }
        catch (RuntimeException e) {
            log.warn("Video cleanup failed: {}", e.getClass().getSimpleName());
        }
    }
}

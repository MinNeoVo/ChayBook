package com.chaybook.backend.moderation.video;

public interface VideoAnalyzer {

    VideoAnalysis analyze(String videoUrl);
}
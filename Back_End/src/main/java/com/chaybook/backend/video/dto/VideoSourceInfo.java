package com.chaybook.backend.video.dto;
import java.math.BigDecimal;
public record VideoSourceInfo(
        String sourceType, String sourceUrl,
        String storageKey, BigDecimal durationSeconds
) {}

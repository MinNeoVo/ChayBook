package com.chaybook.backend.video.dto;

public record VideoEvidence(
        Integer startSecond,
        Integer endSecond,
        String description
) {
}
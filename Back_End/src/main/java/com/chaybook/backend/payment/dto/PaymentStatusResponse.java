package com.chaybook.backend.payment.dto;

import java.time.LocalDateTime;

public record PaymentStatusResponse(
        Long orderCode,
        String status,
        boolean isPro,
        LocalDateTime proExpiresAt,
        String message
) {
}


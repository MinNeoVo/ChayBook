package com.chaybook.backend.payment.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UserSubscriptionResponse(
        boolean isPro,
        String role,
        LocalDateTime proExpiresAt,
        Long daysRemaining,
        Integer dailyChatbotRemaining,
        List<PaymentHistoryItem> recentPayments
) {
    public record PaymentHistoryItem(
            Integer paymentId,
            Long orderCode,
            Integer amount,
            String planType,
            Integer durationDays,
            String status,
            LocalDateTime createdAt,
            LocalDateTime paidAt
    ) {
    }
}


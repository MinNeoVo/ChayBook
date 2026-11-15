package com.chaybook.backend.payment.dto;

public record PayosWebhookRequest(
        String code,
        String desc,
        WebhookData data,
        String signature
) {
    public record WebhookData(
            Long orderCode,
            Integer amount,
            String description,
            String accountNumber,
            String reference,
            String transactionDateTime,
            String currency,
            String paymentLinkId,
            String code,
            String desc
    ) {
    }
}

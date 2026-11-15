package com.chaybook.backend.payment.dto;

public record CreatePaymentResponse(
        Long orderCode,
        Integer amount,
        String checkoutUrl,
        String qrCode,
        String status,
        boolean isMock
) {
}


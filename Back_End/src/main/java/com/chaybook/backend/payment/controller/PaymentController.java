package com.chaybook.backend.payment.controller;

import com.chaybook.backend.payment.dto.CreatePaymentResponse;
import com.chaybook.backend.payment.dto.PaymentStatusResponse;
import com.chaybook.backend.payment.dto.PayosWebhookRequest;
import com.chaybook.backend.payment.dto.UserSubscriptionResponse;
import com.chaybook.backend.payment.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-payment-link")
    public ResponseEntity<CreatePaymentResponse> createPaymentLink(@AuthenticationPrincipal Jwt jwt) {
        Integer userId = requireUserId(jwt);
        return ResponseEntity.ok(paymentService.createPaymentLink(userId));
    }

    @GetMapping("/check-status/{orderCode}")
    public ResponseEntity<PaymentStatusResponse> checkPaymentStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long orderCode
    ) {
        Integer userId = requireUserId(jwt);
        return ResponseEntity.ok(paymentService.checkPaymentStatus(userId, orderCode));
    }

    @PostMapping("/simulate-success/{orderCode}")
    public ResponseEntity<PaymentStatusResponse> simulateSuccess(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long orderCode
    ) {
        Integer userId = requireUserId(jwt);
        return ResponseEntity.ok(paymentService.simulatePaymentSuccess(userId, orderCode));
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<UserSubscriptionResponse> getMySubscription(@AuthenticationPrincipal Jwt jwt) {
        Integer userId = requireUserId(jwt);
        return ResponseEntity.ok(paymentService.getMySubscription(userId));
    }

    @PostMapping("/payos-webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody PayosWebhookRequest payload) {
        boolean handled = paymentService.handleWebhook(payload);
        return ResponseEntity.ok(Map.of("success", handled, "message", handled ? "Webhook processed" : "Webhook ignored or invalid"));
    }

    private Integer requireUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để tiếp tục.");
        }
        try {
            return Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token đăng nhập không hợp lệ.");
        }
    }
}


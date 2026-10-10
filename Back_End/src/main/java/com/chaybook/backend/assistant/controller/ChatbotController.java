package com.chaybook.backend.assistant.controller;

import com.chaybook.backend.assistant.dto.ChatMessageRequest;
import com.chaybook.backend.assistant.dto.ChatMessageResponse;
import com.chaybook.backend.assistant.service.ChatbotService;
import com.chaybook.backend.assistant.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping(value = "/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestIdHeader,
            @RequestBody ChatMessageRequest payload,
            HttpServletRequest request) {

        try {
            // 1. Trích xuất User từ JWT (Bảo mật - Không truyền qua URL)
            Integer userId = null;
            if (jwt != null) {
                try {
                    userId = Integer.parseInt(jwt.getSubject());
                } catch (NumberFormatException e) {
                    throw new RuntimeException("JWT không hợp lệ: Subject không phải là ID.");
                }
            }

            // 2. Định danh Guest nếu không có JWT
            String guestId = guestIdHeader;
            if (guestId == null || guestId.trim().isEmpty()) {
                guestId = IpUtil.getClientIp(request);
            }

            if (userId == null && (guestId == null || guestId.trim().isEmpty())) {
                throw new IllegalArgumentException(
                        "Yêu cầu định danh khách vãng lai: Không thể xác định Guest ID hoặc IP.");
            }

            if (payload.getMessage() == null || payload.getMessage().trim().isEmpty()) {
                throw new IllegalArgumentException("Tin nhắn không được để trống.");
            }

            // 3. Gọi Service
            ChatMessageResponse reply = chatbotService.sendMessage(userId, guestId, payload);
            return ResponseEntity.ok(reply);

        } catch (Exception e) {
            System.err.println("========== LỖI TẠI CHATBOT CONTROLLER ==========");
            e.printStackTrace();
            System.err.println("================================================");
            throw new RuntimeException(e);
        }
    }
}
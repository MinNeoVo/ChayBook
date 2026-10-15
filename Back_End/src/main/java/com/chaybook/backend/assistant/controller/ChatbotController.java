package com.chaybook.backend.assistant.controller;

import com.chaybook.backend.assistant.dto.ChatMessageRequest;
import com.chaybook.backend.assistant.dto.ChatMessageResponse;
import com.chaybook.backend.assistant.service.ChatbotService;
import com.chaybook.backend.assistant.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import com.chaybook.backend.assistant.dto.ChatConversationResponse;
import com.chaybook.backend.assistant.dto.ChatHistoryMessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationResponse>> getConversations(
            @AuthenticationPrincipal Jwt jwt) {
        Integer userId = requireUserId(jwt);
        return ResponseEntity.ok(
                chatbotService.getUserConversations(userId));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<ChatHistoryMessageResponse>> getConversationMessages(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Integer conversationId) {
        Integer userId = requireUserId(jwt);
        return ResponseEntity.ok(
                chatbotService.getConversationMessages(userId, conversationId));
    }

    private Integer requireUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập để xem lịch sử hội thoại.");
        }

        try {
            return Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "JWT không chứa user ID hợp lệ.");
        }
    }

    @PostMapping(value = "/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestIdHeader,
            @RequestBody ChatMessageRequest payload,
            HttpServletRequest request) {

        // 1. Trích xuất User từ JWT (Bảo mật - Không truyền qua URL)
        Integer userId = null;
        if (jwt != null) {
            try {
                userId = Integer.parseInt(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "JWT không hợp lệ.");
            }
        }

        // 2. Định danh Guest nếu không có JWT
        String guestId = guestIdHeader;
        if (guestId == null || guestId.trim().isEmpty()) {
            guestId = IpUtil.getClientIp(request);
        }

        if (userId == null && (guestId == null || guestId.trim().isEmpty())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xác định mã khách hoặc địa chỉ IP.");
        }

        if (payload.getMessage() == null || payload.getMessage().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn không được để trống.");
        }

        // 3. Gọi Service
        ChatMessageResponse reply = chatbotService.sendMessage(userId, guestId, payload);
        return ResponseEntity.ok(reply);
    }
}
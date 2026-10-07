package com.chaybook.backend.assistant.controller;

import com.chaybook.backend.assistant.service.ChatbotService;
import com.chaybook.backend.assistant.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/messages")
    public ResponseEntity<String> sendMessage(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer conversationId,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestIdHeader,
            @RequestBody String userMessage,
            HttpServletRequest request) {

        try {
            String guestId = guestIdHeader;

            // Nếu React chưa gắn Header X-Guest-Id, fallback về bắt IP
            if (guestId == null || guestId.trim().isEmpty()) {
                guestId = IpUtil.getClientIp(request);
            }

            // Nếu là Guest thì phải xác định được ID (từ Header hoặc IP)
            if (userId == null && (guestId == null || guestId.trim().isEmpty())) {
                throw new IllegalArgumentException(
                        "Yêu cầu định danh khách vãng lai: Không thể xác định Guest ID hoặc IP.");
            }

            if (userMessage == null || userMessage.trim().isEmpty()) {
                throw new IllegalArgumentException("Tin nhắn không được để trống.");
            }

            String reply = chatbotService.sendMessage(userId, guestId, conversationId, userMessage);
            return ResponseEntity.ok(reply);

        } catch (Exception e) {
            System.err.println("========== LỖI TẠI CHATBOT CONTROLLER ==========");
            e.printStackTrace();
            System.err.println("================================================");
            throw new RuntimeException(e.getMessage());
        }
    }
}
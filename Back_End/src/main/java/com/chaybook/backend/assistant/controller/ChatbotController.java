package com.chaybook.backend.assistant.controller;

import com.chaybook.backend.assistant.service.ChatbotService;
import com.chaybook.backend.assistant.util.IpUtil;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;



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

            // Nếu React chưa gắn Header X-Guest-Id, fallback về IP
            if (guestId == null || guestId.trim().isEmpty()) {
                guestId = IpUtil.getClientIp(request);
            }

            // Nếu là Guest thì phải xác định được ID
            if (userId == null &&
                    (guestId == null || guestId.trim().isEmpty())) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Yêu cầu định danh khách vãng lai: Không thể xác định Guest ID hoặc IP."
                );
            }

            // Kiểm tra message
            if (userMessage == null || userMessage.trim().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Tin nhắn không được để trống."
                );
            }

            String reply = chatbotService.sendMessage(
                    userId,
                    guestId,
                    conversationId,
                    userMessage
            );

            return ResponseEntity.ok(reply);

        } catch (ResponseStatusException e) {
    throw e;

} catch (Exception e) {
    System.err.println("========== LỖI TẠI CHATBOT CONTROLLER ==========");
    e.printStackTrace();
    System.err.println("================================================");

    throw new ResponseStatusException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Có lỗi xảy ra khi xử lý yêu cầu AI.",
        e
    );
}
    }
}
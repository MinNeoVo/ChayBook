package com.chaybook.backend.admin.chatbot.controller;

import com.chaybook.backend.admin.chatbot.dto.ChatbotPromptResponse;
import com.chaybook.backend.admin.chatbot.dto.UpdateChatbotPromptRequest;
import com.chaybook.backend.admin.chatbot.service.ChatbotPromptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/chatbot/prompt")
public class AdminChatbotPromptController {
    private final ChatbotPromptService promptService;

    public AdminChatbotPromptController(ChatbotPromptService promptService) {
        this.promptService = promptService;
    }

    private Integer userId(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) throw new NumberFormatException();
            return Integer.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập");
        }
    }

    @GetMapping
    public ChatbotPromptResponse getPrompt(Authentication authentication) {
        return promptService.getPrompt(userId(authentication));
    }

    @PutMapping
    public ChatbotPromptResponse updatePrompt(@Valid @RequestBody UpdateChatbotPromptRequest request,
            Authentication authentication) {
        return promptService.updatePrompt(userId(authentication), request);
    }
}

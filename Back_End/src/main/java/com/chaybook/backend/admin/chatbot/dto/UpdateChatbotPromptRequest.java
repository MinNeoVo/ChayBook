package com.chaybook.backend.admin.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateChatbotPromptRequest(
        @NotBlank(message = "Prompt không được để trống")
        @Size(max = 20000, message = "Prompt tối đa 20.000 ký tự")
        String prompt) {
}

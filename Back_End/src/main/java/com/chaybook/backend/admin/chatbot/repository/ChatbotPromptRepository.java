package com.chaybook.backend.admin.chatbot.repository;

import com.chaybook.backend.admin.chatbot.entity.ChatbotPrompt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatbotPromptRepository extends JpaRepository<ChatbotPrompt, Integer> {
}

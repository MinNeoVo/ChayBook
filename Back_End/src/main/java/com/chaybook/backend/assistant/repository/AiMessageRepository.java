package com.chaybook.backend.assistant.repository;

import com.chaybook.backend.assistant.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Integer> {
    List<AiMessage> findByConversationConversationIdOrderByCreatedAtAsc(Integer conversationId);
}
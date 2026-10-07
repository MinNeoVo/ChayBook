package com.chaybook.backend.assistant.repository;

import com.chaybook.backend.assistant.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Integer> {
    List<AiConversation> findByUserUserIdOrderByUpdatedAtDesc(Integer userId);
}
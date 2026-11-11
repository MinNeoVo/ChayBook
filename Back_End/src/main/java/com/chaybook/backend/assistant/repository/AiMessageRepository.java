package com.chaybook.backend.assistant.repository;

import com.chaybook.backend.assistant.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Integer> {
    List<AiMessage> findByConversationConversationIdOrderByCreatedAtAsc(Integer conversationId);

    void deleteByConversationConversationId(Integer conversationId);

    @Modifying
    @Query("delete from AiMessage m where m.conversation.conversationId in " +
            "(select c.conversationId from AiConversation c where c.user.userId = :userId)")
    void deleteAllForUser(@Param("userId") Integer userId);
}

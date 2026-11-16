package com.chaybook.backend.admin.chatbot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "CHATBOT_PROMPT")
public class ChatbotPrompt {
    @Id
    @Column(name = "prompt_id")
    private Integer promptId;

    @Column(name = "prompt_text", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String promptText;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getPromptId() { return promptId; }
    public void setPromptId(Integer promptId) { this.promptId = promptId; }
    public String getPromptText() { return promptText; }
    public void setPromptText(String promptText) { this.promptText = promptText; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

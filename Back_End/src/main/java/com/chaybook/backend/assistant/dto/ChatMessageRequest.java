package com.chaybook.backend.assistant.dto;

public class ChatMessageRequest {
    private Integer conversationId;
    private String message;

    public ChatMessageRequest() {
    }

    public Integer getConversationId() {
        return conversationId;
    }

    public void setConversationId(Integer conversationId) {
        this.conversationId = conversationId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
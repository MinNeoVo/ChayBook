package com.chaybook.backend.assistant.dto;

public class ChatMessageResponse {
    private Integer conversationId;
    private Integer messageId;
    private String content;

    public ChatMessageResponse(Integer conversationId, Integer messageId, String content) {
        this.conversationId = conversationId;
        this.messageId = messageId;
        this.content = content;
    }

    public Integer getConversationId() {
        return conversationId;
    }

    public void setConversationId(Integer conversationId) {
        this.conversationId = conversationId;
    }

    public Integer getMessageId() {
        return messageId;
    }

    public void setMessageId(Integer messageId) {
        this.messageId = messageId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
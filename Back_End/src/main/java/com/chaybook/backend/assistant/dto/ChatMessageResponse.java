package com.chaybook.backend.assistant.dto;

public class ChatMessageResponse {
    private Integer conversationId;
    private Integer messageId;
    private String content;
    private Integer guestQuestionsRemaining;
    private Integer userQuestionsRemaining;
    private Boolean isPro;

    public ChatMessageResponse(
            Integer conversationId,
            Integer messageId,
            String content,
            Integer guestQuestionsRemaining) {
        this(conversationId, messageId, content, guestQuestionsRemaining, null, null);
    }

    public ChatMessageResponse(
            Integer conversationId,
            Integer messageId,
            String content,
            Integer guestQuestionsRemaining,
            Integer userQuestionsRemaining,
            Boolean isPro) {
        this.conversationId = conversationId;
        this.messageId = messageId;
        this.content = content;
        this.guestQuestionsRemaining = guestQuestionsRemaining;
        this.userQuestionsRemaining = userQuestionsRemaining;
        this.isPro = isPro;
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

    public Integer getGuestQuestionsRemaining() {
        return guestQuestionsRemaining;
    }

    public void setGuestQuestionsRemaining(Integer guestQuestionsRemaining) {
        this.guestQuestionsRemaining = guestQuestionsRemaining;
    }

    public Integer getUserQuestionsRemaining() {
        return userQuestionsRemaining;
    }

    public void setUserQuestionsRemaining(Integer userQuestionsRemaining) {
        this.userQuestionsRemaining = userQuestionsRemaining;
    }

    public Boolean getIsPro() {
        return isPro;
    }

    public void setIsPro(Boolean isPro) {
        this.isPro = isPro;
    }
}

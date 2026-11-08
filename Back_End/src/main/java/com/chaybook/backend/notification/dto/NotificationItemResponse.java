package com.chaybook.backend.notification.dto;

import java.time.LocalDateTime;

public record NotificationItemResponse(
        Integer notificationId,
        Integer postId,
        String type,
        String title,
        String message,
        String targetUrl,
        boolean isRead,
        LocalDateTime createdAt
) {
}


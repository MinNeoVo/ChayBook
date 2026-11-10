package com.chaybook.backend.notification.dto;

import java.util.List;

public record NotificationListResponse(
        long unreadCount,
        List<NotificationItemResponse> items
) {
}


package com.chaybook.backend.admin.user.dto;

public record UserStatisticsResponse(
        long totalAccounts,
        long activeAccounts,
        long disabledAccounts,
        long newAccountsThisWeek
) {
}

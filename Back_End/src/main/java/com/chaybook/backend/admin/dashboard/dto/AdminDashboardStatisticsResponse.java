package com.chaybook.backend.admin.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class AdminDashboardStatisticsResponse {

    private AdminDashboardStatisticsResponse() {
    }

    /**
     * The rate is the percentage of currently approved posts that have at
     * least one LIKE, BOOKMARK, or COMMENT. The denominator is every
     * currently approved post. A null rate means there are no approved posts.
     */
    public record InteractionRate(
            long postsWithInteractions,
            long totalApprovedPosts,
            BigDecimal ratePercent
    ) {
    }

    /**
     * Counts every persisted chatbot message, including USER prompts and AI
     * replies. Message contents are never included in this response.
     */
    public record AiMessageCount(
            long totalMessages,
            List<String> includedSenders
    ) {
    }

    /**
     * Dates and query boundaries use Asia/Ho_Chi_Minh. SQL Server stores these
     * event timestamps as local DATETIME values, so they are grouped by their
     * stored calendar date without converting or shifting them.
     */
    public record InteractionChart(
            int days,
            String timezone,
            List<InteractionChartDay> items
    ) {
    }

    public record InteractionChartDay(
            LocalDate date,
            long likeCount,
            long bookmarkCount,
            long commentCount,
            long totalCount
    ) {
    }

    /**
     * Contributors are ranked by the number of their currently approved
     * posts. Only ACTIVE USER accounts are eligible.
     */
    public record TopContributors(
            String metric,
            List<TopContributor> items
    ) {
    }

    public record TopContributor(
            int rank,
            int userId,
            String displayName,
            String avatarUrl,
            long contributionCount
    ) {
    }
}

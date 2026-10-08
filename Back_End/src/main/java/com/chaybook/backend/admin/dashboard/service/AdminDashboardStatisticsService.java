package com.chaybook.backend.admin.dashboard.service;

import com.chaybook.backend.admin.dashboard.dto.AdminDashboardStatisticsResponse;
import com.chaybook.backend.admin.dashboard.repository.AdminDashboardStatisticsRepository;
import com.chaybook.backend.assistant.repository.AiMessageRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.chaybook.backend.admin.dashboard.dto.AdminDashboardStatisticsResponse.*;

@Service
@Transactional(readOnly = true)
public class AdminDashboardStatisticsService {

    private static final ZoneId DASHBOARD_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String CONTRIBUTOR_METRIC =
            "Number of currently approved posts";

    private final AdminDashboardStatisticsRepository statisticsRepository;
    private final AiMessageRepository aiMessageRepository;
    private final UserRepository userRepository;

    public AdminDashboardStatisticsService(
            AdminDashboardStatisticsRepository statisticsRepository,
            AiMessageRepository aiMessageRepository,
            UserRepository userRepository
    ) {
        this.statisticsRepository = statisticsRepository;
        this.aiMessageRepository = aiMessageRepository;
        this.userRepository = userRepository;
    }

    public InteractionRate getInteractionRate(Integer authenticatedUserId) {
        requireActiveAdmin(authenticatedUserId);

        AdminDashboardStatisticsRepository.InteractionRateProjection counts =
                statisticsRepository.getInteractionRate();
        long denominator = counts.getTotalApprovedPosts();
        long numerator = counts.getPostsWithInteractions();

        BigDecimal ratePercent = denominator == 0
                ? null
                : BigDecimal.valueOf(numerator)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);

        return new InteractionRate(numerator, denominator, ratePercent);
    }

    public AiMessageCount getAiMessageCount(Integer authenticatedUserId) {
        requireActiveAdmin(authenticatedUserId);

        return new AiMessageCount(
                aiMessageRepository.count(),
                List.of("USER", "AI")
        );
    }

    public InteractionChart getInteractionChart(
            Integer authenticatedUserId,
            int days
    ) {
        requireActiveAdmin(authenticatedUserId);
        if (days != 7 && days != 30) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "days must be either 7 or 30"
            );
        }

        LocalDate lastDate = LocalDate.now(DASHBOARD_ZONE);
        LocalDate firstDate = lastDate.minusDays(days - 1L);
        LocalDateTime fromInclusive = firstDate.atStartOfDay();
        LocalDateTime toExclusive = lastDate.plusDays(1).atStartOfDay();

        List<AdminDashboardStatisticsRepository.DailyInteractionProjection> rows =
                statisticsRepository.findDailyInteractions(
                        fromInclusive,
                        toExclusive
                );
        Map<LocalDate, AdminDashboardStatisticsRepository.DailyInteractionProjection>
                rowsByDate = rows.stream().collect(Collectors.toMap(
                        AdminDashboardStatisticsRepository.DailyInteractionProjection::getActivityDate,
                        Function.identity()
                ));

        List<InteractionChartDay> items = new ArrayList<>(days);
        for (int index = 0; index < days; index++) {
            LocalDate date = firstDate.plusDays(index);
            AdminDashboardStatisticsRepository.DailyInteractionProjection row =
                    rowsByDate.get(date);
            long likes = row == null ? 0 : row.getLikeCount();
            long bookmarks = row == null ? 0 : row.getBookmarkCount();
            long comments = row == null ? 0 : row.getCommentCount();

            items.add(new InteractionChartDay(
                    date,
                    likes,
                    bookmarks,
                    comments,
                    likes + bookmarks + comments
            ));
        }

        return new InteractionChart(
                days,
                DASHBOARD_ZONE.getId(),
                items
        );
    }

    public TopContributors getTopContributors(Integer authenticatedUserId) {
        requireActiveAdmin(authenticatedUserId);

        List<TopContributor> items = statisticsRepository
                .findTopContributors()
                .stream()
                .map(row -> new TopContributor(
                        0,
                        row.getUserId(),
                        row.getDisplayName(),
                        row.getAvatarUrl(),
                        row.getContributionCount()
                ))
                .toList();

        List<TopContributor> rankedItems = new ArrayList<>(items.size());
        for (int index = 0; index < items.size(); index++) {
            TopContributor item = items.get(index);
            rankedItems.add(new TopContributor(
                    index + 1,
                    item.userId(),
                    item.displayName(),
                    item.avatarUrl(),
                    item.contributionCount()
            ));
        }

        return new TopContributors(CONTRIBUTOR_METRIC, rankedItems);
    }

    private User requireActiveAdmin(Integer authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user no longer exists"
                ));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())
                || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "An active administrator account is required"
            );
        }
        return user;
    }
}

package com.chaybook.backend.admin.dashboard.service;

import com.chaybook.backend.admin.dashboard.repository.AdminDashboardStatisticsRepository;
import com.chaybook.backend.assistant.repository.AiMessageRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardStatisticsServiceTest {

    private static final Integer ADMIN_ID = 12;
    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    @Mock
    private AdminDashboardStatisticsRepository statisticsRepository;
    @Mock
    private AiMessageRepository aiMessageRepository;
    @Mock
    private UserRepository userRepository;

    private User admin;
    private AdminDashboardStatisticsService service;

    @BeforeEach
    void setUp() {
        service = new AdminDashboardStatisticsService(
                statisticsRepository,
                aiMessageRepository,
                userRepository
        );
        admin = new User();
        admin.setRole("ADMIN");
        admin.setStatus("ACTIVE");
        when(userRepository.findById(ADMIN_ID))
                .thenReturn(Optional.of(admin));
    }

    @Test
    void interactionRateUsesApprovedPostsAsItsDenominator() {
        AdminDashboardStatisticsRepository.InteractionRateProjection counts =
                mock(AdminDashboardStatisticsRepository.InteractionRateProjection.class);
        when(counts.getPostsWithInteractions()).thenReturn(2L);
        when(counts.getTotalApprovedPosts()).thenReturn(5L);
        when(statisticsRepository.getInteractionRate()).thenReturn(counts);

        var response = service.getInteractionRate(ADMIN_ID);

        assertEquals(2, response.postsWithInteractions());
        assertEquals(5, response.totalApprovedPosts());
        assertEquals(0, response.ratePercent().compareTo(
                new java.math.BigDecimal("40.00")
        ));
    }

    @Test
    void interactionRateIsUndefinedWhenThereAreNoApprovedPosts() {
        AdminDashboardStatisticsRepository.InteractionRateProjection counts =
                mock(AdminDashboardStatisticsRepository.InteractionRateProjection.class);
        when(counts.getPostsWithInteractions()).thenReturn(0L);
        when(counts.getTotalApprovedPosts()).thenReturn(0L);
        when(statisticsRepository.getInteractionRate()).thenReturn(counts);

        var response = service.getInteractionRate(ADMIN_ID);

        assertNull(response.ratePercent());
    }

    @Test
    void aiMessageCountIncludesBothPersistedSendersWithoutLoadingMessages() {
        when(aiMessageRepository.count()).thenReturn(17L);

        var response = service.getAiMessageCount(ADMIN_ID);

        assertEquals(17, response.totalMessages());
        assertEquals(List.of("USER", "AI"), response.includedSenders());
        verify(aiMessageRepository).count();
    }

    @Test
    void interactionChartUsesVietnamLocalDatesAndFillsMissingDaysWithZero() {
        LocalDate today = LocalDate.now(VIETNAM_ZONE);
        AdminDashboardStatisticsRepository.DailyInteractionProjection todayRow =
                dailyRow(today, 2, 1, 3);
        AdminDashboardStatisticsRepository.DailyInteractionProjection olderRow =
                dailyRow(today.minusDays(2), 0, 1, 0);
        when(statisticsRepository.findDailyInteractions(
                org.mockito.ArgumentMatchers.any(LocalDateTime.class),
                org.mockito.ArgumentMatchers.any(LocalDateTime.class)
        )).thenReturn(List.of(olderRow, todayRow));

        var response = service.getInteractionChart(ADMIN_ID, 7);

        assertEquals(7, response.items().size());
        assertEquals("Asia/Ho_Chi_Minh", response.timezone());
        assertEquals(0, response.items().get(0).totalCount());
        assertEquals(1, response.items().get(4).totalCount());
        assertEquals(0, response.items().get(5).totalCount());
        assertEquals(6, response.items().get(6).totalCount());

        ArgumentCaptor<LocalDateTime> from =
                ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> to =
                ArgumentCaptor.forClass(LocalDateTime.class);
        verify(statisticsRepository).findDailyInteractions(
                from.capture(),
                to.capture()
        );
        assertEquals(response.items().get(0).date().atStartOfDay(), from.getValue());
        assertEquals(
                response.items().get(6).date().plusDays(1).atStartOfDay(),
                to.getValue()
        );
    }

    @Test
    void interactionChartRejectsUnsupportedRanges() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.getInteractionChart(ADMIN_ID, 14)
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void disabledAdminCannotReadStatistics() {
        admin.setStatus("DISABLED");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.getAiMessageCount(ADMIN_ID)
        );

        assertEquals(403, exception.getStatusCode().value());
    }

    private AdminDashboardStatisticsRepository.DailyInteractionProjection dailyRow(
            LocalDate date,
            long likes,
            long bookmarks,
            long comments
    ) {
        AdminDashboardStatisticsRepository.DailyInteractionProjection row =
                mock(AdminDashboardStatisticsRepository.DailyInteractionProjection.class);
        when(row.getActivityDate()).thenReturn(date);
        when(row.getLikeCount()).thenReturn(likes);
        when(row.getBookmarkCount()).thenReturn(bookmarks);
        when(row.getCommentCount()).thenReturn(comments);
        return row;
    }
}

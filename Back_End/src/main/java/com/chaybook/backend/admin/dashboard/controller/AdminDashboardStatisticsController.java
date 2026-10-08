package com.chaybook.backend.admin.dashboard.controller;

import com.chaybook.backend.admin.dashboard.dto.AdminDashboardStatisticsResponse;
import com.chaybook.backend.admin.dashboard.service.AdminDashboardStatisticsService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/dashboard/statistics")
public class AdminDashboardStatisticsController {

    private final AdminDashboardStatisticsService statisticsService;

    public AdminDashboardStatisticsController(
            AdminDashboardStatisticsService statisticsService
    ) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/interaction-rate")
    public ResponseEntity<AdminDashboardStatisticsResponse.InteractionRate>
    getInteractionRate(Authentication authentication) {
        return noStore(statisticsService.getInteractionRate(
                requireAuthenticatedUserId(authentication)
        ));
    }

    @GetMapping("/ai-messages")
    public ResponseEntity<AdminDashboardStatisticsResponse.AiMessageCount>
    getAiMessageCount(Authentication authentication) {
        return noStore(statisticsService.getAiMessageCount(
                requireAuthenticatedUserId(authentication)
        ));
    }

    @GetMapping("/interactions")
    public ResponseEntity<AdminDashboardStatisticsResponse.InteractionChart>
    getInteractionChart(
            @RequestParam(name = "days", defaultValue = "7") int days,
            Authentication authentication
    ) {
        return noStore(statisticsService.getInteractionChart(
                requireAuthenticatedUserId(authentication),
                days
        ));
    }

    @GetMapping("/top-contributors")
    public ResponseEntity<AdminDashboardStatisticsResponse.TopContributors>
    getTopContributors(Authentication authentication) {
        return noStore(statisticsService.getTopContributors(
                requireAuthenticatedUserId(authentication)
        ));
    }

    private Integer requireAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        try {
            int userId = Integer.parseInt(authentication.getName());
            if (userId <= 0) {
                throw new NumberFormatException();
            }
            return userId;
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user ID is invalid"
            );
        }
    }

    private <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }
}

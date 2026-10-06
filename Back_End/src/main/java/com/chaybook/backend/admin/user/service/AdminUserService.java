package com.chaybook.backend.admin.user.service;

import com.chaybook.backend.admin.user.dto.*;
import com.chaybook.backend.admin.user.exception.AdminUserException;
import com.chaybook.backend.common.pagination.PageResponse;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import com.chaybook.backend.user.repository.projection.UserStatisticsProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsers(
            int page,
            int size
    ) {
        if (page < 0) {
            throw new AdminUserException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be greater than or equal to zero"
            );
        }

        if (size < 1 || size > 100) {
            throw new AdminUserException(
                    HttpStatus.BAD_REQUEST,
                    "Size must be between 1 and 100"
            );
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "userId")
        );

        Page<User> users = userRepository.findByRoleIgnoreCase(
                "USER",
                pageable
        );

        Page<AdminUserResponse> responses =
                users.map(this::toResponse);

        return PageResponse.from(responses);
    }

    @Transactional
    public UpdateUserStatusResponse updateStatus(
            Integer userId,
            UpdateUserStatusRequest request
    ) {
        if (userId == null || userId <= 0) {
            throw new AdminUserException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid user ID"
            );
        }

        String newStatus = request.status();

        if (!"ACTIVE".equals(newStatus)
                && !"DISABLED".equals(newStatus)) {
            throw new AdminUserException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE or DISABLED"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AdminUserException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!"USER".equalsIgnoreCase(user.getRole())) {
            throw new AdminUserException(
                    HttpStatus.FORBIDDEN,
                    "Only USER accounts can be activated or disabled"
            );
        }

        if (!newStatus.equals(user.getStatus())) {
            user.setStatus(newStatus);
            userRepository.saveAndFlush(user);
        }

        return new UpdateUserStatusResponse(
                "User status updated successfully",
                user.getUserId(),
                user.getStatus()
        );
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public UserStatisticsResponse getStatistics() {
        // Chụp thời điểm hiện tại một lần theo giờ Việt Nam.
        LocalDateTime currentTime =
                LocalDateTime.now(VIETNAM_ZONE);

        // Thứ Hai gần nhất, lúc 00:00.
        LocalDateTime weekStart = currentTime.toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay();

        UserStatisticsProjection statistics =
                userRepository.getUserStatistics(
                        weekStart,
                        currentTime
                );

        return new UserStatisticsResponse(
                statistics.getTotalAccounts(),
                statistics.getActiveAccounts(),
                statistics.getDisabledAccounts(),
                statistics.getNewAccountsThisWeek()
        );
    }
}
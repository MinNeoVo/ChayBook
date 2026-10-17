package com.chaybook.backend.admin.user.controller;

import com.chaybook.backend.admin.user.dto.*;
import com.chaybook.backend.admin.user.service.AdminUserService;
import com.chaybook.backend.common.pagination.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import com.chaybook.backend.admin.user.exception.AdminUserException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> getUsers(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            Authentication authentication
    ) {
        requireAdmin(authentication);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminUserService.getUsers(page, size));
    }

    @PatchMapping(
            value = "/{userId}/status",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<UpdateUserStatusResponse> updateStatus(
            @PathVariable("userId") Integer userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        requireAdmin(authentication);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminUserService.updateStatus(userId, request));
    }

    @GetMapping("/statistics")
    public ResponseEntity<UserStatisticsResponse> getStatistics(Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminUserService.getStatistics());
    }

    private void requireAdmin(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) throw new NumberFormatException();
            adminUserService.requireActiveAdmin(Integer.valueOf(authentication.getName()));
        } catch (NumberFormatException exception) {
            throw new AdminUserException(HttpStatus.UNAUTHORIZED, "Please log in");
        }
    }
}

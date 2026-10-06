package com.chaybook.backend.admin.user.controller;

import com.chaybook.backend.admin.user.dto.AdminUserResponse;
import com.chaybook.backend.admin.user.dto.UpdateUserStatusRequest;
import com.chaybook.backend.admin.user.dto.UpdateUserStatusResponse;
import com.chaybook.backend.admin.user.dto.UserStatisticsResponse;
import com.chaybook.backend.admin.user.service.AdminUserService;
import com.chaybook.backend.common.pagination.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
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
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminUserService.updateStatus(userId, request));
    }

    @GetMapping("/statistics")
    public ResponseEntity<UserStatisticsResponse> getStatistics() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminUserService.getStatistics());
    }
}
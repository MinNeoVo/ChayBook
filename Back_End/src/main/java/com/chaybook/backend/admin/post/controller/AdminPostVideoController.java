package com.chaybook.backend.admin.post.controller;

import com.chaybook.backend.admin.post.dto.AdminPostVideoResponse;
import com.chaybook.backend.admin.post.service.AdminPostVideoService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/posts-videos")
public class AdminPostVideoController {

    private final AdminPostVideoService service;

    public AdminPostVideoController(AdminPostVideoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<AdminPostVideoResponse.Page> getSubmissions(
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "7") int size,
            Authentication authentication
    ) {
        return noStore(service.getSubmissions(
                authenticatedUserId(authentication),
                type,
                status,
                q,
                page,
                size
        ));
    }

    @GetMapping("/statistics")
    public ResponseEntity<AdminPostVideoResponse.Statistics> getStatistics(
            Authentication authentication
    ) {
        return noStore(service.getStatistics(
                authenticatedUserId(authentication)
        ));
    }

    @PatchMapping("/{type}/{contentId}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable String type,
            @PathVariable Integer contentId,
            @jakarta.validation.Valid @RequestBody AdminPostVideoResponse.StatusRequest request,
            Authentication authentication
    ) {
        service.updateStatus(
                authenticatedUserId(authentication),
                type,
                contentId,
                request.status()
        );
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @GetMapping("/{type}/{contentId}")
    public ResponseEntity<AdminPostVideoResponse> getDetail(
            @PathVariable String type,
            @PathVariable Integer contentId,
            Authentication authentication
    ) {
        return noStore(service.getDetail(authenticatedUserId(authentication), type, contentId));
    }

    private Integer authenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập"
            );
        }

        try {
            return Integer.parseInt(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Danh tính đăng nhập không hợp lệ"
            );
        }
    }

    private <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }
}

package com.chaybook.backend.video.controller;
import com.chaybook.backend.video.dto.UserRecipeResponse;
import com.chaybook.backend.video.service.UserRecipeService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/recipes")
public class UserRecipeController {
    private final UserRecipeService service;
    public UserRecipeController(UserRecipeService service) { this.service = service; }

    @GetMapping
    public Page<UserRecipeResponse> mine(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        return service.getMine(VideoAuthentication.requireUserId(jwt), page, size);
    }

    @GetMapping("/{userRecipeId}")
    public UserRecipeResponse detail(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("userRecipeId") Integer userRecipeId) {
        return service.getDetail(VideoAuthentication.requireUserId(jwt), userRecipeId);
    }
}

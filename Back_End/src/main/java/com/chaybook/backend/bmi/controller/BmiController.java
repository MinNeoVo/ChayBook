package com.chaybook.backend.bmi.controller;

import com.chaybook.backend.bmi.dto.BmiCreateRequest;
import com.chaybook.backend.bmi.dto.BmiHistoryItem;
import com.chaybook.backend.bmi.dto.BmiResponse;
import com.chaybook.backend.bmi.service.BmiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RequestMapping("/api")
@RestController
public class BmiController {

    private final BmiService bmiService;

    BmiController(BmiService bmiService) {
        this.bmiService = bmiService;
    }

    // API 1: POST /api/bmi
    @PostMapping("/api/bmi")
    public ResponseEntity<BmiResponse> createBmi(
            @Valid @RequestBody BmiCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        BmiResponse response = bmiService.createBmiRecord(
                requireAuthenticatedUserId(jwt),
                request
        );
        return ResponseEntity.ok(response);
    }

    // API 2: GET /api/users/{userId}/bmi/latest
    @GetMapping("/api/users/{userId}/bmi/latest")
    public ResponseEntity<BmiResponse> getLatestBmi(
            @PathVariable Integer userId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        BmiResponse response = bmiService.getLatestBmi(
                requireCurrentUser(userId, jwt)
        );
        return ResponseEntity.ok(response);
    }

    // API 3: GET /api/users/{userId}/bmi
    @GetMapping("/api/users/{userId}/bmi")
    public ResponseEntity<List<BmiHistoryItem>> getBmiHistory(
            @PathVariable Integer userId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        List<BmiHistoryItem> history = bmiService.getBmiHistory(
                requireCurrentUser(userId, jwt)
        );
        return ResponseEntity.ok(history);
    }

    private Integer requireCurrentUser(Integer requestedUserId, Jwt jwt) {
        Integer authenticatedUserId = requireAuthenticatedUserId(jwt);

        if (!authenticatedUserId.equals(requestedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only access your own BMI records"
            );
        }

        return authenticatedUserId;
    }

    private Integer requireAuthenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        try {
            return Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "The authenticated user ID is invalid",
                    exception
            );
        }
    }
}

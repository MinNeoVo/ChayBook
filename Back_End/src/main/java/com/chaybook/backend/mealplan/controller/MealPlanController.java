package com.chaybook.backend.mealplan.controller;

import com.chaybook.backend.mealplan.dto.MealPlanCreateRequest;
import com.chaybook.backend.mealplan.dto.MealPlanResponse;
import com.chaybook.backend.mealplan.service.MealPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {
    private final MealPlanService mealPlanService;

    public MealPlanController(MealPlanService mealPlanService) {
        this.mealPlanService = mealPlanService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MealPlanResponse generate(
            @Valid @RequestBody MealPlanCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return mealPlanService.generate(authenticatedUserId(jwt), request);
    }

    @GetMapping
    public List<MealPlanResponse> getPlans(@AuthenticationPrincipal Jwt jwt) {
        return mealPlanService.getPlans(authenticatedUserId(jwt));
    }

    @GetMapping("/{mealPlanId}")
    public MealPlanResponse getPlan(
            @PathVariable Integer mealPlanId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return mealPlanService.getPlan(authenticatedUserId(jwt), mealPlanId);
    }

    private Integer authenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        }
        try {
            return Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "The authenticated user ID is invalid", exception);
        }
    }
}

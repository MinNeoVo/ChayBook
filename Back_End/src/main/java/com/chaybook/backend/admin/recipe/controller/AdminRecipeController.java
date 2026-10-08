package com.chaybook.backend.admin.recipe.controller;

import com.chaybook.backend.admin.recipe.service.AdminRecipeService;
import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.exception.RecipeException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/admin/recipes")
public class AdminRecipeController {

    private static final Logger log =
            LoggerFactory.getLogger(AdminRecipeController.class);

    private final AdminRecipeService adminRecipeService;

    public AdminRecipeController(AdminRecipeService adminRecipeService) {
        this.adminRecipeService = adminRecipeService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RecipeCreateResponse> createRecipe(
            @Valid @RequestBody RecipeWriteRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer authenticatedUserId = requireAuthenticatedUserId(jwt);

        RecipeCreateResponse response =
                adminRecipeService.createRecipe(
                        authenticatedUserId,
                        request
                );

        return ResponseEntity
                .created(URI.create("/api/recipes/" + response.recipeId()))
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PutMapping(
            value = "/{recipeId}",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<RecipeUpdateResponse> updateRecipe(
            @PathVariable("recipeId") Integer recipeId,
            @Valid @RequestBody RecipeWriteRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer authenticatedUserId = requireAuthenticatedUserId(jwt);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminRecipeService.updateRecipe(
                        recipeId,
                        authenticatedUserId,
                        request
                ));
    }

    @DeleteMapping("/{recipeId}")
    public ResponseEntity<RecipeDeleteResponse> deleteRecipe(
            @PathVariable("recipeId") Integer recipeId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer authenticatedUserId = requireAuthenticatedUserId(jwt);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(adminRecipeService.deleteRecipe(
                        recipeId,
                        authenticatedUserId
                ));
    }

    private Integer requireAuthenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new RecipeException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        try {
            int userId = Integer.parseInt(jwt.getSubject());

            if (userId > 0) {
                return userId;
            }
        } catch (NumberFormatException exception) {
            log.warn(
                    "Cannot parse authenticated user ID for admin recipe request",
                    exception
            );
        }

        throw new RecipeException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authentication information"
        );
    }
}
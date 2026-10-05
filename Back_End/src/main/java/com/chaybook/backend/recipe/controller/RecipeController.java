package com.chaybook.backend.recipe.controller;


import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.exception.RecipeException;
import com.chaybook.backend.recipe.service.RecipeService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @GetMapping({"", "/"})
    public ResponseEntity<List<RecipeSummaryResponse>> getRecipes(
            @RequestParam(
                    name = "categoryId",
                    required = false
            ) Integer categoryId,
            @RequestParam(
                    name = "keyword",
                    required = false
            ) String keyword
    ) {
        return ResponseEntity.ok(
                recipeService.getRecipes(categoryId, keyword)
        );
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDetailResponse> getRecipeDetail(
            @PathVariable("recipeId") Integer recipeId
    ) {
        return ResponseEntity.ok(
                recipeService.getRecipeDetail(recipeId)
        );
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RecipeCreateResponse> createRecipe(
            @Valid @RequestBody RecipeWriteRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {

        Integer authenticatedUserId =
                requireAuthenticatedUserId(jwt);

        RecipeCreateResponse response = recipeService.createRecipe(
                authenticatedUserId,
                request
        );

        return ResponseEntity
                .created(URI.create("/api/recipes/" + response.recipeId()))
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
        Integer authenticatedUserId =
                requireAuthenticatedUserId(jwt);

        return ResponseEntity.ok(
                recipeService.updateRecipe(
                        recipeId,
                        authenticatedUserId,
                        request
                )
        );
    }

    @DeleteMapping("/{recipeId}")
    public ResponseEntity<RecipeDeleteResponse> deleteRecipe(
            @PathVariable("recipeId") Integer recipeId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(jwt);

        return ResponseEntity.ok(
                recipeService.deleteRecipe(
                        recipeId,
                        authenticatedUserId
                )
        );
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
            // Subject không phải userId hợp lệ.
        }

        throw new RecipeException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authentication information"
        );
    }


}

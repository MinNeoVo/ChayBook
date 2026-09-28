package com.chaybook.backend.recipe.controller;


import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.exception.RecipeException;
import com.chaybook.backend.recipe.service.RecipeService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
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

    @GetMapping
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
            HttpServletRequest httpRequest
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(httpRequest);

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
            HttpServletRequest httpRequest
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(httpRequest);

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
            HttpServletRequest httpRequest
    ) {
        Integer authenticatedUserId =
                requireAuthenticatedUserId(httpRequest);

        return ResponseEntity.ok(
                recipeService.deleteRecipe(
                        recipeId,
                        authenticatedUserId
                )
        );
    }

    private Integer requireAuthenticatedUserId(
            HttpServletRequest httpRequest
    ) {
        HttpSession session = httpRequest.getSession(false);

        Object sessionUserId = session == null
                ? null
                : session.getAttribute("AUTH_USER_ID");

        if (!(sessionUserId instanceof Integer authenticatedUserId)) {
            throw new RecipeException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        return authenticatedUserId;
    }

}

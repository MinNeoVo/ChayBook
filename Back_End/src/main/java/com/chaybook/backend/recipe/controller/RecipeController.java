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
            @RequestParam(name = "categoryId", required = false) Integer categoryId,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                recipeService.getRecipes(categoryId, keyword, page, size)
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




}

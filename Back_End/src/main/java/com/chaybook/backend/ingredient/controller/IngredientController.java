package com.chaybook.backend.ingredient.controller;

import com.chaybook.backend.ingredient.dto.IngredientResponse;
import com.chaybook.backend.ingredient.service.IngredientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class IngredientController {
    private final IngredientService ingredientService;

    public IngredientController(
            IngredientService ingredientService
    ) {
        this.ingredientService = ingredientService;
    }

    @GetMapping
    public ResponseEntity<List<IngredientResponse>> getIngredients() {
        return ResponseEntity.ok(
                ingredientService.getIngredients()
        );
    }

    @GetMapping("/{ingredientId}")
    public ResponseEntity<IngredientResponse> getIngredientDetail(
            @PathVariable("ingredientId") Integer ingredientId
    ) {
        return ResponseEntity.ok(
                ingredientService.getIngredientDetail(ingredientId)
        );
    }

}

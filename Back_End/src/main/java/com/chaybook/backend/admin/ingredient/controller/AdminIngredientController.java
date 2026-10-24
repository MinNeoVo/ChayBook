package com.chaybook.backend.admin.ingredient.controller;

import com.chaybook.backend.admin.ingredient.dto.AdminIngredientPageResponse;
import com.chaybook.backend.admin.ingredient.dto.AdminIngredientRequest;
import com.chaybook.backend.admin.ingredient.service.AdminIngredientService;
import com.chaybook.backend.ingredient.dto.IngredientResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;

@RestController
@RequestMapping("/api/admin/ingredients")
public class AdminIngredientController {

    private final AdminIngredientService ingredientService;

    public AdminIngredientController(
            AdminIngredientService ingredientService
    ) {
        this.ingredientService = ingredientService;
    }

    @GetMapping
    public AdminIngredientPageResponse getIngredients(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return AdminIngredientPageResponse.from(
                ingredientService.getIngredients(
                        requireAuthenticatedUserId(jwt),
                        q,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{ingredientId}")
    public IngredientResponse getIngredientDetail(
            @PathVariable("ingredientId") Integer ingredientId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ingredientService.getIngredientDetail(
                requireAuthenticatedUserId(jwt),
                ingredientId
        );
    }

    @PostMapping
    public ResponseEntity<IngredientResponse> createIngredient(
            @Valid @RequestBody AdminIngredientRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        IngredientResponse response = ingredientService.createIngredient(
                requireAuthenticatedUserId(jwt),
                request
        );

        URI location = URI.create(
                "/api/admin/ingredients/" + response.ingredientId()
        );

        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{ingredientId}")
    public IngredientResponse updateIngredient(
            @PathVariable("ingredientId") Integer ingredientId,
            @Valid @RequestBody AdminIngredientRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ingredientService.updateIngredient(
                requireAuthenticatedUserId(jwt),
                ingredientId,
                request
        );
    }

    @DeleteMapping("/{ingredientId}")
    public ResponseEntity<Void> deleteIngredient(
            @PathVariable("ingredientId") Integer ingredientId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        ingredientService.deleteIngredient(
                requireAuthenticatedUserId(jwt),
                ingredientId
        );

        return ResponseEntity.noContent().build();
    }

    private Integer requireAuthenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in"
            );
        }

        try {
            int userId = Integer.parseInt(jwt.getSubject());

            if (userId > 0) {
                return userId;
            }
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authentication indentity"
            );
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authentication indentity"
        );
    }
}
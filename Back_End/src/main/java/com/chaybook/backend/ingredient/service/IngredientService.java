package com.chaybook.backend.ingredient.service;

import com.chaybook.backend.ingredient.dto.IngredientResponse;
import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.ingredient.exception.IngredientException;
import com.chaybook.backend.ingredient.repository.IngredientRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class IngredientService {
    private final IngredientRepository ingredientRepository;

    public IngredientService(
            IngredientRepository ingredientRepository
    ) {
        this.ingredientRepository = ingredientRepository;
    }

    public List<IngredientResponse> getIngredients() {
        return ingredientRepository
                .findAll(Sort.by(Sort.Direction.ASC, "ingredientId"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public IngredientResponse getIngredientDetail(
            Integer ingredientId
    ) {
        if (ingredientId == null || ingredientId <= 0) {
            throw new IngredientException(
                    HttpStatus.BAD_REQUEST,
                    "Ingredient ID must be greater than 0"
            );
        }

        Ingredient ingredient = ingredientRepository
                .findById(ingredientId)
                .orElseThrow(() -> new IngredientException(
                        HttpStatus.NOT_FOUND,
                        "Ingredient not found"
                ));

        return toResponse(ingredient);
    }

    private IngredientResponse toResponse(Ingredient ingredient) {
        return new IngredientResponse(
                ingredient.getIngredientId(),
                ingredient.getName(),
                ingredient.getDescription()
        );
    }

}

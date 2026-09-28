package com.chaybook.backend.ingredient.repository;

import com.chaybook.backend.ingredient.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Integer> {
}

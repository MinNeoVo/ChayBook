package com.chaybook.backend.ingredient.entity;

import com.chaybook.backend.allergy.entity.Allergy;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "INGREDIENT")
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_id")
    private Integer ingredientId;

    @Column(name = "name", nullable = false, length = 255, unique = true)
    private String name;

    @Column(name = "description", columnDefinition = "VARCHAR(MAX)")
    private String description;

    @ManyToMany(mappedBy = "ingredients", fetch = FetchType.LAZY)
    private Set<Allergy> allergies = new HashSet<>();

    public Ingredient() {
    }

    public Ingredient(Integer ingredientId, String name, String description) {
        this.ingredientId = ingredientId;
        this.name = name;
        this.description = description;
    }

    public Integer getIngredientId() {
        return ingredientId;
    }

    public void setIngredientId(Integer ingredientId) {
        this.ingredientId = ingredientId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

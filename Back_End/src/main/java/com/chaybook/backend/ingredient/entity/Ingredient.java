package com.chaybook.backend.ingredient.entity;

import com.chaybook.backend.allergy.entity.Allergy;
import com.chaybook.backend.ingredient.enums.IngredientStatus;
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

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @ManyToMany(mappedBy = "ingredients", fetch = FetchType.LAZY)
    private Set<Allergy> allergies = new HashSet<>();

    public Ingredient() {
    }

    public Ingredient(String name, String description) {

        this.name = name;
        this.description = description;
        this.status = IngredientStatus.ACTIVE.name();
    }

    public Set<Allergy> getAllergies() {
        return allergies;
    }

    public void setAllergies(Set<Allergy> allergies) {
        this.allergies = allergies;
    }

    public Integer getIngredientId() {
        return ingredientId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

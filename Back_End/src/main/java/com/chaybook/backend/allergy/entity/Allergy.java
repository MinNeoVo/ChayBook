package com.chaybook.backend.allergy.entity;

import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "ALLERGY")
public class Allergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "allergy_id")
    private Integer allergyId;

    @Column(name = "name", nullable = false, length = 255, unique = true)
    private String name;

    @ManyToMany(mappedBy = "allergies", fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "ALLERGY_INGREDIENT",
            joinColumns = @JoinColumn(name = "allergy_id"),
            inverseJoinColumns = @JoinColumn(name = "ingredient_id")
    )
    private Set<Ingredient> ingredients = new HashSet<>();

    public Allergy() {
    }

    public Allergy(Integer allergyId, String name) {
        this.allergyId = allergyId;
        this.name = name;
    }

    public Integer getAllergyId() {
        return allergyId;
    }

    public void setAllergyId(Integer allergyId) {
        this.allergyId = allergyId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

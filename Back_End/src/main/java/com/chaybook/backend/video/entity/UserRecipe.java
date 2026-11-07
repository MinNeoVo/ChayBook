package com.chaybook.backend.video.entity;

import com.chaybook.backend.user.entity.User;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "USER_RECIPE")
public class UserRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_recipe_id")
    private Integer userRecipeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "analysis_id",
            nullable = false,
            unique = true,
            updatable = false
    )
    private VideoAnalysis analysis;

    @Column(
            name = "name",
            nullable = false,
            length = 255,
            columnDefinition = "NVARCHAR(255)"
    )
    private String name;

    @Column(
            name = "recipe_json",
            nullable = false,
            columnDefinition = "NVARCHAR(MAX)"
    )
    private String recipeJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserRecipe() {
    }

    public UserRecipe(
            VideoAnalysis analysis,
            String name,
            String recipeJson
    ) {
        this.analysis = analysis;
        this.user = analysis.getSubmission().getUser();
        this.name = name;
        this.recipeJson = recipeJson;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Integer getUserRecipeId() {
        return userRecipeId;
    }

    public User getUser() {
        return user;
    }

    public VideoAnalysis getAnalysis() {
        return analysis;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRecipeJson() {
        return recipeJson;
    }

    public void setRecipeJson(String recipeJson) {
        this.recipeJson = recipeJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
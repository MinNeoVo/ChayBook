package com.chaybook.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "MEAL_PLAN_ITEM")
public class MealPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_item_id")
    private Integer mealItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id")
    private MealPlan mealPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(name = "day_number")
    private Integer dayNumber;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    public MealPlanItem() {
    }

    public MealPlanItem(Integer mealItemId, MealPlan mealPlan, Recipe recipe, Integer dayNumber, String mealType) {
        this.mealItemId = mealItemId;
        this.mealPlan = mealPlan;
        this.recipe = recipe;
        this.dayNumber = dayNumber;
        this.mealType = mealType;
    }

    public Integer getMealItemId() {
        return mealItemId;
    }

    public void setMealItemId(Integer mealItemId) {
        this.mealItemId = mealItemId;
    }

    public MealPlan getMealPlan() {
        return mealPlan;
    }

    public void setMealPlan(MealPlan mealPlan) {
        this.mealPlan = mealPlan;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    public void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }

    public Integer getDayNumber() {
        return dayNumber;
    }

    public void setDayNumber(Integer dayNumber) {
        this.dayNumber = dayNumber;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }
}



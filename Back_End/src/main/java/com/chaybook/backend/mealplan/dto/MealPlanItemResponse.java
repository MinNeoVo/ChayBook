package com.chaybook.backend.mealplan.dto;

public class MealPlanItemResponse {
    private Integer dayNumber;
    private String mealType;
    private MealPlanRecipeResponse recipe;

    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }
    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }
    public MealPlanRecipeResponse getRecipe() { return recipe; }
    public void setRecipe(MealPlanRecipeResponse recipe) { this.recipe = recipe; }
}

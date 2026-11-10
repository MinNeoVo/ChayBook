package com.chaybook.backend.mealplan.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MealPlanCreateRequest {
    @NotBlank
    private String healthGoal;

    @Min(1)
    @Max(14)
    private Integer durationDays;

    @Size(max = 255)
    private String dietaryPreference;

    public String getHealthGoal() {
        return healthGoal;
    }

    public void setHealthGoal(String healthGoal) {
        this.healthGoal = healthGoal;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public String getDietaryPreference() {
        return dietaryPreference;
    }

    public void setDietaryPreference(String dietaryPreference) {
        this.dietaryPreference = dietaryPreference;
    }
}

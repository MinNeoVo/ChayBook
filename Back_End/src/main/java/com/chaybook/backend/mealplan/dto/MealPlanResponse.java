package com.chaybook.backend.mealplan.dto;

import com.chaybook.backend.bmi.dto.BmiResponse;

import java.time.LocalDateTime;
import java.util.List;

public class MealPlanResponse {
    private Integer mealPlanId;
    private BmiResponse bmi;
    private String healthGoal;
    private Integer durationDays;
    private String dietaryPreference;
    private String status;
    private LocalDateTime generatedAt;
    private List<MealPlanItemResponse> items;

    public Integer getMealPlanId() { return mealPlanId; }
    public void setMealPlanId(Integer mealPlanId) { this.mealPlanId = mealPlanId; }
    public BmiResponse getBmi() { return bmi; }
    public void setBmi(BmiResponse bmi) { this.bmi = bmi; }
    public String getHealthGoal() { return healthGoal; }
    public void setHealthGoal(String healthGoal) { this.healthGoal = healthGoal; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public String getDietaryPreference() { return dietaryPreference; }
    public void setDietaryPreference(String dietaryPreference) { this.dietaryPreference = dietaryPreference; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public List<MealPlanItemResponse> getItems() { return items; }
    public void setItems(List<MealPlanItemResponse> items) { this.items = items; }
}

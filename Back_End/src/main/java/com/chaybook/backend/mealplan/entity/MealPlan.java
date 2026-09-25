package com.chaybook.backend.mealplan.entity;

import com.chaybook.backend.bmi.entity.BmiRecord;
import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "MEAL_PLAN")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_plan_id")
    private Integer mealPlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bmi_id")
    private BmiRecord bmiRecord;

    @Column(name = "health_goal", length = 255)
    private String healthGoal;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "dietary_preference", length = 255)
    private String dietaryPreference;

    @CreationTimestamp
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "status", length = 50)
    private String status;

    public MealPlan() {
    }

    public MealPlan(Integer mealPlanId, User user, BmiRecord bmiRecord, String healthGoal, Integer durationDays, String dietaryPreference, LocalDateTime generatedAt, String status) {
        this.mealPlanId = mealPlanId;
        this.user = user;
        this.bmiRecord = bmiRecord;
        this.healthGoal = healthGoal;
        this.durationDays = durationDays;
        this.dietaryPreference = dietaryPreference;
        this.generatedAt = generatedAt;
        this.status = status;
    }


    public Integer getMealPlanId() {
        return mealPlanId;
    }

    public void setMealPlanId(Integer mealPlanId) {
        this.mealPlanId = mealPlanId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BmiRecord getBmiRecord() {
        return bmiRecord;
    }

    public void setBmiRecord(BmiRecord bmiRecord) {
        this.bmiRecord = bmiRecord;
    }

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

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

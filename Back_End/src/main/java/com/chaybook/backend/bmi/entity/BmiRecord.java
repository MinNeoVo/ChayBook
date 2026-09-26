package com.chaybook.backend.bmi.entity;

import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "BMI_RECORD")
public class BmiRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bmi_id")
    private Integer bmiId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "height")
    private Double height;

    @Column(name = "weight")
    private Double weight;

    @Column(name = "bmi")
    private Double bmi;

    @Column(name = "category", length = 50)
    private String category;

    @CreationTimestamp
    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    public BmiRecord() {
    }

    public BmiRecord(User user, Double height, Double weight, Double bmi, String category, LocalDateTime calculatedAt) {
        this.user = user;
        this.height = height;
        this.weight = weight;
        this.bmi = bmi;
        this.category = category;
        this.calculatedAt = calculatedAt;
    }

    public Integer getBmiId() {
        return bmiId;
    }


    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getBmi() {
        return bmi;
    }

    public void setBmi(Double bmi) {
        this.bmi = bmi;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}

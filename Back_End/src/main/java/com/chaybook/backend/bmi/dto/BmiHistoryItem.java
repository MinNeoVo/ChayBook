package com.chaybook.backend.bmi.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public class BmiHistoryItem {

    private Integer bmiRecordId;
    private Double weight;
    private Double height;
    private Double bmi;
    private String category;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime createdAt;

    public BmiHistoryItem() {
    }

    public Integer getBmiRecordId() {
        return bmiRecordId;
    }

    public void setBmiRecordId(Integer bmiRecordId) {
        this.bmiRecordId = bmiRecordId;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
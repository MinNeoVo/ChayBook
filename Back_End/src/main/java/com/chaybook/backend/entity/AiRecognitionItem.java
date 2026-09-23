package com.chaybook.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "AI_RECOGNITION_ITEM")
public class AiRecognitionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recognition_item_id")
    private Integer recognitionItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recognition_id")
    private AiRecognition recognition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    @Column(name = "confidence")
    private Double confidence;

    public AiRecognitionItem() {
    }

    public AiRecognitionItem(Integer recognitionItemId, AiRecognition recognition,
                             Ingredient ingredient, Double confidence) {
        this.recognitionItemId = recognitionItemId;
        this.recognition = recognition;
        this.ingredient = ingredient;
        this.confidence = confidence;
    }

    public Integer getRecognitionItemId() {
        return recognitionItemId;
    }

    public void setRecognitionItemId(Integer recognitionItemId) {
        this.recognitionItemId = recognitionItemId;
    }

    public AiRecognition getRecognition() {
        return recognition;
    }

    public void setRecognition(AiRecognition recognition) {
        this.recognition = recognition;
    }

    public Ingredient getIngredient() {
        return ingredient;
    }

    public void setIngredient(Ingredient ingredient) {
        this.ingredient = ingredient;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}

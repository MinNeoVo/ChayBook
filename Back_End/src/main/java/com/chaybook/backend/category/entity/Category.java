package com.chaybook.backend.category.entity;

import com.chaybook.backend.category.enums.CategoryStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "CATEGORY")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "type", length = 50)
    private String type;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Nationalized
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private CategoryStatus status = CategoryStatus.ACTIVE;

    public Category() {
    }

    public Category(String name, String type, String description) {
        this.name = name;
        this.type = type;
        this.description = description;
    }

    public String getStatus() {
        return status == null ? null : status.name();
    }

    public void setStatus(String status) {
        this.status = status == null ? null : CategoryStatus.valueOf(status);
    }

    public CategoryStatus getStatusValue() {
        return status;
    }

    public void setStatus(CategoryStatus status) {
        this.status = status;
    }

    public Integer getCategoryId() {
        return categoryId;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

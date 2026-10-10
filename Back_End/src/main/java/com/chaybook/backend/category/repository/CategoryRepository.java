package com.chaybook.backend.category.repository;

import com.chaybook.backend.category.entity.Category;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository
        extends JpaRepository<Category, Integer> {

    List<Category> findByType(
            String type,
            Sort sort
    );

    List<Category> findByStatus(
            String status,
            Sort sort
    );

    List<Category> findByTypeAndStatus(
            String type,
            String status,
            Sort sort
    );

    boolean existsByCategoryIdAndStatusAndType(
            Integer categoryId,
            String status,
            String type
    );
}
package com.chaybook.backend.video.repository;

import com.chaybook.backend.video.entity.UserRecipe;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRecipeRepository
        extends JpaRepository<UserRecipe, Integer> {

    Page<UserRecipe> findByUser_UserId(
            Integer userId,
            Pageable pageable
    );

    Optional<UserRecipe> findByUserRecipeIdAndUser_UserId(
            Integer userRecipeId,
            Integer userId
    );

    Optional<UserRecipe> findByAnalysis_AnalysisId(
            Integer analysisId
    );
}
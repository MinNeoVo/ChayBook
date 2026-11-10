package com.chaybook.backend.video.service.impl;

import com.chaybook.backend.ingredient.enums.IngredientStatus;
import com.chaybook.backend.ingredient.repository.IngredientRepository;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.exception.VideoAnalysisException;

import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoIngredientMatcher {

    private final IngredientRepository ingredients;

    public VideoIngredientMatcher(IngredientRepository ingredients) {
        this.ingredients = ingredients;
    }

    @Transactional(readOnly = true)
    public VideoRecipeDraft createDraft(VideoExtractionResult result) {
        if (result.recipe() == null)
            return null;

        var raw = result.recipe();

        List<VideoRecipeDraft.IngredientDraft> matched = raw.ingredients().stream().map(item -> {

            var found = ingredients.findByNameIgnoreCaseAndStatus(
                    item.detectedName().trim(),
                    IngredientStatus.ACTIVE);

            return new VideoRecipeDraft.IngredientDraft(
                    found.map(value -> value.getIngredientId()).orElse(null),
                    found.map(value -> value.getName())
                            .orElse(item.detectedName().trim()),
                    item.amountText());

        }).toList();

        return new VideoRecipeDraft(
                raw.name(),
                matched,
                raw.steps());
    }

    @Transactional
    public void validateReferences(VideoRecipeDraft draft, boolean lock) {

        var ids = new TreeSet<Integer>();

        draft.ingredients().stream()
                .map(VideoRecipeDraft.IngredientDraft::ingredientId)
                .filter(Objects::nonNull)
                .forEach(ids::add);

        for (Integer id : ids) {

            var found = lock
                    ? ingredients.findByIdForUpdate(id)
                    : ingredients.findByIngredientIdAndStatus(
                            id,
                            IngredientStatus.ACTIVE);

            var ingredient = found.orElseThrow(this::invalidReference);

            if (!IngredientStatus.ACTIVE.equals(ingredient.getStatus())) {
                throw invalidReference();
            }

            for (var item : draft.ingredients()) {

                if (id.equals(item.ingredientId())
                        && !ingredient.getName()
                                .equalsIgnoreCase(item.name().trim())) {

                    throw invalidReference();
                }
            }
        }
    }

    private VideoAnalysisException invalidReference() {
        return new VideoAnalysisException(
                HttpStatus.BAD_REQUEST,
                "INVALID_INGREDIENT_REFERENCE",
                "Nguyên liệu đã thay đổi/không còn ACTIVE hoặc ID không khớp tên. Hãy chọn lại hoặc bỏ ID.");
    }
}
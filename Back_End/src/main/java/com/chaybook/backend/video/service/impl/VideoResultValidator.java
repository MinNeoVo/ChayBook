package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.enums.RecipePresence;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class VideoResultValidator {
    private static final Logger log = LoggerFactory.getLogger(VideoResultValidator.class);

    public void review(VideoReviewAssessment value, BigDecimal duration) {
        require(value != null);
        check(value.foodTopic(), duration);
        check(value.vegetarianFood(), duration);
        require(value.recipePresence() != null);
        evidence(value.recipeEvidence(), duration);
        if (value.recipePresence() == RecipePresence.PRESENT)
            require(!value.recipeEvidence().isEmpty());
    }

    public void extraction(VideoExtractionResult value, BigDecimal duration, boolean includeSummary) {
        require(value != null);
        check(value.vegetarianFood(), duration);
        require(value.recipePresence() != null);
        optionalText(value.summary(), 8000);
        require(includeSummary || value.summary() == null);
        evidence(value.recipeHighlights(), duration);
        strings(value.missingFields(), 50, 255);
        strings(value.warnings(), 50, 1000);
        if (value.recipePresence() != RecipePresence.PRESENT) {
            require(value.recipe() == null);
            return;
        }
        require(value.recipe() != null && !value.recipeHighlights().isEmpty());
        var recipe = value.recipe();
        optionalText(recipe.name(), 255);
        require(recipe.ingredients() != null && recipe.ingredients().size() <= 100);
        for (var ingredient : recipe.ingredients()) {
            require(ingredient != null);
            text(ingredient.detectedName(), 255);
            optionalText(ingredient.amountText(), 255);
        }
        strings(recipe.steps(), 100, 2000);
    }

    private void check(VideoReviewAssessment.Check value, BigDecimal duration) {
        require(value != null && value.answer() != null);
        text(value.reason(), 2000);
        evidence(value.evidence(), duration);
        // Missing evidence is handled as UNKNOWN by VideoReviewPolicy.
    }

    private void evidence(
            List<VideoEvidence> values,
            BigDecimal duration
    ) {
        require(values != null && values.size() <= 100);

        for (int index = 0; index < values.size(); index++) {
            VideoEvidence item = values.get(index);

            require(
                    item != null
                            && item.startSecond() != null
                            && item.endSecond() != null
            );

            boolean validTimestamp =
                    item.startSecond() >= 0
                            && item.endSecond() >= item.startSecond()
                            && BigDecimal.valueOf(item.endSecond())
                                    .compareTo(duration) <= 0;

            if (!validTimestamp) {
                log.warn(
                        "Video AI timestamp invalid: index={}, "
                                + "startSecond={}, endSecond={}, durationSeconds={}",
                        index,
                        item.startSecond(),
                        item.endSecond(),
                        duration
                );
            }

            require(validTimestamp);
            text(item.description(), 2000);
        }
    }

    private void strings(List<String> values, int count, int length) {
        require(values != null && values.size() <= count);
        for (String value : values) text(value, length);
    }
    private void optionalText(String value, int max) { if (value != null) text(value, max); }
    private void text(String value, int max) {
        require(value != null && !value.isBlank() && value.length() <= max);
    }
    private void require(boolean valid) {
        if (!valid) throw new VideoAnalysisException(HttpStatus.BAD_GATEWAY,
                "INVALID_AI_RESPONSE", "Kết quả AI sai cấu trúc hoặc thiếu căn cứ hợp lệ.");
    }
}

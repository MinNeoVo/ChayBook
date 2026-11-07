package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.dto.VideoRecipeDraft;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class VideoDraftRules {
    public void validateShape(VideoRecipeDraft draft) {
        require(draft != null, "Thiếu bản nháp.");
        optionalText(draft.name(), 255);
        require(draft.ingredients() != null && draft.ingredients().size() <= 100,
                "Danh sách nguyên liệu không hợp lệ.");
        for (var ingredient : draft.ingredients()) {
            require(ingredient != null, "Nguyên liệu không hợp lệ.");
            require(ingredient.name() != null && !ingredient.name().isBlank()
                    && ingredient.name().length() <= 255, "Tên nguyên liệu không hợp lệ.");
            require(ingredient.ingredientId() == null || ingredient.ingredientId() > 0,
                    "ID nguyên liệu không hợp lệ.");
            optionalText(ingredient.amountText(), 255);
        }
        require(draft.steps() != null && draft.steps().size() <= 100,
                "Danh sách bước làm không hợp lệ.");
        for (String step : draft.steps())
            require(step != null && !step.isBlank() && step.length() <= 2000,
                    "Bước làm không hợp lệ.");
    }

    public boolean canConfirm(VideoRecipeDraft draft) {
        if (draft == null) return false;
        try { validateShape(draft); }
        catch (VideoAnalysisException e) { return false; }
        return draft.name() != null && !draft.name().isBlank()
                && !draft.ingredients().isEmpty() && !draft.steps().isEmpty();
    }

    public void requireComplete(VideoRecipeDraft draft) {
        validateShape(draft);
        require(canConfirm(draft), "Cần tên món, ít nhất một nguyên liệu và một bước làm.");
    }
    private void optionalText(String value, int max) {
        require(value == null || (!value.isBlank() && value.length() <= max), "Trường văn bản không hợp lệ.");
    }
    private void require(boolean condition, String message) {
        if (!condition) throw new VideoAnalysisException(HttpStatus.BAD_REQUEST, "INVALID_DRAFT", message);
    }
}

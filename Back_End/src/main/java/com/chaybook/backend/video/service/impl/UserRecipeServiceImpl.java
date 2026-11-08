package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.dto.UserRecipeResponse;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import com.chaybook.backend.video.repository.UserRecipeRepository;
import com.chaybook.backend.video.service.UserRecipeService;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserRecipeServiceImpl implements UserRecipeService {
    private final UserRecipeRepository recipes;
    private final VideoUserGuard users;
    private final VideoResponseMapper responses;
    public UserRecipeServiceImpl(UserRecipeRepository recipes, VideoUserGuard users,
            VideoResponseMapper responses) {
        this.recipes = recipes; this.users = users; this.responses = responses;
    }

    @Override
    public Page<UserRecipeResponse> getMine(Integer userId, int page, int size) {
        users.requireActive(userId);
        if (page < 0 || size < 1 || size > 50)
            throw new VideoAnalysisException(HttpStatus.BAD_REQUEST, "INVALID_PAGINATION",
                    "page >= 0; size từ 1 đến 50.");
        return recipes.findByUser_UserId(userId, PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("userRecipeId"))))
                .map(responses::recipe);
    }

    @Override
    public UserRecipeResponse getDetail(Integer userId, Integer userRecipeId) {
        users.requireActive(userId);
        return responses.recipe(recipes.findByUserRecipeIdAndUser_UserId(userRecipeId, userId)
                .orElseThrow(() -> new VideoAnalysisException(HttpStatus.NOT_FOUND,
                        "USER_RECIPE_NOT_FOUND", "Không tìm thấy công thức của bạn.")));
    }
}

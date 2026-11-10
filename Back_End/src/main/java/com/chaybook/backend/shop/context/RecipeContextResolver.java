package com.chaybook.backend.shop.context;

import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.model.RecommendationContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RecipeContextResolver implements RecommendationContextResolver {
    private final RecipeRepository recipeRepository;

    public RecipeContextResolver(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    @Override
    public RecommendationSource supportedSource() {
        return RecommendationSource.RECIPE;
    }

    @Override
    @Transactional(readOnly = true)
    public RecommendationContext resolve(Integer userId, ShopRecommendationRequest request) {
        Recipe recipe = recipeRepository.findDetailById(request.recipeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy công thức đang hoạt động."
                ));
        return new RecommendationContext(recipe.getName(), recipe.getRecipeId());
    }
}

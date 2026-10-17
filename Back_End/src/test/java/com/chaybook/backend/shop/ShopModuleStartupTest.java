package com.chaybook.backend.shop;

import com.chaybook.backend.mealplan.service.MealPlanService;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.shop.controller.ShopController;
import com.chaybook.backend.shop.provider.ShopSearchProvider;
import com.chaybook.backend.shop.service.ShopRecommendationService;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class ShopModuleStartupTest {
    @Test
    void moduleCanStartWithoutAnExternalSearchProvider() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(UserRepository.class, () -> mock(UserRepository.class));
            context.registerBean(RecipeRepository.class, () -> mock(RecipeRepository.class));
            context.registerBean(MealPlanService.class, () -> mock(MealPlanService.class));
            context.scan("com.chaybook.backend.shop");

            context.refresh();

            assertNotNull(context.getBean(ShopController.class));
            assertNotNull(context.getBean(ShopRecommendationService.class));
            assertTrue(context.getBeansOfType(ShopSearchProvider.class).isEmpty());
        }
    }
}

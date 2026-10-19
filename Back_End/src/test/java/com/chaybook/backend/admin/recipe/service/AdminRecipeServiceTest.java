package com.chaybook.backend.admin.recipe.service;

import com.chaybook.backend.admin.recipe.service.impl.AdminRecipeServiceImpl;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.ingredient.repository.IngredientRepository;
import com.chaybook.backend.recipe.dto.*;
import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.exception.RecipeException;
import com.chaybook.backend.recipe.repository.RecipeIngredientRepository;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminRecipeServiceImplTest {

    private static final int ADMIN_ID = 12;
    private static final int CATEGORY_ID = 7;
    private static final int INGREDIENT_ID = 1;
    private static final int RECIPE_ID = 100;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private RecipeIngredientRepository recipeIngredientRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private UserRepository userRepository;

    private AdminRecipeServiceImpl service;
    private User admin;

    @BeforeEach
    void setUp() {
        service = new AdminRecipeServiceImpl(
                recipeRepository,
                recipeIngredientRepository,
                categoryRepository,
                ingredientRepository,
                userRepository
        );

        admin = new User();
        admin.setRole("ADMIN");
        admin.setStatus("ACTIVE");
        ReflectionTestUtils.setField(admin, "userId", ADMIN_ID);

        when(userRepository.findById(ADMIN_ID))
                .thenReturn(Optional.of(admin));
    }

    @Test
    void getRecipesReturnsAdminRecipeList() {
        Recipe recipe = existingRecipe();

        when(recipeRepository.searchForAdmin(
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(
                List.of(recipe),
                PageRequest.of(0, 10),
                1
        ));

        var result = service.getRecipes(
                ADMIN_ID, null, null, null, 0, 10
        );

        assertEquals(1, result.totalElements());
        assertEquals("Sinh tố chuối", result.items().get(0).name());
        assertEquals("ACTIVE", result.items().get(0).status());
    }

    @Test
    void getRecipeDetailReturnsRecipeAndIngredients() {
        Recipe recipe = existingRecipe();

        when(recipeRepository.findAdminDetailById(RECIPE_ID))
                .thenReturn(Optional.of(recipe));
        when(recipeIngredientRepository.findIngredientsByRecipeId(RECIPE_ID))
                .thenReturn(List.of());

        var result = service.getRecipeDetail(ADMIN_ID, RECIPE_ID);

        assertEquals(RECIPE_ID, result.recipeId());
        assertEquals("Sinh tố chuối", result.name());
        assertEquals(1, result.servings());
        assertEquals(500.0, result.calories());
        assertTrue(result.ingredients().isEmpty());
    }

    @Test
    void createRecipeSavesRecipeFieldsAndIngredients() {
        Category category = recipeCategory();
        Ingredient ingredient = ingredient();

        when(categoryRepository.findById(CATEGORY_ID))
                .thenReturn(Optional.of(category));
        when(ingredientRepository.findAllById(anyIterable()))
                .thenReturn(List.of(ingredient));
        when(recipeIngredientRepository.findIngredientsByRecipeId(anyInt()))
                .thenReturn(List.of());

        when(recipeRepository.saveAndFlush(any(Recipe.class)))
                .thenAnswer(invocation -> {
                    Recipe saved = invocation.getArgument(0);
                    ReflectionTestUtils.setField(
                            saved, "recipeId", RECIPE_ID
                    );
                    return saved;
                });

        when(recipeIngredientRepository.saveAllAndFlush(anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RecipeCreateResponse result =
                service.createRecipe(ADMIN_ID, request());

        assertEquals(RECIPE_ID, result.recipeId());
        assertEquals("Sinh tố chuối", result.name());
        assertEquals(1, result.servings());
        assertEquals("DỄ", result.difficulty());
        assertEquals(500.0, result.calories());
        assertEquals(1, result.ingredients().size());

        verify(recipeRepository).saveAndFlush(argThat(saved ->
                saved.getCategory() == category
                        && "Sinh tố chuối".equals(saved.getName())
                        && "Ngon tuyệt vời".equals(saved.getDescription())
                        && saved.getPrepTime() == 15
                        && saved.getCookTime() == 10
                        && saved.getServings() == 1
                        && "DỄ".equals(saved.getDifficulty())
                        && saved.getCalories() == 500.0
                        && saved.getProtein() == 7.0
                        && saved.getCarbs() == 20.0
                        && saved.getFat() == 9.0
        ));
    }

    @Test
    void updateRecipeChangesRecipeFields() {
        Recipe recipe = existingRecipe();

        when(recipeRepository.findByIdForUpdate(RECIPE_ID))
                .thenReturn(Optional.of(recipe));
        when(ingredientRepository.findAllById(anyIterable()))
                .thenReturn(List.of(ingredient()));
        when(recipeIngredientRepository.findIngredientsByRecipeId(RECIPE_ID))
                .thenReturn(List.of());
        when(recipeIngredientRepository.saveAllAndFlush(anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RecipeUpdateResponse result =
                service.updateRecipe(RECIPE_ID, ADMIN_ID, request());

        assertEquals(RECIPE_ID, result.recipeId());
        assertEquals("Sinh tố chuối", recipe.getName());
        assertEquals(1, recipe.getServings());
        assertEquals(500.0, recipe.getCalories());

        verify(recipeRepository).save(recipe);
    }

    @Test
    void deleteRecipeSetsStatusToDeleted() {
        Recipe recipe = existingRecipe();

        when(recipeRepository.findByIdForUpdate(RECIPE_ID))
                .thenReturn(Optional.of(recipe));

        service.deleteRecipe(RECIPE_ID, ADMIN_ID);

        assertEquals("DELETED", recipe.getStatus());
        verify(recipeRepository).saveAndFlush(recipe);
    }

    @Test
    void nonAdminCannotCreateRecipe() {
        admin.setRole("USER");

        RecipeException exception = assertThrows(
                RecipeException.class,
                () -> service.createRecipe(ADMIN_ID, request())
        );

        assertEquals(403, exception.getStatus().value());
        verify(recipeRepository, never())
                .saveAndFlush(any(Recipe.class));
    }

    private RecipeWriteRequest request() {
        return new RecipeWriteRequest(
                CATEGORY_ID,
                "Sinh tố chuối",
                "Ngon tuyệt vời",
                "",
                15,
                10,
                1,
                "DỄ",
                "Cắt chuối rồi xay",
                500.0,
                7.0,
                20.0,
                9.0,
                List.of(new RecipeIngredientRequest(
                        INGREDIENT_ID,
                        2.0,
                        "quả"
                ))
        );
    }

    private Category recipeCategory() {
        Category category = new Category(
                "Món chay",
                "RECIPE",
                null
        );
        ReflectionTestUtils.setField(
                category, "categoryId", CATEGORY_ID
        );
        return category;
    }

    private Ingredient ingredient() {
        Ingredient ingredient = new Ingredient("Chuối", null);
        ReflectionTestUtils.setField(
                ingredient, "ingredientId", INGREDIENT_ID
        );
        return ingredient;
    }

    private Recipe existingRecipe() {
        Recipe recipe = new Recipe();
        ReflectionTestUtils.setField(recipe, "recipeId", RECIPE_ID);
        recipe.setCategory(recipeCategory());
        recipe.setName("Sinh tố chuối");
        recipe.setDescription("Ngon tuyệt vời");
        recipe.setPrepTime(15);
        recipe.setCookTime(10);
        recipe.setServings(1);
        recipe.setDifficulty("DỄ");
        recipe.setInstructions("Cắt chuối rồi xay");
        recipe.setCalories(500.0);
        recipe.setProtein(7.0);
        recipe.setCarbs(20.0);
        recipe.setFat(9.0);
        recipe.setStatus("ACTIVE");
        return recipe;
    }
}
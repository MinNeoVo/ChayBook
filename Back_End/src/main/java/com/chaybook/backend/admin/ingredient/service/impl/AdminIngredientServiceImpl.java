package com.chaybook.backend.admin.ingredient.service.impl;

import com.chaybook.backend.admin.ingredient.dto.AdminIngredientRequest;
import com.chaybook.backend.admin.ingredient.repository.AdminIngredientRepository;
import com.chaybook.backend.admin.ingredient.service.AdminIngredientService;
import com.chaybook.backend.ingredient.dto.IngredientResponse;
import com.chaybook.backend.ingredient.entity.Ingredient;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminIngredientServiceImpl
        implements AdminIngredientService {

    private final AdminIngredientRepository ingredientRepository;
    private final UserRepository userRepository;

    public AdminIngredientServiceImpl(
            AdminIngredientRepository ingredientRepository,
            UserRepository userRepository
    ) {
        this.ingredientRepository = ingredientRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Page<IngredientResponse> getIngredients(
            Integer authenticatedUserId,
            String q,
            int page,
            int size
    ) {
        requireAdmin(authenticatedUserId);
        validatePagination(page, size);

        String keyword = q == null ? "" : q.strip();

        if (keyword.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Search keyword must not exceed 255 characters"
            );
        }

        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "ingredientId")
        );

        return ingredientRepository.search(keyword, pageable)
                .map(this::toResponse);
    }

    @Override
    public IngredientResponse getIngredientDetail(
            Integer authenticatedUserId,
            Integer ingredientId
    ) {
        requireAdmin(authenticatedUserId);
        validateIngredientId(ingredientId);

        Ingredient ingredient = ingredientRepository
                .findById(ingredientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ingredient not found"
                ));

        return toResponse(ingredient);
    }

    @Override
    @Transactional
    public IngredientResponse createIngredient(
            Integer authenticatedUserId,
            AdminIngredientRequest request
    ) {
        requireAdmin(authenticatedUserId);
        ensureUniqueName(request.name(), null);

        Ingredient ingredient = new Ingredient(
                request.name(),
                request.description()
        );

        Ingredient saved = ingredientRepository.saveAndFlush(ingredient);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public IngredientResponse updateIngredient(
            Integer authenticatedUserId,
            Integer ingredientId,
            AdminIngredientRequest request
    ) {
        requireAdmin(authenticatedUserId);

        Ingredient ingredient = requireIngredientForWrite(ingredientId);

        ensureUniqueName(request.name(), ingredientId);

        ingredient.setName(request.name());
        ingredient.setDescription(request.description());

        Ingredient saved = ingredientRepository.saveAndFlush(ingredient);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteIngredient(
            Integer authenticatedUserId,
            Integer ingredientId
    ) {
        requireAdmin(authenticatedUserId);

        Ingredient ingredient = requireIngredientForWrite(ingredientId);

        if (ingredientRepository.findUsageFlag(ingredientId) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This ingredient is referenced by recipes, allergy groups, or AI recognition results"
            );
        }

        ingredientRepository.delete(ingredient);
        ingredientRepository.flush();
    }

    private void requireAdmin(Integer authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in"
            );
        }

        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "This account does not exist"
                ));

        if (!"ADMIN".equals(user.getRole())
                || !"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only active admin accounts can perform this action"
            );
        }
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page number must be a positive integer"
            );
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page size must be between 1 and 100"
            );
        }
    }

    private void validateIngredientId(Integer ingredientId) {
        if (ingredientId == null || ingredientId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ingredient ID must be a positive integer"
            );
        }
    }

    private Ingredient requireIngredientForWrite(Integer ingredientId) {
        validateIngredientId(ingredientId);

        return ingredientRepository.findByIdForUpdate(ingredientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ingredient not found"
                ));
    }

    private void ensureUniqueName(String name, Integer excludedId) {
        if (ingredientRepository.countDuplicates(name, excludedId) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An ingredient with this name already exists"
            );
        }
    }

    private IngredientResponse toResponse(Ingredient ingredient) {
        return new IngredientResponse(
                ingredient.getIngredientId(),
                ingredient.getName(),
                ingredient.getDescription()
        );
    }
}
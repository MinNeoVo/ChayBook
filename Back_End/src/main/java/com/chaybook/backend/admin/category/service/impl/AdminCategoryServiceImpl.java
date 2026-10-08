package com.chaybook.backend.admin.category.service.impl;

import java.util.*;


import com.chaybook.backend.admin.category.service.AdminCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.chaybook.backend.admin.category.repository.AdminCategoryRepository;
import com.chaybook.backend.admin.category.dto.AdminCategoryRequest;
import com.chaybook.backend.admin.category.dto.AdminCategoryResponse;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;

@Service 
@Transactional (readOnly = true)
public class AdminCategoryServiceImpl implements AdminCategoryService {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("ARTICLE", "RECIPE", "POST");

    private final AdminCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public AdminCategoryServiceImpl(
            AdminCategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    //
    private User requireAdmin(Integer authenticatedUserId) {
    if (authenticatedUserId == null || authenticatedUserId <= 0) {
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Vui lòng đăng nhập"
        );
    }

    User user = userRepository.findById(authenticatedUserId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tài khoản không còn tồn tại"
            ));

    if (!"ACTIVE".equals(user.getStatus())
            || !"ADMIN".equals(user.getRole())) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Chỉ Admin ACTIVE được thực hiện thao tác này"
            );
        }
        return user;
    }
    
    private Category requireCategory(Integer categoryId) {
    if (categoryId == null || categoryId <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Category ID phải lớn hơn 0"
        );
    }

    return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Category không tồn tại"
            ));
    }

    private String normalizeOptionalType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }

        String normalized = type.strip().toUpperCase(Locale.ROOT);

        if (!ALLOWED_TYPES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category type không hợp lệ"
            );
        }
        return normalized;
    }

    private void ensureUniqueName(
            String name,
            String type,
            Integer excludedId
    ) {
        if (categoryRepository.countDuplicates(name, type, excludedId) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên Category đã tồn tại trong type này"
            );
        }
    }

    private void ensureCategoryUnused(Integer categoryId) {
        if (categoryRepository.findUsageFlag(categoryId) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Category đang được nội dung sử dụng"
            );
        }
    }

    private AdminCategoryResponse toResponse(Category category) {
        return new AdminCategoryResponse(
                category.getCategoryId(),
                category.getName(),
                category.getType(),
                category.getDescription(),
                category.getStatus()
        );
    }


    @Override
    public List<AdminCategoryResponse> getCategories(
            Integer authenticatedUserId,
            String type,
            String q,
            String status
    ) {
        requireAdmin(authenticatedUserId);

        String normalizedType = normalizeOptionalType(type);
        String normalizedStatus = normalizeOptionalStatus(status);
        String keyword = q == null || q.isBlank()
                ? null
                : q.strip();

        return categoryRepository.searchForAdmin(
                        normalizedType,
                        normalizedStatus,
                        keyword
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //chi tiết
    @Override
    public AdminCategoryResponse getCategoryDetail(
            Integer authenticatedUserId,
            Integer categoryId
    ) {
        requireAdmin(authenticatedUserId);
        return toResponse(requireCategory(categoryId));
    }

    //tạo mới
    @Override
    @Transactional
    public AdminCategoryResponse createCategory(
            Integer authenticatedUserId,
            AdminCategoryRequest request
    ) {
        requireAdmin(authenticatedUserId);

        String name = request.name().strip();
        String type = request.type();

        ensureUniqueName(name, type, null);

        Category category = new Category(
                name,
                type,
                request.description()
        );

        return toResponse(categoryRepository.saveAndFlush(category));
    }

    @Override
    @Transactional
    public AdminCategoryResponse updateCategory(
            Integer authenticatedUserId,
            Integer categoryId,
            AdminCategoryRequest request
    ) {
        requireAdmin(authenticatedUserId);

        Category category = requireCategoryForWrite(categoryId);

        if (!"ACTIVE".equals(category.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot update a deleted category"
            );
        }

        String name = request.name().strip();
        String type = request.type();

        if (!type.equalsIgnoreCase(category.getType())) {
            ensureCategoryUnused(categoryId);
        }

        ensureUniqueName(name, type, categoryId);

        category.setName(name);
        category.setType(type);
        category.setDescription(request.description());

        return toResponse(categoryRepository.saveAndFlush(category));
    }

    @Override
    @Transactional
    public void deleteCategory(
            Integer authenticatedUserId,
            Integer categoryId
    ) {
        requireAdmin(authenticatedUserId);

        Category category = requireCategoryForWrite(categoryId);

        if ("DELETED".equals(category.getStatus())) {
            return;
        }

        category.setStatus("DELETED");
        categoryRepository.saveAndFlush(category);
    }


    private String normalizeOptionalStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.strip().toUpperCase(Locale.ROOT);

        if (!Set.of("ACTIVE", "DELETED").contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be ACTIVE or DELETED"
            );
        }

        return normalized;
    }

    private Category requireCategoryForWrite(Integer categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Category ID must be greater than 0"
            );
        }

        return categoryRepository.findByIdForUpdate(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));
    }
}
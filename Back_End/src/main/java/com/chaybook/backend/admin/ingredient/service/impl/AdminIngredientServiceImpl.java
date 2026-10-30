package com.chaybook.backend.admin.ingredient.service.impl;

import java.util.Locale;

import com.chaybook.backend.admin.ingredient.dto.AdminIngredientRequest;
import com.chaybook.backend.admin.ingredient.dto.AdminIngredientResponse;
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
    public Page<AdminIngredientResponse> getIngredients(
            Integer authenticatedUserId,
            String q,
            String status,
            int page,
            int size
    ) {
        requireAdmin(authenticatedUserId);
        validatePagination(page, size);

        String keyword = q == null ? "" : q.strip();
        String normalizedStatus = normalizeStatus(status);

        if (keyword.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Từ khóa tìm kiếm không được vượt quá 255 ký tự"
            );
        }

        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "ingredientId")
        );

        return ingredientRepository.search(keyword, normalizedStatus, pageable)
                .map(this::toResponse);
    }

    @Override
    public AdminIngredientResponse getIngredientDetail(
            Integer authenticatedUserId,
            Integer ingredientId
    ) {
        requireAdmin(authenticatedUserId);
        validateIngredientId(ingredientId);

        Ingredient ingredient = ingredientRepository
                .findById(ingredientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy nguyên liệu."
                ));

        return toResponse(ingredient);
    }

    @Override
    @Transactional
    public AdminIngredientResponse createIngredient(
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
    public AdminIngredientResponse updateIngredient(
            Integer authenticatedUserId,
            Integer ingredientId,
            AdminIngredientRequest request
    ) {
        requireAdmin(authenticatedUserId);

        Ingredient ingredient = requireIngredientForWrite(ingredientId);

        if (!"ACTIVE".equals(ingredient.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Vui lòng hoàn tác trước khi chỉnh sửa nguyên liệu đã xóa."
            );
        }

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

        if("DELETED".equals(ingredient.getStatus())) {
            return;
        }

        if (ingredientRepository.findUsageFlag(ingredientId) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nguyên liệu đang liên kết với dữ liệu khác. Không thể hoàn tất thao tác."
            );
        }

        ingredient.setStatus("DELETED");
        ingredientRepository.saveAndFlush(ingredient);
    }

    @Override
    @Transactional
    public AdminIngredientResponse restoreIngredient(
            Integer authenticatedUserId,
            Integer ingredientId
    ) {
        requireAdmin(authenticatedUserId);

        Ingredient ingredient = requireIngredientForWrite(ingredientId);

        if ("ACTIVE".equals(ingredient.getStatus())) {
            return toResponse(ingredient);
        }

        ingredient.setStatus("ACTIVE");

        Ingredient saved = ingredientRepository.saveAndFlush(ingredient);

        return toResponse(saved);
    }

    private void requireAdmin(Integer authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập."
            );
        }

        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tài khoản không tồn tại."
                ));

        if (!"ADMIN".equals(user.getRole())
                || !"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ tài khoản admin đang hoạt động mới được thực hiện thao tác này."
            );
        }
    }

    private void validatePagination(int page, int size) {
        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ số trang phải là một số nguyên không âm."
            );
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Kích thước trang phải nằm trong khoảng từ 1 đến 100."
            );
        }
    }

    private void validateIngredientId(Integer ingredientId) {
        if (ingredientId == null || ingredientId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã nguyên liệu phải là một số nguyên dương."
            );
        }
    }

    private Ingredient requireIngredientForWrite(Integer ingredientId) {
        validateIngredientId(ingredientId);

        return ingredientRepository.findByIdForUpdate(ingredientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy nguyên liệu."
                ));
    }

    private void ensureUniqueName(String name, Integer excludedId) {
        if (ingredientRepository.countDuplicates(name, excludedId) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên nguyên liệu đã tồn tại. Hãy kiểm tra cả danh sách nguyên liệu đã xóa."
            );
        }
    }

    private AdminIngredientResponse toResponse(Ingredient ingredient) {
        return new AdminIngredientResponse(
                ingredient.getIngredientId(),
                ingredient.getName(),
                ingredient.getDescription(),
                ingredient.getStatus()
        );
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "";
        }
        String normalized = status.strip().toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized)
                && !"DELETED".equals(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái phải là ACTIVE hoặc DELETED."
            );
        }
        return normalized;
    }
}
package com.chaybook.backend.video.service;
import com.chaybook.backend.video.dto.UserRecipeResponse;
import org.springframework.data.domain.Page;

public interface UserRecipeService {
    Page<UserRecipeResponse> getMine(Integer userId, int page, int size);
    UserRecipeResponse getDetail(Integer userId, Integer userRecipeId);
}

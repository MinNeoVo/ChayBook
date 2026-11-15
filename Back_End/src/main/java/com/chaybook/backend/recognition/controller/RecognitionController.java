package com.chaybook.backend.recognition.controller;

import com.chaybook.backend.recognition.dto.ConnectionCheckResponse;
import com.chaybook.backend.recognition.dto.RecognizeIngredientResponse;
import com.chaybook.backend.recognition.service.RecognitionService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user/ai-recognition")
public class RecognitionController {

    private final RecognitionService recognitionService;
    private final UserRepository userRepository;

    public RecognitionController(
            RecognitionService recognitionService,
            UserRepository userRepository
    ) {
        this.recognitionService = recognitionService;
        this.userRepository = userRepository;
    }

    @PostMapping("/connection-check")
    public ConnectionCheckResponse checkConnection() {
        String providerResponse =
                recognitionService.checkConnection();

        return new ConnectionCheckResponse(
                true,
                "gemini-3.8-flash",
                "Kết nối Gemini 3.8 Flash thành công.",
                providerResponse
        );
    }


    @PostMapping(
            value = "/scan",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public RecognizeIngredientResponse recognize(
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer userId;

        try {
            userId = Integer.valueOf(jwt.getSubject());
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Thông tin đăng nhập không hợp lệ."
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        if (!user.isPro()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tính năng nhận diện nguyên liệu qua hình ảnh chỉ dành cho tài khoản Pro. Vui lòng nâng cấp gói Pro để sử dụng."
            );
        }

        return recognitionService.recognize(userId, image);
    }
}
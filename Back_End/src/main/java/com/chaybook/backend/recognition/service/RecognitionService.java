package com.chaybook.backend.recognition.service;

import com.chaybook.backend.recognition.dto.RecognizeIngredientResponse;
import org.springframework.web.multipart.MultipartFile;

public interface RecognitionService {

    String checkConnection();

    RecognizeIngredientResponse recognize(
            Integer userId,
            MultipartFile image
    );
}
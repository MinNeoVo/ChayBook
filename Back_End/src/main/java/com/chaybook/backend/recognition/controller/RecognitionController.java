package com.chaybook.backend.recognition.controller;

import com.chaybook.backend.recognition.dto.ConnectionCheckResponse;
import com.chaybook.backend.recognition.service.RecognitionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/ai-recognition")
public class RecognitionController {

    private final RecognitionService recognitionService;

    public RecognitionController(
            RecognitionService recognitionService
    ) {
        this.recognitionService = recognitionService;
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
}
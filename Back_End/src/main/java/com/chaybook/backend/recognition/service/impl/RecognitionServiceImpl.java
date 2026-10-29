package com.chaybook.backend.recognition.service.impl;

import com.chaybook.backend.recognition.provider.ContentRecognitionProvider;
import com.chaybook.backend.recognition.service.RecognitionService;
import org.springframework.stereotype.Service;

@Service
public class RecognitionServiceImpl
        implements RecognitionService {

    private final ContentRecognitionProvider contentRecognitionProvider;

    public RecognitionServiceImpl(
            ContentRecognitionProvider contentRecognitionProvider
    ) {
        this.contentRecognitionProvider = contentRecognitionProvider;
    }

    @Override
    public String checkConnection() {
        return contentRecognitionProvider.generateText(
                "Hãy trả lời chính xác bằng tiếng Việt: "
                        + "Đã kết nối Gemini 3.8 Flash thành công."
        );
    }
}
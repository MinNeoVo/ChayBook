package com.chaybook.backend.recognition.provider;

public interface ContentRecognitionProvider {

    String generateText(String prompt);

    String generateContent(
            String prompt,
            byte[] imageBytes,
            String mimeType
    );

}
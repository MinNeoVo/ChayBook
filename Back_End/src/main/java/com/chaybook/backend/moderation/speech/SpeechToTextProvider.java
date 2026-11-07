package com.chaybook.backend.moderation.speech;

public interface SpeechToTextProvider {

    String transcribe(byte[] audioBytes);
}
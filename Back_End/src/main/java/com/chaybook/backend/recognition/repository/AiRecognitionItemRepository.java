package com.chaybook.backend.recognition.repository;

import com.chaybook.backend.recognition.entity.AiRecognitionItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiRecognitionItemRepository
        extends JpaRepository<AiRecognitionItem, Integer> {
}
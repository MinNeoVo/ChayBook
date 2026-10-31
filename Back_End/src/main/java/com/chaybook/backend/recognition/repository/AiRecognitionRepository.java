package com.chaybook.backend.recognition.repository;

import com.chaybook.backend.recognition.entity.AiRecognition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiRecognitionRepository
        extends JpaRepository<AiRecognition, Integer> {
}
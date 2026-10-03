package com.chaybook.backend.allergy.controller;

import com.chaybook.backend.allergy.dto.AllergyResponse;
import com.chaybook.backend.allergy.service.AllergyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/allergies")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class AllergyController {
    private final AllergyService allergyService;

    public AllergyController(AllergyService allergyService) {
        this.allergyService = allergyService;
    }

    @GetMapping
    public ResponseEntity<List<AllergyResponse>> getAllergies() {
        return ResponseEntity.ok(allergyService.getAllAllergies());
    }
}

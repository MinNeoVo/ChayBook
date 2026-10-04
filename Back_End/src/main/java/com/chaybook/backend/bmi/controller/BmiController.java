package com.chaybook.backend.bmi.controller;

import com.chaybook.backend.bmi.dto.BmiCreateRequest;
import com.chaybook.backend.bmi.dto.BmiHistoryItem;
import com.chaybook.backend.bmi.dto.BmiResponse;
import com.chaybook.backend.bmi.service.BmiService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api")
@RestController
public class BmiController {

    private final BmiService bmiService;

    BmiController(BmiService bmiService) {
        this.bmiService = bmiService;
    }

    // API 1: POST /api/bmi
    @PostMapping("/bmi")
    public ResponseEntity<BmiResponse> createBmi(@RequestBody BmiCreateRequest request) {
        BmiResponse response = bmiService.createBmiRecord(request);
        return ResponseEntity.ok(response);
    }

    // API 2: GET /api/users/{userId}/bmi/latest
    @GetMapping("/users/{userId}/bmi/latest")
    public ResponseEntity<BmiResponse> getLatestBmi(@PathVariable Integer userId) {
        BmiResponse response = bmiService.getLatestBmi(userId);
        return ResponseEntity.ok(response);
    }

    // API 3: GET /api/users/{userId}/bmi
    @GetMapping("/users/{userId}/bmi")
    public ResponseEntity<List<BmiHistoryItem>> getBmiHistory(@PathVariable Integer userId) {
        List<BmiHistoryItem> history = bmiService.getBmiHistory(userId);
        return ResponseEntity.ok(history);
    }
}
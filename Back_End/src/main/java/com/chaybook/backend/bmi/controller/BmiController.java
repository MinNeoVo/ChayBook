package com.chaybook.backend.bmi.controller;

import com.chaybook.backend.bmi.dto.BmiCreateRequest;
import com.chaybook.backend.bmi.dto.BmiHistoryItem;
import com.chaybook.backend.bmi.dto.BmiResponse;
import com.chaybook.backend.bmi.service.BmiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class BmiController {

    @Autowired
    private BmiService bmiService;

    // API 1: POST /api/bmi
    @PostMapping("/api/bmi")
    public ResponseEntity<BmiResponse> createBmi(@RequestBody BmiCreateRequest request) {
        BmiResponse response = bmiService.createBmiRecord(request);
        return ResponseEntity.ok(response);
    }

    // API 2: GET /api/users/{userId}/bmi/latest
    @GetMapping("/api/users/{userId}/bmi/latest")
    public ResponseEntity<BmiResponse> getLatestBmi(@PathVariable Integer userId) {
        BmiResponse response = bmiService.getLatestBmi(userId);
        return ResponseEntity.ok(response);
    }

    // API 3: GET /api/users/{userId}/bmi
    @GetMapping("/api/users/{userId}/bmi")
    public ResponseEntity<List<BmiHistoryItem>> getBmiHistory(@PathVariable Integer userId) {
        List<BmiHistoryItem> history = bmiService.getBmiHistory(userId);
        return ResponseEntity.ok(history);
    }
}
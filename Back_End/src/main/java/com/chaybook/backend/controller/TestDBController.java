package com.chaybook.backend.controller;

//import com.chaybook.backend.entity.User;
import com.chaybook.backend.repository.UserRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestDBController {
    private final UserRepository userRepository;

    public TestDBController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/test-db")
    public Map<String, Long> testDatabase() {
        return Map.of("userCount", userRepository.count());
    }
}

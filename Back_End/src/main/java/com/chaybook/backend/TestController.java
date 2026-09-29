package com.chaybook.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping
    public String test() {
        return "ChayBook API is working!";
    }

    @GetMapping("/protected")
    public String protectedApi() {
        return "JWT authentication successful!";
    }
}
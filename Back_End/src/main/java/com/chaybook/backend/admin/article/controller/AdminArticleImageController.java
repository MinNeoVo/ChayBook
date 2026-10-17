package com.chaybook.backend.admin.article.controller;

import com.chaybook.backend.admin.article.service.AdminArticleImageService;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
public class AdminArticleImageController {
    private final AdminArticleImageService imageService;

    public AdminArticleImageController(AdminArticleImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping(value = "/api/admin/articles/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file, Authentication authentication) {
        int adminId;
        try {
            adminId = Integer.parseInt(authentication.getName());
            if (adminId <= 0) throw new NumberFormatException();
        } catch (NullPointerException | NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        }
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(Map.of("coverImage", imageService.upload(adminId, file)));
    }

    @GetMapping("/api/article-images/{filename}")
    public ResponseEntity<Resource> image(@PathVariable String filename) {
        Resource image = imageService.load(filename);
        String type = filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(type))
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS)).body(image);
    }
}

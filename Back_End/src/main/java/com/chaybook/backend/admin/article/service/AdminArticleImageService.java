package com.chaybook.backend.admin.article.service;

import com.chaybook.backend.media.dto.MediaUploadResponse;
import com.chaybook.backend.media.service.MediaService;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class AdminArticleImageService {
    private final UserRepository userRepository;
    private final MediaService mediaService;
    private final Path directory = Path.of("uploads", "articles").toAbsolutePath().normalize();

    public AdminArticleImageService(UserRepository userRepository, MediaService mediaService) {
        this.userRepository = userRepository;
        this.mediaService = mediaService;
    }

    public String upload(Integer adminId, MultipartFile file) {
        var admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again"));
        if (!"ADMIN".equals(admin.getRole()) || !"ACTIVE".equals(admin.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "An active administrator is required");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image or video file");
        }
        try {
            MediaUploadResponse response = mediaService.upload(file);
            return response.getUrl();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    public Resource load(String filename) {
        if (!filename.matches("[a-f0-9-]{36}\\.(jpg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }
        try {
            Resource resource = new UrlResource(directory.resolve(filename).toUri());
            if (!resource.isReadable()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
            return resource;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found");
        }
    }
}

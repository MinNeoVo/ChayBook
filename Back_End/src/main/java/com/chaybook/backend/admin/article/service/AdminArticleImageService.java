package com.chaybook.backend.admin.article.service;

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
import java.util.UUID;

@Service
public class AdminArticleImageService {
    private final UserRepository userRepository;
    private final Path directory = Path.of("uploads", "articles").toAbsolutePath().normalize();

    public AdminArticleImageService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String upload(Integer adminId, MultipartFile file) {
        var admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again"));
        if (!"ADMIN".equals(admin.getRole()) || !"ACTIVE".equals(admin.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "An active administrator is required");
        }
        if (file == null || file.isEmpty() || file.getSize() > 5L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image up to 5 MB");
        }
        try {
            byte[] bytes = file.getBytes();
            String extension = imageExtension(bytes);
            String filename = UUID.randomUUID() + extension;
            Files.createDirectories(directory);
            Files.write(directory.resolve(filename), bytes);
            return "/api/article-images/" + filename;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store article image");
        }
    }

    // Detect the file signature rather than trusting its supplied name or MIME type.
    private String imageExtension(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255) return ".jpg";
        if (bytes.length >= 8 && bytes[0] == (byte) 137 && bytes[1] == 80 && bytes[2] == 78 && bytes[3] == 71
                && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) return ".png";
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') return ".webp";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a JPG, PNG, or WebP image");
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

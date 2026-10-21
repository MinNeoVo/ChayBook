package com.chaybook.backend.media.service;

import com.chaybook.backend.config.CloudinaryConfig;
import com.chaybook.backend.media.dto.MediaUploadResponse;
import com.cloudinary.Cloudinary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class MediaService {

    private final Cloudinary cloudinary;

    public MediaService(CloudinaryConfig config) {
        this.cloudinary = config.cloudinary();
    }

    public MediaUploadResponse upload(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file.");
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !(contentType.startsWith("image/")
                || contentType.startsWith("video/"))) {
            throw new IllegalArgumentException(
                    "Chỉ chấp nhận file ảnh hoặc video."
            );
        }

        // Giới hạn 50 MB cho mỗi file
        if (file.getSize() > 50L * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Dung lượng file không được vượt quá 50 MB."
            );
        }

        try {
            Map<String, Object> options = new HashMap<>();
            options.put("folder", "chaybook");
            options.put("resource_type", "auto");

            Map<?, ?> result = cloudinary.uploader()
                    .upload(file.getBytes(), options);

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            String mediaType = (String) result.get("resource_type");

            return new MediaUploadResponse(
                    url,
                    mediaType,
                    publicId
            );

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Không thể upload file lên Cloudinary.",
                    e
            );
        }
    }
}
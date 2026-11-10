package com.chaybook.backend.video.controller;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;

final class VideoAuthentication {
    private VideoAuthentication() {}
    static Integer requireUserId(Jwt jwt) {
        try {
            if (jwt == null) throw new IllegalArgumentException();
            int id = Integer.parseInt(jwt.getSubject());
            if (id <= 0) throw new IllegalArgumentException();
            return id;
        } catch (IllegalArgumentException e) {
            throw new VideoAnalysisException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Bạn cần đăng nhập.");
        }
    }
}

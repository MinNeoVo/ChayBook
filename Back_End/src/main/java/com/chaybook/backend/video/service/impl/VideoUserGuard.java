package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoUserGuard {
    private final UserRepository users;
    public VideoUserGuard(UserRepository users) { this.users = users; }

    @Transactional(readOnly = true)
    public User requireActive(Integer userId) {
        if (userId == null || userId <= 0) {
            throw new VideoAnalysisException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "Vui lòng đăng nhập.");
        }
        User user = users.findById(userId).orElseThrow(() ->
                new VideoAnalysisException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "Vui lòng đăng nhập lại."));
        return validateActive(user);
    }

    @Transactional
    public User requireActiveForSubmission(Integer userId) {
        User user = users.findByIdForVideoSubmission(userId).orElseThrow(() ->
                new VideoAnalysisException(HttpStatus.UNAUTHORIZED, "LOGIN_REQUIRED", "Vui lòng đăng nhập lại."));
        return validateActive(user);
    }

    private User validateActive(User user) {
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new VideoAnalysisException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", "Tài khoản không hoạt động.");
        }
        return user;
    }
}

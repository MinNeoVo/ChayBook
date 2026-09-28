package com.chaybook.backend.auth.service;

import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
@Transactional(readOnly = true)
public class SessionCurrentUserProvider implements CurrentUserProvider {
    private final UserRepository userRepository;

    public SessionCurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User requireUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof Integer userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is not active");
        }
        return user;
    }

    @Override
    public User requireAdmin() {
        User user = requireUser();
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "An Admin account is required");
        }
        return user;
    }
}

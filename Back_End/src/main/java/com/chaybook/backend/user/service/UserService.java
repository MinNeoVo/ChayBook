package com.chaybook.backend.user.service;

import com.chaybook.backend.user.dto.ChangePasswordRequest;
import com.chaybook.backend.user.dto.UpdateProfileRequest;
import com.chaybook.backend.user.dto.UpdateProfileResponse;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.exception.IncorrectCurrentPasswordException;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;  //Cos kha nang anh huong Auth
    }

    @Transactional
    public UpdateProfileResponse updateProfile(
            Integer userId,
            Integer authenticatedUserId,
            UpdateProfileRequest request
    ) {
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid user ID"
            );
        }

        if (!userId.equals(authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only update your own profile"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        boolean usernameTaken =
                userRepository.existsByUsernameIgnoreCaseAndUserIdNot(
                        request.username(),
                        userId
                );

        if (usernameTaken) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username is already in use"
            );
        }

        user.setUsername(request.username());
        user.setFullName(request.fullName());
        user.setAvatarUrl(request.avatarUrl());

        User savedUser = userRepository.saveAndFlush(user);

        return new UpdateProfileResponse(
                "Profile updated successfully",
                new UpdateProfileResponse.UserData(
                        savedUser.getUserId(),
                        savedUser.getUsername(),
                        savedUser.getEmail(),
                        savedUser.getFullName(),
                        savedUser.getAvatarUrl(),
                        savedUser.getRole(),
                        savedUser.getStatus()
                )
        );
    }



    @Transactional
    public void changePassword(
            Integer userId,
            Integer authenticatedUserId,
            ChangePasswordRequest request
    ) {
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid user ID"
            );
        }

        if (!userId.equals(authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only change your own password"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        if (request.currentPassword()
                .getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IncorrectCurrentPasswordException();
        }

        boolean correctPassword = passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
        );

        if (!correctPassword) {
            throw new IncorrectCurrentPasswordException();
        }

        if (request.newPassword()
                .getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must not exceed 72 UTF-8 bytes"
            );
        }

        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword())
        );

        userRepository.saveAndFlush(user);
    }


}
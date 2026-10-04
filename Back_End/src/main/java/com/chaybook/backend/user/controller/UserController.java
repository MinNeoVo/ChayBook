package com.chaybook.backend.user.controller;

import com.chaybook.backend.user.dto.*;
import com.chaybook.backend.user.exception.IncorrectCurrentPasswordException;
import com.chaybook.backend.user.service.UserService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Lấy thông tin profile + danh sách bài viết của user đang đăng nhập.
     */
    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer currentUserId = requireCurrentUserId(jwt);

        UserProfileResponse response = userService.getProfile(currentUserId);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    private Integer requireCurrentUserId(Jwt jwt) {
        if (jwt != null) {
            try {
                int userId = Integer.parseInt(jwt.getSubject());
                if (userId > 0) {
                    return userId;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Please log in with a valid account"
        );
    }

    @PutMapping(value = "/{userId}",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<UpdateProfileResponse> updateProfile(
            @PathVariable("userId") Integer userId,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest)
    {
        HttpSession session = httpRequest.getSession(false);

        Object sessionUserId = session == null? null: session.getAttribute("AUTH_USER_ID");

        if (!(sessionUserId instanceof Integer authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }



        UpdateProfileResponse response = userService.updateProfile(
                userId,
                authenticatedUserId,
                request
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping(
            value = "/{userId}/password",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ChangePasswordResponse> changePassword(
            @PathVariable("userId") Integer userId,
            @Valid @RequestBody ChangePasswordRequest request,

            HttpServletRequest httpRequest
    ) {
        HttpSession session = httpRequest.getSession(false);

        Object sessionUserId = session == null
                ? null
                : session.getAttribute("AUTH_USER_ID");

        if (!(sessionUserId instanceof Integer authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }


        userService.changePassword(
                userId,
                authenticatedUserId,
                request
        );
        session.invalidate();

        return ResponseEntity.ok(
                new ChangePasswordResponse(
                        "Password changed successfully"
                )
        );
    }

    @ExceptionHandler(IncorrectCurrentPasswordException.class)
    public ResponseEntity<ChangePasswordResponse> handleIncorrectCurrentPassword(
            IncorrectCurrentPasswordException exception
    ) {
        return ResponseEntity.badRequest().body(
                new ChangePasswordResponse(exception.getMessage())
        );
    }




}
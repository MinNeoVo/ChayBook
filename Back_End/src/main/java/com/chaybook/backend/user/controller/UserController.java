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

    @PutMapping(value = "/{userId}",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<UpdateProfileResponse> updateProfile(
            @PathVariable("userId") Integer userId,
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal Jwt jwt)
    {
        Integer authenticatedUserId = requireAuthenticatedUserId(jwt);


        UpdateProfileResponse response = userService.updateProfile(
                userId,
                authenticatedUserId,
                request
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @PutMapping(
            value = "/{userId}/password",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ChangePasswordResponse> changePassword(
            @PathVariable("userId") Integer userId,
            @Valid @RequestBody ChangePasswordRequest request,

            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer authenticatedUserId = requireAuthenticatedUserId(jwt);

        userService.changePassword(
                userId,
                authenticatedUserId,
                request
        );

        // Chỉ xóa cookie sau khi đổi mật khẩu thành công.
        // Các thuộc tính khớp với cookie trong AuthController.
        ResponseCookie expiredCookie = ResponseCookie
                .from("CHAYBOOK_TOKEN", "")
                .httpOnly(true)
                .secure(false) // Khớp cấu hình localhost HTTP hiện tại.
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        expiredCookie.toString()
                )
                .cacheControl(CacheControl.noStore())
                .body(new ChangePasswordResponse(
                        "Password changed successfully"
                ));
    }

    @ExceptionHandler(IncorrectCurrentPasswordException.class)
    public ResponseEntity<ChangePasswordResponse> handleIncorrectCurrentPassword(
            IncorrectCurrentPasswordException exception
    ) {
        return ResponseEntity.badRequest()
                .cacheControl(CacheControl.noStore())
                .body(new ChangePasswordResponse(
                        exception.getMessage()
                ));
    }

    private Integer requireAuthenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        try {
            int userId = Integer.parseInt(jwt.getSubject());

            if (userId > 0) {
                return userId;
            }
        } catch (NumberFormatException exception) {
            // Subject không phải userId hợp lệ.
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid authentication information"
        );
    }





}
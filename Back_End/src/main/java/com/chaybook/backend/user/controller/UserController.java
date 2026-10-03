package com.chaybook.backend.user.controller;

import com.chaybook.backend.allergy.dto.AllergyResponse;
import com.chaybook.backend.allergy.dto.UpdateUserAllergiesRequest;
import com.chaybook.backend.allergy.service.AllergyService;
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

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class UserController {

    private final UserService userService;
    private final AllergyService allergyService;

    public UserController(UserService userService, AllergyService allergyService) {
        this.userService = userService;
        this.allergyService = allergyService;
    }

    @GetMapping("/me/allergies")
    public ResponseEntity<List<AllergyResponse>> getCurrentUserAllergies(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(allergyService.getUserAllergies(authenticatedUserId(jwt)));
    }

    @PutMapping(
            value = "/me/allergies",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<AllergyResponse>> replaceCurrentUserAllergies(
            @Valid @RequestBody UpdateUserAllergiesRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(allergyService.replaceUserAllergies(
                authenticatedUserId(jwt),
                request.allergyIds()
        ));
    }

    private Integer authenticatedUserId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        }
        try {
            return Integer.valueOf(jwt.getSubject());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "The authenticated user ID is invalid",
                    exception
            );
        }
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

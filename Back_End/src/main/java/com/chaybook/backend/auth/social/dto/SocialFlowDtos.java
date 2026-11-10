package com.chaybook.backend.auth.social.dto;

import com.chaybook.backend.auth.dto.MeResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class SocialFlowDtos {

    private SocialFlowDtos() {
    }

    public record EmailRequest(
            @NotBlank @Email @Size(max = 255)
            String email
    ) {
    }

    public record RegistrationRequest(
            @NotBlank @Email @Size(max = 255)
            String email,

            @NotBlank @Pattern(regexp = "[0-9]{6}")
            String code
    ) {
    }

    public record LinkRequest(
            @Size(max = 128)
            String password,

            @Pattern(regexp = "[0-9]{6}")
            String code
    ) {
    }

    public record PendingResponse(
            String provider,
            String email,
            String displayName
    ) {
    }

    public record AuthorizationResponse(
            String authorizationUrl
    ) {
    }

    public record SessionResponse(
            MeResponse user
    ) {
    }
}
package com.chaybook.backend.auth.social.dto;

public record SocialCsrfResponse(
        String token,
        String headerName
) {
}
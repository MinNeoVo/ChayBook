package com.chaybook.backend.auth.social.service.impl;

import com.chaybook.backend.auth.social.dto.SocialFlowDtos.PendingResponse;
import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.model.SocialFlowContext.Registration;
import com.chaybook.backend.auth.social.service.SocialAccountService;
import com.chaybook.backend.auth.social.service.SocialProofService;
import com.chaybook.backend.auth.social.service.SocialRegistrationService;
import com.chaybook.backend.user.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class SocialRegistrationServiceImpl
        implements SocialRegistrationService {

    private final SocialAccountService accounts;
    private final SocialProofService proofs;

    public SocialRegistrationServiceImpl(
            SocialAccountService accounts,
            SocialProofService proofs
    ) {
        this.accounts = accounts;
        this.proofs = proofs;
    }

    @Override
    public Registration begin(VerifiedSocialIdentity identity) {
        return new Registration(
                "registration:" + UUID.randomUUID(),
                identity,
                Instant.now().plusSeconds(600)
        );
    }

    @Override
    public PendingResponse getPending(Registration registration) {
        requireValid(registration);

        VerifiedSocialIdentity identity = registration.identity();

        return new PendingResponse(
                identity.provider().name().toLowerCase(Locale.ROOT),
                identity.email(),
                identity.displayName()
        );
    }

    @Override
    public void requestCode(Registration registration, String email) {
        requireValid(registration);

        proofs.sendCode(
                registration.challengeId(),
                normalizeEmail(email)
        );
    }

    @Override
    public User complete(
            Registration registration,
            String email,
            String code
    ) {
        requireValid(registration);

        String normalizedEmail = normalizeEmail(email);

        proofs.verifyAndConsume(
                registration.challengeId(),
                normalizedEmail,
                code
        );

        return accounts.completeRegistration(
                registration.identity(),
                normalizedEmail
        );
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new SocialAuthException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_EMAIL",
                    "Email không hợp lệ."
            );
        }

        return email.strip().toLowerCase(Locale.ROOT);
    }

    private void requireValid(Registration registration) {
        if (registration == null
                || !Instant.now().isBefore(registration.expiresAt())) {
            throw new SocialAuthException(
                    HttpStatus.BAD_REQUEST,
                    "REGISTRATION_EXPIRED",
                    "Lượt đăng ký đã hết hạn. Vui lòng đăng nhập lại."
            );
        }
    }
}
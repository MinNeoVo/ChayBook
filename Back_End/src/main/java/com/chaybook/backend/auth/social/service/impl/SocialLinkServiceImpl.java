package com.chaybook.backend.auth.social.service.impl;

import com.chaybook.backend.auth.social.config.SocialAuthProperties;
import com.chaybook.backend.auth.social.dto.SocialFlowDtos.LinkRequest;
import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.entity.SocialProvider;
import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.model.SocialFlowContext.Actor;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkIntent;
import com.chaybook.backend.auth.social.model.SocialFlowContext.LinkProof;
import com.chaybook.backend.auth.social.service.SocialAccountService;
import com.chaybook.backend.auth.social.service.SocialLinkService;
import com.chaybook.backend.auth.social.service.SocialProofService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class SocialLinkServiceImpl implements SocialLinkService {

    private final UserRepository users;
    private final SocialAccountService accounts;
    private final SocialProofService proofs;
    private final SocialAuthProperties properties;

    public SocialLinkServiceImpl(
            UserRepository users,
            SocialAccountService accounts,
            SocialProofService proofs,
            SocialAuthProperties properties
    ) {
        this.users = users;
        this.accounts = accounts;
        this.proofs = proofs;
        this.properties = properties;
    }

    @Override
    public LinkProof createProof(Actor actor) {
        User user = requireActiveUser(actor.userId());

        if (hasPassword(user)) {
            throw new SocialAuthException(
                    HttpStatus.CONFLICT,
                    "PASSWORD_REQUIRED",
                    "Hãy xác minh bằng mật khẩu hiện tại."
            );
        }

        return new LinkProof(
                "link:" + UUID.randomUUID(),
                actor,
                normalizeEmail(user.getEmail()),
                Instant.now().plusSeconds(600)
        );
    }

    @Override
    public void requestCode(LinkProof proof, Actor actor) {
        User user = requireActiveUser(actor.userId());
        requireProof(proof, actor, user);

        if (hasPassword(user)) {
            throw new SocialAuthException(
                    HttpStatus.CONFLICT,
                    "PASSWORD_REQUIRED",
                    "Hãy xác minh bằng mật khẩu hiện tại."
            );
        }

        proofs.sendCode(proof.challengeId(), proof.email());
    }

    @Override
    public LinkIntent prepare(
            Actor actor,
            SocialProvider provider,
            LinkRequest request,
            LinkProof proof
    ) {
        requireEnabled(provider);

        User user = requireActiveUser(actor.userId());

        if (hasPassword(user)) {
            proofs.verifyPassword(
                    user.getUserId(),
                    request.password(),
                    user.getPasswordHash()
            );
        } else {
            requireProof(proof, actor, user);

            proofs.verifyAndConsume(
                    proof.challengeId(),
                    proof.email(),
                    request.code()
            );
        }

        return new LinkIntent(
                UUID.randomUUID().toString(),
                actor,
                provider,
                Instant.now().plusSeconds(300)
        );
    }

    @Override
    public void complete(
            LinkIntent intent,
            Actor actor,
            VerifiedSocialIdentity identity
    ) {
        if (intent == null
                || !Instant.now().isBefore(intent.expiresAt())
                || !intent.actor().equals(actor)
                || intent.provider() != identity.provider()) {
            throw changedSession();
        }

        // SocialAccountService kiểm tra ACTIVE và ràng buộc liên kết lần nữa.
        accounts.link(actor.userId(), identity);
    }

    private void requireProof(
            LinkProof proof,
            Actor actor,
            User user
    ) {
        if (proof == null
                || !Instant.now().isBefore(proof.expiresAt())
                || !proof.actor().equals(actor)
                || !proof.email().equals(normalizeEmail(user.getEmail()))) {
            throw changedSession();
        }
    }

    private User requireActiveUser(Integer userId) {
        User user = users.findById(userId).orElseThrow(() ->
                new SocialAuthException(
                        HttpStatus.UNAUTHORIZED,
                        "AUTHENTICATION_REQUIRED",
                        "Vui lòng đăng nhập lại."
                )
        );

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new SocialAuthException(
                    HttpStatus.FORBIDDEN,
                    "ACCOUNT_DISABLED",
                    "Tài khoản không còn hoạt động."
            );
        }

        return user;
    }

    private void requireEnabled(SocialProvider provider) {
        boolean configured = switch (provider) {
            case GOOGLE -> properties.getGoogle().isConfigured();
            case FACEBOOK -> properties.getFacebook().isConfigured();
        };

        if (!properties.isLoginEnabled() || !configured) {
            throw new SocialAuthException(
                    HttpStatus.BAD_REQUEST,
                    "PROVIDER_DISABLED",
                    "Phương thức đăng nhập này chưa được bật."
            );
        }
    }

    private boolean hasPassword(User user) {
        return user.getPasswordHash() != null
                && !user.getPasswordHash().isBlank();
    }

    private String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private SocialAuthException changedSession() {
        return new SocialAuthException(
                HttpStatus.UNAUTHORIZED,
                "LINK_SESSION_CHANGED",
                "Lượt liên kết không còn hợp lệ. Vui lòng bắt đầu lại."
        );
    }
}
package com.chaybook.backend.auth.social.service.impl;

import com.chaybook.backend.auth.social.dto.SocialConnectionResponse;
import com.chaybook.backend.auth.social.dto.SocialConnectionsResponse;
import com.chaybook.backend.auth.social.dto.SocialLoginResolution;
import com.chaybook.backend.auth.social.dto.VerifiedSocialIdentity;
import com.chaybook.backend.auth.social.entity.UserSocialIdentity;
import com.chaybook.backend.auth.social.exception.SocialAuthException;
import com.chaybook.backend.auth.social.repository.UserSocialIdentityRepository;
import com.chaybook.backend.auth.social.service.SocialAccountService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class SocialAccountServiceImpl implements SocialAccountService {
    private final UserRepository users;
    private final UserSocialIdentityRepository identities;

    public SocialAccountServiceImpl(UserRepository users, UserSocialIdentityRepository identities) {
        this.users = users;
        this.identities = identities;
    }

    @Override
    public SocialLoginResolution resolveLogin(VerifiedSocialIdentity identity) {
        validateIdentity(identity);
        Optional<UserSocialIdentity> linked = findIdentity(identity);
        if (linked.isPresent()) {
            return SocialLoginResolution.authenticated(requireActive(linked.get().getUser()));
        }

        String email = normalizeEmail(identity.email());
        if (!identity.emailTrusted() || !isUsableEmail(email)) {
            return SocialLoginResolution.registrationPending();
        }
        return SocialLoginResolution.authenticated(createUser(identity, email));
    }

    @Override
    public User completeRegistration(VerifiedSocialIdentity identity, String verifiedEmail) {
        validateIdentity(identity);
        String email = normalizeEmail(verifiedEmail);
        if (!isUsableEmail(email)) {
            throw new SocialAuthException(HttpStatus.BAD_REQUEST, "INVALID_EMAIL", "Email xác minh không hợp lệ.");
        }
        Optional<UserSocialIdentity> linked = findIdentity(identity);
        if (linked.isPresent()) {
            return requireActive(linked.get().getUser());
        }
        return createUser(identity, email);
    }

    @Override
    public void link(Integer userId, VerifiedSocialIdentity identity) {
        validateIdentity(identity);
        User user = requireUser(userId);
        Optional<UserSocialIdentity> linked = findIdentity(identity);
        if (linked.isPresent()) {
            if (Objects.equals(linked.get().getUser().getUserId(), userId)) {
                return;
            }
            throw new SocialAuthException(HttpStatus.CONFLICT, "SOCIAL_IDENTITY_ALREADY_LINKED",
                    "Tài khoản mạng xã hội này đã liên kết với một tài khoản ChayBook khác.");
        }
        if (identities.existsByUser_UserIdAndProvider(userId, identity.provider())) {
            throw new SocialAuthException(HttpStatus.CONFLICT, "PROVIDER_ALREADY_LINKED",
                    "Bạn đã liên kết một tài khoản của nhà cung cấp này.");
        }
        try {
            identities.saveAndFlush(new UserSocialIdentity(user, identity.provider(), identity.subject()));
        } catch (DataIntegrityViolationException exception) {
            throw concurrentConflict(exception);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SocialConnectionsResponse connections(Integer userId) {
        User user = requireUser(userId);
        var connections = identities.findAllByUser_UserIdOrderByProviderAsc(userId).stream()
                .map(identity -> new SocialConnectionResponse(identity.getProvider(), identity.getCreatedAt()))
                .toList();
        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
        return new SocialConnectionsResponse(hasPassword, connections);
    }

    private User createUser(VerifiedSocialIdentity identity, String email) {
        if (users.existsByEmailIgnoreCase(email)) {
            throw new SocialAuthException(HttpStatus.CONFLICT, "ACCOUNT_LINK_REQUIRED",
                    "Email này đã có tài khoản. Hãy đăng nhập tài khoản hiện có để liên kết.");
        }
        User user = new User();
        user.setUsername(newUsername(identity));
        user.setEmail(email);
        user.setPasswordHash(null);
        user.setRole("USER");
        user.setStatus("ACTIVE");
        user.setFullName(displayName(identity.displayName(), user.getUsername()));
        user.setAvatarUrl(avatarUrl(identity.avatarUrl()));
        try {
            User saved = users.saveAndFlush(user);
            identities.saveAndFlush(new UserSocialIdentity(saved, identity.provider(), identity.subject()));
            return saved;
        } catch (DataIntegrityViolationException exception) {
            // Let the surrounding transaction roll back both rows; never retry in a failed transaction.
            throw concurrentConflict(exception);
        }
    }

    private Optional<UserSocialIdentity> findIdentity(VerifiedSocialIdentity identity) {
        return identities.findByProviderAndProviderUserId(identity.provider(), identity.subject());
    }

    private User requireUser(Integer userId) {
        if (userId == null || userId <= 0) {
            throw authenticationRequired();
        }
        return requireActive(users.findById(userId).orElseThrow(this::authenticationRequired));
    }

    private User requireActive(User user) {
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new SocialAuthException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Tài khoản không còn hoạt động.");
        }
        return user;
    }

    private SocialAuthException authenticationRequired() {
        return new SocialAuthException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Vui lòng đăng nhập lại.");
    }

    private void validateIdentity(VerifiedSocialIdentity identity) {
        if (identity == null || identity.provider() == null || identity.subject() == null
                || identity.subject().isBlank() || identity.subject().length() > 255
                || !identity.subject().equals(identity.subject().strip())) {
            throw new SocialAuthException(HttpStatus.BAD_REQUEST, "INVALID_SOCIAL_IDENTITY",
                    "Thông tin xác thực từ nhà cung cấp không hợp lệ.");
        }
    }

    private String newUsername(VerifiedSocialIdentity identity) {
        for (int attempt = 0; attempt < 3; attempt++) {
            String username = identity.provider().name().toLowerCase(Locale.ROOT) + "_"
                    + UUID.randomUUID().toString().replace("-", "");
            if (!users.existsByUsernameIgnoreCase(username)) {
                return username;
            }
        }
        throw new SocialAuthException(HttpStatus.CONFLICT, "SOCIAL_ACCOUNT_CONFLICT",
                "Chưa thể tạo tài khoản. Vui lòng thử lại.");
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }

    private boolean isUsableEmail(String email) {
        if (email == null || email.isBlank() || email.length() > 255) {
            return false;
        }
        try {
            InternetAddress address = new InternetAddress(email, true);
            address.validate();
            return email.equals(address.getAddress()) && address.getPersonal() == null;
        } catch (AddressException exception) {
            return false;
        }
    }

    private String displayName(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String normalized = value.strip();
        return normalized.length() <= 255 ? normalized : normalized.substring(0, 255);
    }

    private String avatarUrl(String value) {
        if (value == null || value.length() > 255) {
            return null;
        }
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null
                    && uri.getUserInfo() == null ? value : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private SocialAuthException concurrentConflict(DataIntegrityViolationException cause) {
        return new SocialAuthException(HttpStatus.CONFLICT, "SOCIAL_ACCOUNT_CONFLICT",
                "Thông tin tài khoản vừa thay đổi. Vui lòng bắt đầu đăng nhập hoặc liên kết lại.", cause);
    }
}

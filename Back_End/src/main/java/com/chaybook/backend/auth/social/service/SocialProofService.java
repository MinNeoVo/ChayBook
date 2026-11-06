package com.chaybook.backend.auth.social.service;

import com.chaybook.backend.auth.social.exception.SocialAuthException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SocialProofService {

    private static final int MAX_ENTRIES = 10_000;
    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_SENDS = 3;

    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final String mailFrom;

    private final SecureRandom random = new SecureRandom();
    private final Map<String, Challenge> challenges = new ConcurrentHashMap<>();
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public SocialProofService(
            JavaMailSender mailSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.mail.from:}") String mailFrom
    ) {
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.mailFrom = mailFrom;
    }

    public void sendCode(String challengeId, String email) {
        cleanup();

        if (!challenges.containsKey(challengeId)
                && challenges.size() >= MAX_ENTRIES) {
            throw limited();
        }

        Challenge challenge = challenges.computeIfAbsent(
                challengeId,
                ignored -> new Challenge(Instant.now().plusSeconds(600))
        );

        synchronized (challenge) {
            Instant now = Instant.now();

            if (!now.isBefore(challenge.expiresAt)) {
                throw invalidOtp();
            }

            if (challenge.attempts >= MAX_ATTEMPTS
                    || challenge.sends >= MAX_SENDS) {
                throw limited();
            }

            if (now.isBefore(challenge.nextSendAt)) {
                throw new SocialAuthException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "RESEND_TOO_SOON",
                        "Vui lòng đợi 60 giây trước khi gửi lại mã."
                );
            }

            // Giới hạn theo email, kể cả khi tạo nhiều session.
            takeAttempt("mail:" + email, MAX_SENDS);

            String code = String.format(
                    Locale.ROOT,
                    "%06d",
                    random.nextInt(1_000_000)
            );

            challenge.email = email;
            challenge.hash = passwordEncoder.encode(code);
            challenge.sends++;
            challenge.nextSendAt = now.plusSeconds(60);

            SimpleMailMessage message = new SimpleMailMessage();

            if (mailFrom != null && !mailFrom.isBlank()) {
                message.setFrom(mailFrom);
            }

            message.setTo(email);
            message.setSubject("Xác minh tài khoản ChayBook");
            message.setText(
                    "Mã xác minh của bạn là " + code
                            + ". Mã chỉ dùng một lần, "
                            + "trong thời hạn của lượt xác minh hiện tại."
            );

            try {
                mailSender.send(message);
            } catch (MailException exception) {
                challenge.hash = null;

                throw new SocialAuthException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "EMAIL_DELIVERY_FAILED",
                        "Chưa thể gửi email xác minh.",
                        exception
                );
            }
        }
    }

    public void verifyAndConsume(
            String challengeId,
            String email,
            String code
    ) {
        Challenge challenge = challenges.get(challengeId);

        if (challenge == null) {
            throw invalidOtp();
        }

        synchronized (challenge) {
            if (!Instant.now().isBefore(challenge.expiresAt)
                    || challenge.hash == null
                    || challenge.attempts >= MAX_ATTEMPTS) {
                throw invalidOtp();
            }

            // Không reset số lần thử khi gửi lại OTP.
            challenge.attempts++;

            boolean valid = email.equals(challenge.email)
                    && code != null
                    && code.matches("[0-9]{6}")
                    && passwordEncoder.matches(code, challenge.hash);

            if (!valid) {
                throw invalidOtp();
            }

            // Tiêu thụ trước khi chuyển sang thao tác tiếp theo.
            challenge.hash = null;
        }
    }

    public void verifyPassword(
            Integer userId,
            String rawPassword,
            String passwordHash
    ) {
        cleanup();

        String key = "password:" + userId;
        takeAttempt(key, MAX_ATTEMPTS);

        boolean valid = rawPassword != null
                && rawPassword.getBytes(StandardCharsets.UTF_8).length <= 72
                && passwordHash != null
                && !passwordHash.isBlank()
                && passwordEncoder.matches(rawPassword, passwordHash);

        if (!valid) {
            throw new SocialAuthException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_PASSWORD",
                    "Mật khẩu hiện tại không chính xác."
            );
        }

        windows.remove(key);
    }

    private void takeAttempt(String key, int maximum) {
        if (!windows.containsKey(key) && windows.size() >= MAX_ENTRIES) {
            throw limited();
        }

        Window window = windows.computeIfAbsent(
                key,
                ignored -> new Window(Instant.now().plusSeconds(600))
        );

        synchronized (window) {
            if (window.count >= maximum) {
                throw limited();
            }

            window.count++;
        }
    }

    private void cleanup() {
        Instant now = Instant.now();

        challenges.entrySet().removeIf(
                entry -> !now.isBefore(entry.getValue().expiresAt)
        );

        windows.entrySet().removeIf(
                entry -> !now.isBefore(entry.getValue().expiresAt)
        );
    }

    private SocialAuthException invalidOtp() {
        return new SocialAuthException(
                HttpStatus.BAD_REQUEST,
                "INVALID_OTP",
                "Mã xác minh không chính xác hoặc đã hết hạn."
        );
    }

    private SocialAuthException limited() {
        return new SocialAuthException(
                HttpStatus.TOO_MANY_REQUESTS,
                "TOO_MANY_ATTEMPTS",
                "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau."
        );
    }

    private static final class Challenge {
        private final Instant expiresAt;
        private String email;
        private String hash;
        private int attempts;
        private int sends;
        private Instant nextSendAt = Instant.EPOCH;

        private Challenge(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }
    }

    private static final class Window {
        private final Instant expiresAt;
        private int count;

        private Window(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }
    }
}
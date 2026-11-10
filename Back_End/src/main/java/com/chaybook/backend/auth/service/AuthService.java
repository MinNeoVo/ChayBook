package com.chaybook.backend.auth.service;

import com.chaybook.backend.auth.dto.LoginRequest;
import com.chaybook.backend.auth.dto.LoginResponse;
import com.chaybook.backend.auth.dto.MeResponse;
import com.chaybook.backend.auth.dto.RegisterRequest;
import com.chaybook.backend.auth.dto.RegisterResponse;
import com.chaybook.backend.auth.dto.VerifyRegistrationRequest;
import com.chaybook.backend.auth.dto.ResetPasswordRequest;
import com.chaybook.backend.auth.dto.VerifyPasswordResetRequest;
import com.chaybook.backend.auth.entity.AuthOtpChallenge;
import com.chaybook.backend.auth.repository.AuthOtpChallengeRepository;
import com.chaybook.backend.security.JwtService;
import com.chaybook.backend.user.repository.UserRepository;
import com.chaybook.backend.user.entity.User;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.security.core.Authentication;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AuthService {
    private static final String BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthOtpChallengeRepository otpRepository;
    private final RestClient restClient;
    private final String brevoApiKey;
    private final String brevoSenderEmail;
    private final String brevoSenderName;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthOtpChallengeRepository otpRepository,
            @Value("${brevo.api-key:}") String brevoApiKey,
            @Value("${brevo.sender-email:}") String brevoSenderEmail,
            @Value("${brevo.sender-name:ChayBook}") String brevoSenderName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpRepository = otpRepository;
        this.brevoApiKey = brevoApiKey == null ? "" : brevoApiKey.strip();
        this.brevoSenderEmail = brevoSenderEmail == null ? "" : brevoSenderEmail.strip();
        this.brevoSenderName = (brevoSenderName == null || brevoSenderName.isBlank())
                ? "ChayBook"
                : brevoSenderName.strip();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public LoginResult login(LoginRequest request) {

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(request.getEmail());

        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No account found with this email.");
        }

        User user = userOpt.get();

        String passwordHash = user.getPasswordHash();

        if (passwordHash == null || passwordHash.isBlank() || !passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Incorrect email or password.");
        }

        // Case 3: Tài khoản bị chưa active
        requireActive(user);

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole());

        LoginResponse response = new LoginResponse(
                "Login successful",
                new LoginResponse.UserData(
                        user.getUserId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getAvatarUrl(),
                        user.getRole()));

        return new LoginResult(response, token);
    }

    @Transactional
    public void startRegistration(RegisterRequest request) {

        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu không được vượt quá 72 ký tự");
        }

        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username đã được sử dụng");
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email đã được sử dụng");
        }

        String code = newOtp();
        AuthOtpChallenge challenge = otpRepository
                .findByEmailAndPurpose(request.email(), "REGISTER")
                .orElseGet(AuthOtpChallenge::new);
        challenge.setEmail(request.email());
        challenge.setPurpose("REGISTER");
        challenge.setOtpHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        challenge.setAttempts(0);
        challenge.setVerified(false);
        challenge.setUsername(request.username());
        challenge.setPasswordHash(passwordEncoder.encode(request.password()));
        challenge.setFullName(request.fullName());
        otpRepository.save(challenge);
        sendOtp(request.email(), code, "Xác minh email đăng ký ChayBook");
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public RegisterResponse verifyRegistration(VerifyRegistrationRequest request) {
        AuthOtpChallenge challenge = getValidChallenge(request.email().strip().toLowerCase(), "REGISTER",
                request.code());
        if (userRepository.existsByEmailIgnoreCase(challenge.getEmail())
                || userRepository.existsByUsernameIgnoreCase(challenge.getUsername())) {
            otpRepository.delete(challenge);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email hoặc username đã được sử dụng.");
        }
        User user = new User();
        user.setUsername(challenge.getUsername());
        user.setEmail(challenge.getEmail());
        user.setFullName(challenge.getFullName());
        user.setPasswordHash(challenge.getPasswordHash());
        User saved = userRepository.saveAndFlush(user);
        otpRepository.delete(challenge);
        return new RegisterResponse("Đăng ký thành công.", new RegisterResponse.UserData(
                saved.getUserId(), saved.getUsername(), saved.getEmail(), saved.getFullName(), saved.getRole()));
    }

    @Transactional
    public void requestPasswordReset(String email) {
        String normalizedEmail = email.strip().toLowerCase();
        Optional<User> account = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (account.isEmpty())
            return;
        String code = newOtp();
        AuthOtpChallenge challenge = otpRepository
                .findByEmailAndPurpose(normalizedEmail, "PASSWORD_RESET")
                .orElseGet(AuthOtpChallenge::new);
        challenge.setEmail(normalizedEmail);
        challenge.setPurpose("PASSWORD_RESET");
        challenge.setOtpHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        challenge.setAttempts(0);
        challenge.setVerified(false);
        otpRepository.save(challenge);
        sendOtp(normalizedEmail, code, "Mã OTP đặt lại mật khẩu ChayBook");
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public String verifyPasswordReset(VerifyPasswordResetRequest request) {
        String email = request.email().strip().toLowerCase();
        AuthOtpChallenge challenge = getValidChallenge(email, "PASSWORD_RESET", request.code());
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String resetToken = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tokenBytes);
        challenge.setOtpHash(passwordEncoder.encode(resetToken));
        challenge.setVerified(true);
        challenge.setAttempts(0);
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpRepository.save(challenge);
        return resetToken;
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void resetPassword(ResetPasswordRequest request) {
        if (request.newPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu không được vượt quá 72 byte.");
        }
        String email = request.email().strip().toLowerCase();
        AuthOtpChallenge challenge = otpRepository.findByEmailAndPurpose(email, "PASSWORD_RESET")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
        if (!challenge.isVerified()
                || challenge.getExpiresAt().isBefore(LocalDateTime.now())
                || !passwordEncoder.matches(request.resetToken(), challenge.getOtpHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
        User user = userRepository.findByEmailIgnoreCase(challenge.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Yêu cầu đặt lại mật khẩu không hợp lệ."));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        otpRepository.delete(challenge);
    }

    private AuthOtpChallenge getValidChallenge(String email, String purpose, String code) {
        AuthOtpChallenge challenge = otpRepository.findByEmailAndPurpose(email, purpose)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Mã OTP không hợp lệ hoặc đã hết hạn."));
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(challenge);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        if (challenge.getAttempts() >= 5) {
            otpRepository.delete(challenge);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        if (!passwordEncoder.matches(code, challenge.getOtpHash())) {
            if (challenge.getAttempts() + 1 >= 5) {
                otpRepository.delete(challenge);
            } else {
                challenge.setAttempts(challenge.getAttempts() + 1);
                otpRepository.save(challenge);
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        return challenge;
    }

    private String newOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private void sendOtp(String email, String code, String subject) {
        if (brevoApiKey.isBlank() || brevoSenderEmail.isBlank()) {
            System.err.println("========== BREVO CONFIG MISSING ==========");
            System.err.println("BREVO_API_KEY blank: " + brevoApiKey.isBlank());
            System.err.println("BREVO_SENDER_EMAIL blank: " + brevoSenderEmail.isBlank());
            System.err.println("==========================================");
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ gửi email OTP chưa được cấu hình đầy đủ.");
        }

        Map<String, Object> payload = Map.of(
                "sender", Map.of(
                        "name", brevoSenderName,
                        "email", brevoSenderEmail
                ),
                "to", List.of(Map.of("email", email.strip())),
                "subject", subject,
                "htmlContent",
                "<div style='font-family: Arial, sans-serif; line-height: 1.6; color: #181c1b;'>"
                        + "<h2 style='color: #006b2c;'>ChayBook</h2>"
                        + "<p>Mã OTP của bạn là:</p>"
                        + "<h1 style='letter-spacing: 4px; color: #006b2c;'>" + code + "</h1>"
                        + "<p>Mã có hiệu lực trong <strong>10 phút</strong> và chỉ sử dụng một lần.</p>"
                        + "</div>"
        );

        try {
            restClient.post()
                    .uri(BREVO_SEND_EMAIL_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("api-key", brevoApiKey)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            System.out.println("========== BREVO SUCCESS ==========");
            System.out.println("OTP email sent successfully to: " + email);
            System.out.println("===================================");

        } catch (RestClientResponseException e) {
            System.err.println("========== BREVO FAILED ==========");
            System.err.println("Status: " + e.getStatusCode());
            System.err.println("Response Body: " + e.getResponseBodyAsString());
            e.printStackTrace();
            System.err.println("==================================");

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không thể gửi email OTP. Vui lòng thử lại sau.",
                    e);
        } catch (Exception e) {
            System.err.println("========== BREVO FAILED ==========");
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("==================================");

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không thể gửi email OTP. Vui lòng thử lại sau.",
                    e);
        }
    }

    public MeResponse getCurrentUser(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in.");
        }

        Integer userId;
        try {
            userId = Integer.valueOf(jwtAuthentication.getToken().getSubject());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authentication.");
        }

        if (userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authentication.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Please log in again."));

        requireActive(user);

        return new MeResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRole());
    }

    private void requireActive(User user) {
        if (user.getStatusValue() != com.chaybook.backend.user.enums.UserStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active.");
        }
    }
}

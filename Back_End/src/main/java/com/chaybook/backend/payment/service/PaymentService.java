package com.chaybook.backend.payment.service;

import com.chaybook.backend.payment.dto.*;
import com.chaybook.backend.payment.entity.UserDailyUsage;
import com.chaybook.backend.payment.entity.UserPayment;
import com.chaybook.backend.payment.repository.UserDailyUsageRepository;
import com.chaybook.backend.payment.repository.UserPaymentRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final UserPaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final UserDailyUsageRepository dailyUsageRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${payos.client-id:}")
    private String payosClientId;

    @Value("${payos.api-key:}")
    private String payosApiKey;

    @Value("${payos.checksum-key:}")
    private String payosChecksumKey;

    @Value("${payos.return-url:http://localhost:5173/payment/success}")
    private String returnUrl;

    @Value("${payos.cancel-url:http://localhost:5173/payment/cancel}")
    private String cancelUrl;

    @Value("${payos.pro-monthly-price:2000}")
    private int proMonthlyPrice;

    public PaymentService(
            UserPaymentRepository paymentRepository,
            UserRepository userRepository,
            UserDailyUsageRepository dailyUsageRepository) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.dailyUsageRepository = dailyUsageRepository;
    }

    @Transactional
    public CreatePaymentResponse createPaymentLink(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        // 1. Đối soát các giao dịch PENDING trước đó xem người dùng đã từng chuyển khoản chưa
        Optional<UserPayment> paidEarlier = reconcilePendingPayments(userId);
        if (paidEarlier.isPresent()) {
            UserPayment paidPayment = paidEarlier.get();
            return new CreatePaymentResponse(
                    paidPayment.getOrderCode(),
                    paidPayment.getAmount(),
                    paidPayment.getCheckoutUrl(),
                    paidPayment.getQrCode(),
                    "PAID",
                    false);
        }

        // 2. Nếu đã có 1 giao dịch PENDING trong vòng 15 phút vừa qua, tái sử dụng để giữ nguyên mã QR,
        // tránh trường hợp bấm nhiều lần sinh ra nhiều mã QR khác nhau gây nhầm lẫn
        LocalDateTime recentWindow = LocalDateTime.now().minusMinutes(15);
        List<UserPayment> recentPendingList = paymentRepository
                .findByUserUserIdAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(userId, "PENDING", recentWindow);
        if (!recentPendingList.isEmpty()) {
            UserPayment existing = recentPendingList.get(0);
            log.info("Tái sử dụng đơn hàng PENDING gần nhất #{} cho user {} (giữ nguyên mã QR, tránh sinh mã mới)",
                    existing.getOrderCode(), userId);
            return new CreatePaymentResponse(
                    existing.getOrderCode(),
                    existing.getAmount(),
                    existing.getCheckoutUrl(),
                    existing.getQrCode(),
                    "PENDING",
                    !hasPayosConfig());
        }

        // Sinh mã orderCode duy nhất (số nguyên dương ngẫu nhiên 6-8 chữ số)
        long orderCode = generateUniqueOrderCode();
        int amount = proMonthlyPrice;
        String description = "ChayBook Pro 30d";

        String checkoutUrlResult = null;
        String qrCodeResult = null;
        String paymentLinkIdResult = null;
        boolean isMock = true;

        // Nếu đã cấu hình PayOS credentials, gọi API chính thức của PayOS
        if (hasPayosConfig()) {
            try {
                String signatureData = "amount=" + amount
                        + "&cancelUrl=" + cancelUrl
                        + "&description=" + description
                        + "&orderCode=" + orderCode
                        + "&returnUrl=" + returnUrl;

                String signature = hmacSha256(payosChecksumKey, signatureData);

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("orderCode", orderCode);
                requestBody.put("amount", amount);
                requestBody.put("description", description);
                requestBody.put("cancelUrl", cancelUrl);
                requestBody.put("returnUrl", returnUrl);
                requestBody.put("signature", signature);
                if (user.getFullName() != null) {
                    requestBody.put("buyerName", user.getFullName());
                }
                if (user.getEmail() != null) {
                    requestBody.put("buyerEmail", user.getEmail());
                }

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("x-client-id", payosClientId);
                headers.set("x-api-key", payosApiKey);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                ResponseEntity<String> response = restTemplate.exchange(
                        "https://api-merchant.payos.vn/v2/payment-requests",
                        HttpMethod.POST,
                        entity,
                        String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    if ("00".equals(root.path("code").asText())) {
                        JsonNode data = root.path("data");
                        checkoutUrlResult = data.path("checkoutUrl").asText(null);
                        paymentLinkIdResult = data.path("paymentLinkId").asText(null);

                        String bin = data.path("bin").asText("");
                        String accountNumber = data.path("accountNumber").asText("");
                        String accountName = data.path("accountName").asText("");
                        String rawQr = data.path("qrCode").asText(null);

                        // Ưu tiên tạo ảnh VietQR chính thức từ thông tin ngân hàng đã liên kết trên
                        // PayOS
                        if (!bin.isBlank() && !accountNumber.isBlank()) {
                            String memoEncoded = URLEncoder.encode(description, StandardCharsets.UTF_8);
                            String accNameEncoded = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
                            qrCodeResult = "https://img.vietqr.io/image/" + bin + "-" + accountNumber
                                    + "-compact2.png?amount="
                                    + amount + "&addInfo=" + memoEncoded + "&accountName=" + accNameEncoded;
                        } else if (rawQr != null && !rawQr.isBlank()) {
                            // Nếu không có bin/accountNumber thì tạo ảnh QR từ chuỗi EMVCo của PayOS
                            qrCodeResult = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="
                                    + URLEncoder.encode(rawQr, StandardCharsets.UTF_8);
                        }

                        isMock = false;
                        log.info(
                                "PayOS payment link created successfully! Bank BIN: {}, Account: {}, Name: {}, OrderCode: {}",
                                bin, accountNumber, accountName, orderCode);
                    } else {
                        log.warn("PayOS returned non-zero code: {} - {}", root.path("code").asText(),
                                root.path("desc").asText());
                    }
                }
            } catch (Exception e) {
                log.error("Lỗi khi gọi PayOS API, chuyển sang chế độ dự phòng VietQR Demo: {}", e.getMessage());
            }
        }

        // Nếu PayOS chưa cấu hình hoặc lỗi kết nối, tạo VietQR tự động để trải nghiệm
        // mượt mà
        if (checkoutUrlResult == null) {
            String memoEncoded = URLEncoder.encode("ChayBook Pro " + orderCode, StandardCharsets.UTF_8);
            qrCodeResult = "https://img.vietqr.io/image/970422-0000000000-compact2.png?amount="
                    + amount + "&addInfo=" + memoEncoded + "&accountName=CHAYBOOK%20PRO";
            checkoutUrlResult = returnUrl + "?orderCode=" + orderCode;
            isMock = true;
        }

        UserPayment payment = new UserPayment();
        payment.setUser(user);
        payment.setOrderCode(orderCode);
        payment.setAmount(amount);
        payment.setPlanType("PRO_MONTHLY");
        payment.setDurationDays(30);
        payment.setStatus("PENDING");
        payment.setCheckoutUrl(checkoutUrlResult);
        payment.setQrCode(qrCodeResult);
        payment.setPaymentLinkId(paymentLinkIdResult);

        paymentRepository.save(payment);

        return new CreatePaymentResponse(
                orderCode,
                amount,
                checkoutUrlResult,
                qrCodeResult,
                "PENDING",
                isMock);
    }

    @Transactional
    public PaymentStatusResponse checkPaymentStatus(Integer userId, Long orderCode) {
        UserPayment payment = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch"));

        if (!payment.getUser().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem đơn hàng này");
        }

        if ("PAID".equalsIgnoreCase(payment.getStatus())) {
            return new PaymentStatusResponse(
                    orderCode,
                    "PAID",
                    payment.getUser().isPro(),
                    payment.getUser().getProExpiresAt(),
                    "Giao dịch đã được thanh toán thành công!");
        }

        // 1. Kiểm tra đơn hàng hiện tại với PayOS (1 request duy nhất mỗi lần polling)
        String payosStatus = queryPayosStatus(orderCode);
        if ("PAID".equalsIgnoreCase(payosStatus)) {
            activateProSubscription(payment);
            return new PaymentStatusResponse(
                    orderCode,
                    "PAID",
                    payment.getUser().isPro(),
                    payment.getUser().getProExpiresAt(),
                    "Thanh toán PayOS thành công! Tài khoản đã được nâng cấp Pro.");
        } else if ("CANCELLED".equalsIgnoreCase(payosStatus) || "EXPIRED".equalsIgnoreCase(payosStatus)) {
            payment.setStatus(payosStatus.toUpperCase());
            paymentRepository.save(payment);
        }

        return new PaymentStatusResponse(
                orderCode,
                payment.getStatus(),
                payment.getUser().isPro(),
                payment.getUser().getProExpiresAt(),
                "Đang chờ thanh toán...");
    }

    @Transactional
    public boolean handleWebhook(PayosWebhookRequest request) {
        if (request == null || request.data() == null) {
            log.warn("Webhook request body is empty");
            return false;
        }

        // Kiểm tra chữ ký webhook nếu đã cấu hình checksum key
        if (hasPayosConfig() && request.signature() != null) {
            var d = request.data();
            String sortedData = "amount=" + d.amount()
                    + "&code=" + (d.code() != null ? d.code() : "")
                    + "&desc=" + (d.desc() != null ? d.desc() : "")
                    + "&orderCode=" + d.orderCode()
                    + "&paymentLinkId=" + (d.paymentLinkId() != null ? d.paymentLinkId() : "")
                    + "&reference=" + (d.reference() != null ? d.reference() : "")
                    + "&transactionDateTime=" + (d.transactionDateTime() != null ? d.transactionDateTime() : "");

            String expectedSig = hmacSha256(payosChecksumKey, sortedData);
            if (!expectedSig.equalsIgnoreCase(request.signature())) {
                log.warn("PayOS webhook signature mismatch! Expected: {}, Received: {}", expectedSig,
                        request.signature());
                return false;
            }
        }

        if ("00".equals(request.code()) && request.data().orderCode() != null) {
            Optional<UserPayment> paymentOpt = paymentRepository.findByOrderCode(request.data().orderCode());
            if (paymentOpt.isPresent()) {
                UserPayment payment = paymentOpt.get();
                if (!"PAID".equalsIgnoreCase(payment.getStatus())) {
                    activateProSubscription(payment);
                    log.info("PayOS Webhook activated Pro subscription for orderCode: {}", payment.getOrderCode());
                }
                return true;
            }
        }

        return false;
    }

    @Transactional
    public UserSubscriptionResponse getMySubscription(Integer userId) {
        // Tự động đối soát các giao dịch cũ để nâng cấp ngay nếu người dùng đã chuyển khoản trên PayOS
        reconcilePendingPayments(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        boolean isPro = user.isPro();
        LocalDateTime proExpiresAt = user.getProExpiresAt();
        Long daysRemaining = null;

        if (isPro && proExpiresAt != null) {
            daysRemaining = Math.max(0, Duration.between(LocalDateTime.now(), proExpiresAt).toDays());
        }

        Integer dailyChatbotRemaining;
        if (isPro || "ADMIN".equalsIgnoreCase(user.getRole())) {
            dailyChatbotRemaining = -1; // -1 đại diện cho không giới hạn
        } else {
            LocalDate today = LocalDate.now();
            int todayCount = dailyUsageRepository.findByUserUserIdAndUsageDate(userId, today)
                    .map(UserDailyUsage::getChatbotCount)
                    .orElse(0);
            dailyChatbotRemaining = Math.max(0, 5 - todayCount);
        }

        List<UserPayment> payments = paymentRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
        List<UserSubscriptionResponse.PaymentHistoryItem> history = payments.stream()
                .map(p -> new UserSubscriptionResponse.PaymentHistoryItem(
                        p.getPaymentId(),
                        p.getOrderCode(),
                        p.getAmount(),
                        p.getPlanType(),
                        p.getDurationDays(),
                        p.getStatus(),
                        p.getCreatedAt(),
                        p.getPaidAt()))
                .toList();

        return new UserSubscriptionResponse(
                isPro,
                user.getRole(),
                proExpiresAt,
                daysRemaining,
                dailyChatbotRemaining,
                history);
    }

    @Transactional
    public Optional<UserPayment> reconcilePendingPayments(Integer userId) {
        if (!hasPayosConfig()) {
            return Optional.empty();
        }

        // Lấy danh sách giao dịch PENDING của người dùng
        List<UserPayment> pendingList = paymentRepository
                .findByUserUserIdAndStatusOrderByCreatedAtDesc(userId, "PENDING");

        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);
        int checkedCount = 0;

        for (UserPayment payment : pendingList) {
            // Đơn hàng quá 15 phút thì PayOS đã hết hạn, tự động chuyển thành EXPIRED trong DB để không quét lại
            if (payment.getCreatedAt() != null && payment.getCreatedAt().isBefore(fifteenMinutesAgo)) {
                payment.setStatus("EXPIRED");
                paymentRepository.save(payment);
                continue;
            }

            // Chỉ tra cứu tối đa 2 đơn mới nhất để tránh spam và tránh 429 Too Many Requests
            if (checkedCount >= 2) {
                break;
            }
            checkedCount++;

            String payosStatus = queryPayosStatus(payment.getOrderCode());
            if ("PAID".equalsIgnoreCase(payosStatus)) {
                activateProSubscription(payment);
                log.info("Tự động kích hoạt Pro sau khi đối soát thành công đơn hàng PayOS: {}", payment.getOrderCode());
                return Optional.of(payment);
            } else if ("CANCELLED".equalsIgnoreCase(payosStatus) || "EXPIRED".equalsIgnoreCase(payosStatus)) {
                payment.setStatus(payosStatus.toUpperCase());
                paymentRepository.save(payment);
            } else if ("RATE_LIMITED".equalsIgnoreCase(payosStatus)) {
                // Nếu PayOS đang trả về 429 thì dừng lại ngay để tránh bị khóa tần suất
                break;
            }
        }
        return Optional.empty();
    }

    private String queryPayosStatus(Long orderCode) {
        if (!hasPayosConfig()) {
            return null;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", payosClientId);
            headers.set("x-api-key", payosApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api-merchant.payos.vn/v2/payment-requests/" + orderCode,
                    HttpMethod.GET,
                    entity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if ("00".equals(root.path("code").asText())) {
                    return root.path("data").path("status").asText(null);
                }
            }
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
            log.warn("PayOS đang tạm giới hạn tần suất gọi API (429 Too Many Requests). Hệ thống sẽ đợi lượt sau.");
            return "RATE_LIMITED";
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                log.warn("PayOS đang tạm giới hạn tần suất gọi API (429 Too Many Requests).");
                return "RATE_LIMITED";
            }
            log.warn("Lỗi khi tra cứu trạng thái đơn hàng {} từ PayOS: {}", orderCode, e.getMessage());
        }
        return null;
    }

    private void activateProSubscription(UserPayment payment) {
        payment.setStatus("PAID");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        User user = payment.getUser();
        LocalDateTime currentExpiry = user.getProExpiresAt();
        LocalDateTime newExpiry;

        if (currentExpiry != null && currentExpiry.isAfter(LocalDateTime.now())) {
            newExpiry = currentExpiry.plusDays(payment.getDurationDays());
        } else {
            newExpiry = LocalDateTime.now().plusDays(payment.getDurationDays());
        }

        user.setProExpiresAt(newExpiry);
        userRepository.save(user);
    }

    private boolean hasPayosConfig() {
        return payosClientId != null && !payosClientId.isBlank()
                && payosApiKey != null && !payosApiKey.isBlank()
                && payosChecksumKey != null && !payosChecksumKey.isBlank();
    }

    private long generateUniqueOrderCode() {
        Random random = new Random();
        for (int i = 0; i < 10; i++) {
            // Tạo số 6 chữ số ngẫu nhiên từ 100000 đến 999999
            long code = 100000L + random.nextInt(900000);
            if (paymentRepository.findByOrderCode(code).isEmpty()) {
                return code;
            }
        }
        return System.currentTimeMillis() % 100000000L;
    }

    private String hmacSha256(String key, String data) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] signedBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : signedBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi sinh chữ ký HMAC-SHA256: " + e.getMessage(), e);
        }
    }
}

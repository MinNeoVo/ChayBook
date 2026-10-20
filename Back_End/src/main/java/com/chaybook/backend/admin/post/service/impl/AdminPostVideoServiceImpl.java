package com.chaybook.backend.admin.post.service.impl;

import com.chaybook.backend.admin.post.dto.AdminPostVideoResponse;
import com.chaybook.backend.admin.post.repository.AdminPostVideoRepository;
import com.chaybook.backend.admin.post.service.AdminPostVideoService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class AdminPostVideoServiceImpl implements AdminPostVideoService {

    private static final Set<String> CONTENT_TYPES = Set.of("POST", "VIDEO");
    private static final Set<String> STATUSES =
            Set.of("PENDING", "APPROVED", "REJECTED", "ALL");

    private final AdminPostVideoRepository repository;
    private final UserRepository userRepository;

    public AdminPostVideoServiceImpl(
            AdminPostVideoRepository repository,
            UserRepository userRepository
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Override
    public AdminPostVideoResponse.Page getSubmissions(
            Integer adminId,
            String type,
            String status,
            String keyword,
            int page,
            int size
    ) {
        requireActiveAdmin(adminId);

        if (page < 0 || size < 1 || size > 100 || (long) page * size > Integer.MAX_VALUE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "page phải từ 0 trở lên; size phải từ 1 đến 100"
            );
        }

        String normalizedType = normalize(type, "ALL");
        String normalizedStatus = normalize(status, "ALL");

        if (!"ALL".equals(normalizedType)
                && !CONTENT_TYPES.contains(normalizedType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "type chỉ nhận ALL, POST hoặc VIDEO"
            );
        }

        if (!STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "status không hợp lệ"
            );
        }

        return repository.search(
                normalizedType,
                normalizedStatus,
                keyword,
                page,
                size
        );
    }

    @Override
    public AdminPostVideoResponse.Statistics getStatistics(Integer adminId) {
        requireActiveAdmin(adminId);
        return repository.getStatistics();
    }

    @Override
    public AdminPostVideoResponse getDetail(Integer adminId, String type, Integer contentId) {
        requireActiveAdmin(adminId);
        String normalizedType = normalize(type, "");
        if (!CONTENT_TYPES.contains(normalizedType) || contentId == null || contentId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid content type or ID");
        }
        AdminPostVideoResponse result = repository.findDetail(normalizedType, contentId);
        if (result == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found");
        return result;
    }

    @Override
    @Transactional
    public void updateStatus(
            Integer adminId,
            String type,
            Integer contentId,
            String requestedStatus,
            String requestedReason
    ) {
        User admin = requireActiveAdmin(adminId);

        String normalizedType = normalize(type, "");
        String nextStatus = normalize(requestedStatus, "");

        String reason = requestedReason == null
                ? null
                : requestedReason.strip();

        if ("REJECTED".equals(nextStatus)
                && (reason == null || reason.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cần nhập lý do khi từ chối nội dung"
            );
        }

        if (!CONTENT_TYPES.contains(normalizedType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "type phải là POST hoặc VIDEO"
            );
        }

        if (contentId == null || contentId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "contentId phải lớn hơn 0"
            );
        }

        if (!Set.of("APPROVED", "REJECTED", "REMOVED").contains(nextStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "status chỉ nhận APPROVED, REJECTED hoặc REMOVED"
            );
        }

        String currentStatus = repository.findStatus(normalizedType, contentId);
        if (currentStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy nội dung"
            );
        }

        currentStatus = currentStatus.toUpperCase(Locale.ROOT);

        Map<String, Set<String>> allowedTransitions = Map.of(
                "PENDING", Set.of("APPROVED", "REJECTED"),
                "APPROVED", Set.of("REJECTED", "REMOVED"),
                "REJECTED", Set.of("APPROVED")
        );

        if (!allowedTransitions
                .getOrDefault(currentStatus, Set.of())
                .contains(nextStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể chuyển trạng thái từ "
                            + currentStatus + " sang " + nextStatus
            );
        }

        int updated = repository.updateStatus(
                normalizedType,
                contentId,
                currentStatus,
                nextStatus
        );

        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Trạng thái nội dung vừa được thay đổi; hãy tải lại danh sách"
            );
        }

        repository.insertDecision(
                normalizedType,
                contentId,
                admin.getUserId(),
                currentStatus,
                nextStatus,
                reason
        );

        repository.markLatestModerationReviewed(
                normalizedType,
                contentId,
                admin.getUserId()
        );
    }

    private User requireActiveAdmin(Integer adminId) {
        if (adminId == null || adminId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Vui lòng đăng nhập"
            );
        }

        User user = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Tài khoản không còn tồn tại"
                ));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())
                || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ Admin ACTIVE được thực hiện thao tác này"
            );
        }

        return user;
    }

    private String normalize(String value, String defaultValue) {
        return value == null || value.isBlank()
                ? defaultValue
                : value.strip().toUpperCase(Locale.ROOT);
    }
}

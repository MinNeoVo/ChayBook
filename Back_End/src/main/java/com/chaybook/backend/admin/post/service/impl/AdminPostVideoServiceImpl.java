package com.chaybook.backend.admin.post.service.impl;

import com.chaybook.backend.admin.post.dto.AdminPostVideoResponse;
import com.chaybook.backend.admin.post.enums.AdminContentStatus;
import com.chaybook.backend.admin.post.repository.AdminPostVideoRepository;
import com.chaybook.backend.admin.post.service.AdminPostVideoService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.enums.UserStatus;
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
        String normalizedStatus = status == null || status.isBlank()
                || "ALL".equalsIgnoreCase(status.strip())
                ? null
                : normalize(status, "");

        if (!"ALL".equals(normalizedType)
                && !CONTENT_TYPES.contains(normalizedType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "type chỉ nhận ALL, POST hoặc VIDEO"
            );
        }

        if (normalizedStatus != null) {
            try {
                AdminContentStatus.valueOf(normalizedStatus);
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "status chỉ nhận PENDING, APPROVED, REJECTED"
                );
            }
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
        AdminContentStatus nextStatus;
        try {
            nextStatus = AdminContentStatus.valueOf(
                    normalize(requestedStatus, "")
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "status chỉ nhận APPROVED, REJECTED hoặc REMOVED"
            );
        }

        String reason = requestedReason == null
                ? null
                : requestedReason.strip();

        if (nextStatus == AdminContentStatus.REJECTED
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

        if (nextStatus == AdminContentStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể chuyển trạng thái nội dung sang PENDING"
            );
        }

        String currentStatusValue = repository.findStatus(
                normalizedType,
                contentId
        );

        if (currentStatusValue == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy nội dung"
            );
        }

        AdminContentStatus currentStatus;
        try {
            currentStatus = AdminContentStatus.valueOf(
                    currentStatusValue.toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không hợp lệ"
            );
        }

        Map<AdminContentStatus, Set<AdminContentStatus>> allowedTransitions = Map.of(
                AdminContentStatus.PENDING,
                Set.of(AdminContentStatus.APPROVED, AdminContentStatus.REJECTED),

                AdminContentStatus.APPROVED,
                Set.of(AdminContentStatus.REJECTED, AdminContentStatus.REMOVED),

                AdminContentStatus.REJECTED,
                Set.of(AdminContentStatus.APPROVED)
        );

        if (!allowedTransitions
                .getOrDefault(currentStatus, Set.of())
                .contains(nextStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể chuyển trạng thái từ "
                            + currentStatus.name() + " sang " + nextStatus.name()
            );
        }

        int updated = repository.updateStatus(
                normalizedType,
                contentId,
                currentStatus.name(),
                nextStatus.name()
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
                currentStatus.name(),
                nextStatus.name(),
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

        if (!UserStatus.ACTIVE.name().equalsIgnoreCase(user.getStatus())
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

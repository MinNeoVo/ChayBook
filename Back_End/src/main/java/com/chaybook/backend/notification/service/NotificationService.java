package com.chaybook.backend.notification.service;

import com.chaybook.backend.notification.dto.NotificationItemResponse;
import com.chaybook.backend.notification.dto.NotificationListResponse;
import com.chaybook.backend.notification.repository.NotificationRepository;
import com.chaybook.backend.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final int DEFAULT_LIMIT = 30;

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public NotificationListResponse getNotifications(Integer userId) {
        notificationRepository.syncNotificationsForUser(userId);
        List<NotificationItemResponse> items =
                notificationRepository.findByRecipientUserId(userId, DEFAULT_LIMIT);
        long unreadCount =
                notificationRepository.countUnreadByRecipientUserId(userId);
        return new NotificationListResponse(unreadCount, items);
    }

    @Transactional
    public void markAsRead(Integer userId, Integer notificationId) {
        notificationRepository.markAsRead(notificationId, userId);
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void notifyAdminsNewPost(User author, Integer postId, String postTitle) {
        try {
            List<Integer> adminIds = notificationRepository.findActiveAdminUserIds();
            if (adminIds.isEmpty()) {
                return;
            }

            String authorName = (author.getFullName() != null && !author.getFullName().isBlank())
                    ? author.getFullName().strip()
                    : author.getUsername();

            String title = "Bài viết mới chờ duyệt";
            String message = "Người dùng " + authorName + " vừa tạo bài viết \"" + postTitle + "\" đang chờ phê duyệt.";
            String targetUrl = "/admin/posts-videos";

            for (Integer adminId : adminIds) {
                notificationRepository.insertNotificationIfAbsent(
                        adminId,
                        author.getUserId(),
                        postId,
                        "NEW_POST_PENDING",
                        title,
                        message,
                        targetUrl
                );
            }
        } catch (Exception exception) {
            log.warn("Không thể tạo thông báo bài viết mới cho Admin (postId={}): {}", postId, exception.getMessage());
        }
    }

    @Transactional
    public void notifyAuthorPostDecision(
            Integer postId,
            Integer adminId,
            String decision,
            String reason
    ) {
        try {
            NotificationRepository.PostOwnerInfo ownerInfo =
                    notificationRepository.findPostOwnerInfo(postId);
            if (ownerInfo == null || ownerInfo.userId() == null) {
                return;
            }

            String postTitle = (ownerInfo.title() == null || ownerInfo.title().isBlank())
                    ? ("#" + postId)
                    : ownerInfo.title().strip();

            if ("APPROVED".equalsIgnoreCase(decision)) {
                notificationRepository.insertNotificationIfAbsent(
                        ownerInfo.userId(),
                        adminId,
                        postId,
                        "POST_APPROVED",
                        "Bài viết đã được duyệt",
                        "Bài viết \"" + postTitle + "\" của bạn đã được Admin phê duyệt và hiển thị trên Cộng đồng.",
                        "/community"
                );
            } else if ("REJECTED".equalsIgnoreCase(decision)) {
                String rejectDetail = (reason != null && !reason.isBlank())
                        ? (" Lý do: " + reason.strip())
                        : "";
                notificationRepository.insertNotificationIfAbsent(
                        ownerInfo.userId(),
                        adminId,
                        postId,
                        "POST_REJECTED",
                        "Bài viết chưa được duyệt",
                        "Bài viết \"" + postTitle + "\" của bạn chưa được duyệt." + rejectDetail,
                        "/profile"
                );
            }
        } catch (Exception exception) {
            log.warn("Không thể tạo thông báo duyệt bài cho người dùng (postId={}): {}", postId, exception.getMessage());
        }
    }
}

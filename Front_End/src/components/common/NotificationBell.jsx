import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FilePlus2,
} from "lucide-react";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationServices";

const POLL_INTERVAL_MS = 15000;

function formatRelativeTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (diffSeconds < 60) return "Vừa xong";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case "POST_APPROVED":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#92f5a4]/60 text-chaybook-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      );
    case "POST_REJECTED":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <CircleAlert className="h-5 w-5" />
        </div>
      );
    case "NEW_POST_PENDING":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <FilePlus2 className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chaybook-container text-chaybook-primary">
          <Clock3 className="h-5 w-5" />
        </div>
      );
  }
}

function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async ({ signal, showLoader = false } = {}) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      const data = await getNotifications({ signal });
      if (signal?.aborted) return;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(
        typeof data?.unreadCount === "number" ? data.unreadCount : 0
      );
    } catch (error) {
      if (!signal?.aborted) {
        console.error("Không tải được thông báo:", error);
      }
    } finally {
      if (!signal?.aborted && showLoader) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getNotifications({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setUnreadCount(
          typeof data?.unreadCount === "number" ? data.unreadCount : 0
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Không tải được thông báo:", error);
        }
      });

    const intervalId = window.setInterval(() => {
      getNotifications({ signal: controller.signal })
        .then((data) => {
          if (controller.signal.aborted) return;
          setItems(Array.isArray(data?.items) ? data.items : []);
          setUnreadCount(
            typeof data?.unreadCount === "number" ? data.unreadCount : 0
          );
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleDropdown = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications({ showLoader: items.length === 0 });
    }
  };

  const handleSelectNotification = async (item) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.notificationId === item.notificationId
            ? { ...entry, isRead: true }
            : entry
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await markNotificationAsRead(item.notificationId);
      } catch (error) {
        console.error("Không thể đánh dấu thông báo đã đọc:", error);
      }
    }

    setIsOpen(false);

    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;

    setIsMarkingAll(true);
    setItems((prev) => prev.map((entry) => ({ ...entry, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Không thể đánh dấu đã đọc tất cả:", error);
      fetchNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggleDropdown}
        aria-label="Thông báo"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-2xs transition-colors hover:border-chaybook-primary/40 hover:bg-chaybook-container hover:text-chaybook-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          className="fixed inset-x-3 top-[4.25rem] z-50 max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#181c1b]">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#92f5a4] px-2 py-0.5 text-[11px] font-bold text-[#007233]">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-chaybook-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Notification Items */}
          <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto overscroll-contain">
            {isLoading && items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-500">
                Đang tải thông báo...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-chaybook-container text-gray-400">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Chưa có thông báo nào
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Các cập nhật về bài viết sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.notificationId}
                  type="button"
                  onClick={() => handleSelectNotification(item)}
                  className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                    item.isRead
                      ? "bg-white hover:bg-gray-50"
                      : "bg-[#92f5a4]/15 hover:bg-[#92f5a4]/25"
                  }`}
                >
                  {getNotificationIcon(item.type)}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs ${
                          item.isRead
                            ? "font-semibold text-gray-800"
                            : "font-bold text-[#181c1b]"
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-chaybook-primary" />
                      )}
                    </div>

                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#3e4a3d]">
                      {item.message}
                    </p>

                    <span className="mt-1.5 block text-[11px] font-medium text-gray-400">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;


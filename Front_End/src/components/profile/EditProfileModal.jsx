import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  User,
  X,
  AlertCircle,
  FileImage,
} from "lucide-react";
import Button from "../common/Button";
import Avatar from "../common/Avatar";
import Input from "../common/Input";
import { updateProfile, uploadAvatar } from "../../services/userServices";
import { getCurrentUser } from "../../services/authServices";
import { useAuth } from "../../context/useAuth";

const API_ORIGIN = "http://localhost:8080";

/**
 * Chuẩn hóa avatar URL – nếu là relative path thì thêm origin.
 */
function resolveAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Modal chỉnh sửa thông tin cá nhân.
 *
 * Props:
 *   profile  – object profile hiện tại (userId, username, fullName, avatarUrl, …)
 *   onClose  – callback khi đóng modal
 *   onSaved  – callback(updatedUserData) sau khi lưu thành công
 */
function EditProfileModal({ profile, onClose, onSaved }) {
  /* ── form state ── */
  const [username, setUsername] = useState(profile?.username ?? "");
  const [fullName, setFullName] = useState(profile?.fullName ?? "");

  /* ── avatar state ── */
  const [avatarPreview, setAvatarPreview] = useState(
    resolveAvatarUrl(profile?.avatarUrl)
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  /* ── submit state ── */
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const { login } = useAuth();

  /* ── close on Escape ── */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Avatar – chọn file
  ═══════════════════════════════════════════════════════════ */
  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Ảnh không được vượt quá 5 MB.");
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  /* ═══════════════════════════════════════════════════════════
     Validate form
  ═══════════════════════════════════════════════════════════ */
  function validate() {
    const errors = {};
    const usernameRegex = /^[a-z0-9_.]{3,50}$/;
    if (!username.trim()) {
      errors.username = "Username không được để trống.";
    } else if (!usernameRegex.test(username.trim())) {
      errors.username =
        "Username phải 3–50 ký tự, chỉ chứa chữ thường, số, _ hoặc .";
    }
    if (!fullName.trim()) {
      errors.fullName = "Họ tên không được để trống.";
    } else if (fullName.trim().length > 255) {
      errors.fullName = "Họ tên tối đa 255 ký tự.";
    }
    return errors;
  }

  /* ═══════════════════════════════════════════════════════════
     Submit
  ═══════════════════════════════════════════════════════════ */
  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMsg(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      // avatarUrl hiện tại trong DB (có thể là relative path hoặc null)
      let newAvatarUrl = profile?.avatarUrl ?? null;

      // 1. Upload ảnh avatar nếu user chọn file mới
      if (avatarFile) {
        setAvatarUploading(true);
        try {
          const uploadRes = await uploadAvatar(avatarFile);
          // Server trả về relative path, ví dụ: "/uploads/avatars/xxx.jpg"
          // uploadAvatar endpoint đã tự cập nhật DB, lấy URL để dùng tiếp
          newAvatarUrl = uploadRes.avatarUrl;
        } catch (err) {
          setAvatarError(err.message ?? "Không thể upload ảnh avatar.");
          setSaving(false);
          setAvatarUploading(false);
          return;
        } finally {
          setAvatarUploading(false);
        }
      }

      // 2. Cập nhật profile (username, fullName, avatarUrl)
      // Backend UpdateProfileRequest đã chấp nhận cả relative path
      const payload = {
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        // Chỉ gửi avatarUrl nếu có giá trị (tránh null-out ảnh trong DB)
        avatarUrl: newAvatarUrl || undefined,
      };

      const res = await updateProfile(profile.userId, payload);

      // Fetch fresh user to update auth context
      let freshUser;
      try {
        freshUser = await getCurrentUser();
      } catch (err) {
        console.error("Failed to fetch current user after profile update:", err);
        // If we fail to fetch, we can still proceed with the res.user data
        freshUser = res?.user;
      }

      // Update auth context with fresh user data
      login(freshUser);

      setSuccessMsg("Cập nhật thông tin thành công!");
      setTimeout(() => {
        // Merge user data mới (username, fullName) với avatarUrl hiện tại
        onSaved?.({
          ...(res?.user ?? {}),
          username: payload.username,
          fullName: payload.fullName,
          avatarUrl: newAvatarUrl ?? profile?.avatarUrl,
        });
        onClose();
      }, 800);

    } catch (err) {
      if (err.status === 409) {
        setFieldErrors({ username: "Username này đã được sử dụng." });
      } else {
        setGlobalError(err.message ?? "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  }

  const isBusy = saving || avatarUploading;

  /* ═══════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !isBusy && onClose()}
    >
      <div
        className="
          relative w-full max-w-lg
          rounded-2xl bg-white shadow-2xl
          flex flex-col
          max-h-[90vh] overflow-y-auto
        "
        style={{ animation: "fadeSlideUp 0.25s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Chỉnh sửa trang cá nhân
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="
              flex items-center justify-center
              h-8 w-8 rounded-full
              text-gray-400 hover:text-gray-700
              hover:bg-gray-100
              transition-colors
              disabled:opacity-40
              cursor-pointer
            "
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-6">
            {/* ── Avatar picker ── */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-[#caead6] shadow-md">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Avatar size="xl" className="h-full w-full" />
                  )}
                </div>

                {/* Overlay on hover */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="
                    absolute inset-0 rounded-full
                    flex flex-col items-center justify-center gap-0.5
                    bg-black/50
                    opacity-0 group-hover:opacity-100
                    transition-opacity
                    cursor-pointer
                    disabled:cursor-not-allowed
                  "
                  title="Đổi ảnh đại diện"
                >
                  <Camera size={20} className="text-white" />
                  <span className="text-white text-[10px] font-semibold">
                    Thay đổi
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              {/* Upload hint */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  JPEG, PNG hoặc WebP · Tối đa 5 MB
                </p>
                {avatarFile && !avatarError && (
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-[#00873a] font-medium">
                    <FileImage size={12} />
                    {avatarFile.name}
                  </p>
                )}
              </div>

              {avatarError && (
                <p className="flex items-center gap-1.5 text-sm text-red-500">
                  <AlertCircle size={14} />
                  {avatarError}
                </p>
              )}
            </div>

            {/* ── Text fields ── */}
            <div className="space-y-4">
              <Input
                label="Username"
                id="edit-username"
                name="username"
                type="text"
                placeholder="vd: nguyen.van.a"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setFieldErrors((prev) => ({
                    ...prev,
                    username: undefined,
                  }));
                }}
                error={fieldErrors.username}
                disabled={isBusy}
                icon={User}
              />

              <Input
                label="Họ và tên"
                id="edit-fullname"
                name="fullName"
                type="text"
                placeholder="vd: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFieldErrors((prev) => ({
                    ...prev,
                    fullName: undefined,
                  }));
                }}
                error={fieldErrors.fullName}
                disabled={isBusy}
              />
            </div>

            {/* ── Email (read-only info) ── */}
            {profile?.email && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Email
                </p>
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                  {profile.email}
                  <span className="ml-2 text-xs text-gray-400">
                    (không thể thay đổi)
                  </span>
                </p>
              </div>
            )}

            {/* ── Global error / success ── */}
            {globalError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {globalError}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-[#e6f7ec] p-3 text-sm text-[#00873a] font-medium">
                <Check size={16} className="shrink-0" />
                {successMsg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isBusy}
              className="min-w-[90px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isBusy}
              className="min-w-[110px]"
            >
              {isBusy ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={15} className="animate-spin" />
                  {avatarUploading ? "Đang upload…" : "Đang lưu…"}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check size={15} />
                  Lưu thay đổi
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default EditProfileModal;

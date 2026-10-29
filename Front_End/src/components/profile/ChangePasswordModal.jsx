import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Mail, X } from "lucide-react";

import { useAuth } from "../../context/useAuth";
import Button from "../common/Button";
import Input from "../common/Input";
import { requestPasswordReset, verifyPasswordResetOtp } from "../../services/authServices";
import { changePassword } from "../../services/userServices";

function ChangePasswordModal({ profile, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [step, setStep] = useState("request");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const email = profile?.email;

  const sendOtp = async () => {
    if (!email || loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await requestPasswordReset(email);
      setOtp("");
      setStep("otp");
      setMessage(`Mã OTP đã được gửi đến ${email}. Mã có hiệu lực trong 10 phút.`);
    } catch (requestError) {
      setError(requestError.message || "Không thể gửi mã OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (loading || otp.length !== 6) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await verifyPasswordResetOtp(email, otp);
      if (!result?.resetToken) {
        throw new Error("Máy chủ không trả về mã xác minh OTP hợp lệ.");
      }
      setResetToken(result.resetToken);
      setStep("password");
    } catch (verifyError) {
      setError(verifyError.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("Mật khẩu mới phải có từ 8 đến 72 ký tự.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Mật khẩu mới không được vượt quá 72 byte UTF-8.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!currentPassword || currentPassword.length > 72) {
      setError("Vui lòng nhập mật khẩu hiện tại (tối đa 72 ký tự).");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(
        profile.userId,
        currentPassword,
        newPassword,
        email,
        resetToken,
      );
      try {
        await logout();
      } catch (logoutError) {
        console.error(
          "Mật khẩu đã đổi nhưng không thể gọi API đăng xuất:",
          logoutError,
        );
      }
      navigate("/login", {
        replace: true,
        state: { successMessage: "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại." },
      });
    } catch (changeError) {
      setError(changeError.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="change-password-title" className="text-xl font-bold text-gray-900">
              Đổi mật khẩu
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {step !== "password"
                ? `Xác minh mã OTP gửi đến ${email || "email tài khoản"}`
                : "Nhập mật khẩu hiện tại và mật khẩu mới."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Đóng"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        )}

        {step === "request" ? (
          <Button
            type="button"
            size="md"
            className="w-full gap-2"
            disabled={loading || !email}
            onClick={sendOtp}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </Button>
        ) : step === "otp" ? (
          <>
            <form className="space-y-4" onSubmit={verifyOtp}>
              <Input
                label="Mã OTP 6 chữ số"
                type="text"
                name="otp"
                placeholder="000000"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <Button type="submit" size="md" className="w-full gap-2" disabled={loading || otp.length !== 6}>
                {loading && <Loader2 size={17} className="animate-spin" />}
                {loading ? "Đang xác minh..." : "Xác minh OTP"}
              </Button>
            </form>
            <button
              type="button"
              disabled={loading}
              onClick={sendOtp}
              className="mt-4 w-full text-center text-sm font-medium text-chaybook-primary hover:underline disabled:opacity-50"
            >
              Gửi lại mã OTP
            </button>
          </>
        ) : (
          <form className="space-y-4" onSubmit={submitPassword}>
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              name="currentPassword"
              placeholder="Nhập mật khẩu hiện tại"
              icon={KeyRound}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              maxLength={72}
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              name="newPassword"
              placeholder="Từ 8 đến 72 ký tự"
              icon={KeyRound}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              maxLength={72}
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              icon={KeyRound}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              maxLength={72}
            />
            <Button type="submit" size="md" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}

export default ChangePasswordModal;

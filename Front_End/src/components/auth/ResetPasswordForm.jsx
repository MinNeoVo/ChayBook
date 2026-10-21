import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { resetPassword } from "../../services/authServices";
import Input from "../common/Input";
import Button from "../common/Button";

export default function ResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, resetToken } = location.state || {};
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !resetToken) navigate("/forgot-password", { replace: true });
  }, [email, resetToken, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email, resetToken, password);
      navigate("/login", { replace: true, state: { successMessage: "Đã cập nhật mật khẩu. Vui lòng đăng nhập." } });
    } catch (err) {
      setError(err.message || "Quyền đặt lại mật khẩu đã hết hạn. Vui lòng xác thực OTP lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetToken) return null;
  return <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
    <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Tạo mật khẩu mới</h1>
    <p className="mb-6 text-center text-sm text-gray-500">Đặt mật khẩu mới cho {email}.</p>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <form className="space-y-4" onSubmit={submit}>
      <Input label="Mật khẩu mới" type="password" name="password" placeholder="Ít nhất 8 ký tự" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input label="Xác nhận mật khẩu mới" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" icon={Lock} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      <Button type="submit" size="md" className="w-full" disabled={loading}>{loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-500"><Link to="/login" className="font-medium text-chaybook-primary hover:underline">Quay lại đăng nhập</Link></p>
  </div>;
}

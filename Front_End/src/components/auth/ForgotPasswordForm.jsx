import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "../../services/authServices";
import Input from "../common/Input";
import Button from "../common/Button";

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      navigate("/verify-reset-otp", { state: { email: email.trim() } });
    } catch (err) {
      setError(err.message || "Không thể yêu cầu đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
    <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Quên mật khẩu</h1>
    <p className="mb-6 text-center text-sm text-gray-500">Nhập email để nhận mã OTP.</p>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <form className="space-y-4" onSubmit={submit}>
      <Input label="Email" type="email" name="email" placeholder="Nhập email của bạn" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" size="md" className="w-full" disabled={loading || !email.trim()}>{loading ? "Đang gửi..." : "Gửi mã OTP"}</Button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-500"><Link to="/login" className="font-medium text-chaybook-primary hover:underline">Quay lại đăng nhập</Link></p>
  </div>;
}

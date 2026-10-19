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
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email, resetToken, password);
      navigate("/login", { replace: true, state: { successMessage: "Password updated. Please log in." } });
    } catch (err) {
      setError(err.message || "Reset authorization expired. Please verify your OTP again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetToken) return null;
  return <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
    <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Choose a new password</h1>
    <p className="mb-6 text-center text-sm text-gray-500">Set a new password for {email}.</p>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <form className="space-y-4" onSubmit={submit}>
      <Input label="New password" type="password" name="password" placeholder="At least 8 characters" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input label="Confirm new password" type="password" name="confirmPassword" placeholder="Re-enter your password" icon={Lock} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      <Button type="submit" size="md" className="w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-500"><Link to="/login" className="font-medium text-chaybook-primary hover:underline">Back to login</Link></p>
  </div>;
}

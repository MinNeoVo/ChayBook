import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { requestPasswordReset, resetPassword } from "../../services/authServices";
import Input from "../common/Input";
import Button from "../common/Button";

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitEmail = async (event) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      await requestPasswordReset(email.trim());
      setMessage("If an account exists for this email, an OTP has been sent. It expires in 10 minutes.");
      setStep("reset");
    } catch (err) { setError(err.message || "Could not request a password reset."); }
    finally { setLoading(false); }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      await resetPassword(email.trim(), code, password);
      navigate("/login", { replace: true, state: { successMessage: "Password updated. Please log in." } });
    } catch (err) { setError(err.message || "OTP verification failed or expired."); }
    finally { setLoading(false); }
  };

  return <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
    <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Reset password</h1>
    <p className="mb-6 text-center text-sm text-gray-500">Enter your email to receive a one-time password.</p>
    {message && <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    {step === "email" ? <form className="space-y-4" onSubmit={submitEmail}>
      <Input label="Email" type="email" name="email" placeholder="Enter your email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" size="md" className="w-full" disabled={loading || !email.trim()}>{loading ? "Sending..." : "Send OTP"}</Button>
    </form> : <form className="space-y-4" onSubmit={submitReset}>
      <Input label="6-digit OTP" type="text" name="otp" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
      <Input label="New password" type="password" name="password" placeholder="At least 8 characters" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input label="Confirm new password" type="password" name="confirmPassword" placeholder="Re-enter your password" icon={Lock} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      <Button type="submit" size="md" className="w-full" disabled={loading || code.length !== 6}>{loading ? "Updating..." : "Verify OTP and update password"}</Button>
    </form>}
    <p className="mt-6 text-center text-sm text-gray-500"><Link to="/login" className="font-medium text-chaybook-primary hover:underline">Back to login</Link></p>
  </div>;
}

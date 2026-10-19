import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyPasswordResetOtp } from "../../services/authServices";
import Input from "../common/Input";
import Button from "../common/Button";

export default function VerifyResetOtpForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyPasswordResetOtp(email, code);
      navigate("/reset-password", { replace: true, state: { email, resetToken: result.resetToken } });
    } catch (err) {
      setError(err.message || "OTP is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;
  return <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
    <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Verify OTP</h1>
    <p className="mb-6 text-center text-sm text-gray-500">Enter the 6-digit code sent to {email}. It expires in 10 minutes.</p>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    <form className="space-y-4" onSubmit={submit}>
      <Input label="6-digit OTP" type="text" name="otp" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
      <Button type="submit" size="md" className="w-full" disabled={loading || code.length !== 6}>{loading ? "Verifying..." : "Verify OTP"}</Button>
    </form>
    <p className="mt-6 text-center text-sm text-gray-500"><Link to="/forgot-password" className="font-medium text-chaybook-primary hover:underline">Back</Link></p>
  </div>;
}

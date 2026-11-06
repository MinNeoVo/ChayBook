import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";

import Button from "../common/Button";
import Input from "../common/Input";
import { useAuth } from "../../context/useAuth";
import {
  completeSocialRegistration,
  getPendingSocialRegistration,
  requestSocialRegistrationCode,
} from "../../services/socialAuthServices";
import {
  getSocialAuthErrorMessage,
  getSocialLoginDestination,
  getSocialProviderName,
} from "../../utils/socialAuth";

function SocialRegistrationForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [pending, setPending] = useState(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSentEmail, setCodeSentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPendingSocialRegistration()
      .then((data) => {
        if (cancelled) return;
        setPending(data);
        setEmail(data?.email || "");
      })
      .catch((loadError) => {
        if (!cancelled) setError(getSocialAuthErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const sendCode = async (event) => {
    event.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const normalizedEmail = email.trim();
      await requestSocialRegistrationCode(normalizedEmail);
      setCodeSentEmail(normalizedEmail);
      setCode("");
      setMessage(`Mã xác minh đã được gửi đến ${normalizedEmail}.`);
    } catch (requestError) {
      setError(getSocialAuthErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const completeRegistration = async (event) => {
    event.preventDefault();
    if (busy || code.length !== 6 || codeSentEmail !== email.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await completeSocialRegistration(email.trim(), code);
      if (!result?.user) throw new Error("SESSION_MISSING");
      login(result.user);
      navigate(getSocialLoginDestination(result.user), { replace: true });
    } catch (registrationError) {
      setError(getSocialAuthErrorMessage(registrationError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">Hoàn tất đăng ký</h1>
      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải thông tin xác thực...
        </div>
      ) : pending && (
        <p className="mb-6 text-center text-sm text-gray-500">
          Đã xác thực với {getSocialProviderName(pending.provider)}{pending.displayName ? ` (${pending.displayName})` : ""}.
          {" "}Vui lòng xác minh email để tạo tài khoản ChayBook.
        </p>
      )}
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}
      {!loading && pending && (
        <>
          <form className="space-y-4" onSubmit={sendCode}>
            <Input
              label="Email"
              type="email"
              name="email"
              aria-label="Email"
              autoComplete="email"
              icon={Mail}
              required
              maxLength={255}
              value={email}
              disabled={busy}
              onChange={(event) => {
                setEmail(event.target.value);
                setCode("");
                setCodeSentEmail("");
                setMessage("");
              }}
            />
            <Button type="submit" variant="outline" className="w-full" disabled={busy || !email.trim()}>
              {busy ? "Đang xử lý..." : codeSentEmail ? "Gửi lại mã xác minh" : "Gửi mã xác minh"}
            </Button>
          </form>
          {codeSentEmail && (
            <form className="mt-5 space-y-4" onSubmit={completeRegistration}>
              <Input
                label="Mã xác minh"
                name="code"
                aria-label="Mã xác minh"
                placeholder="Nhập 6 chữ số"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                disabled={busy}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
                {busy ? "Đang xác minh..." : "Xác minh và tạo tài khoản"}
              </Button>
            </form>
          )}
        </>
      )}
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-chaybook-primary hover:underline">Quay lại đăng nhập</Link>
      </p>
    </div>
  );
}

export default SocialRegistrationForm;

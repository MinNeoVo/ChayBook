import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, KeyRound, Link2, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

import Button from "../common/Button";
import Input from "../common/Input";
import { getSocialConnections, linkSocialAccount, requestSocialLinkCode } from "../../services/socialAuthServices";
import { getSocialAuthErrorMessage, getSocialProviderName, SOCIAL_PROVIDERS } from "../../utils/socialAuth";

function SocialConnections() {
  const location = useLocation();
  const [connections, setConnections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const busy = Boolean(action);

  useEffect(() => {
    let cancelled = false;
    getSocialConnections()
      .then((data) => {
        if (!cancelled) setConnections(data);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải tài khoản liên kết. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reload]);

  const handleLink = async (event) => {
    event.preventDefault();
    if (busy || !selectedProvider || (connections?.hasPassword ? !password : code.length !== 6)) return;
    setAction("linking");
    setError("");
    setMessage("");
    try {
      await linkSocialAccount(selectedProvider, connections?.hasPassword ? { password } : { code });
    } catch (linkError) {
      setError(getSocialAuthErrorMessage(linkError));
      setAction("");
    } finally {
      setPassword("");
    }
  };

  const sendCode = async () => {
    if (busy) return;
    setAction("sending");
    setError("");
    setMessage("");
    try {
      await requestSocialLinkCode();
      setCodeSent(true);
      setCode("");
      setMessage("Mã xác minh đã được gửi đến email của tài khoản ChayBook hiện tại.");
    } catch (codeError) {
      setError(getSocialAuthErrorMessage(codeError));
    } finally {
      setAction("");
    }
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6" aria-labelledby="social-connections-title">
      <h2 id="social-connections-title" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Link2 className="h-5 w-5 text-chaybook-primary" /> Tài khoản liên kết
      </h2>
      <p className="mt-1 text-sm text-gray-500">Thêm Google hoặc Facebook để đăng nhập vào tài khoản ChayBook này.</p>
      {location.state?.socialAuthMessage && (
        <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {location.state.socialAuthMessage}
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}
      {loading ? (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải tài khoản liên kết...</p>
      ) : !connections ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => {
          setLoading(true);
          setError("");
          setReload((value) => value + 1);
        }}>Thử lại</Button>
      ) : (
        <>
          {!connections.hasPassword && (
            <p className="mt-4 text-sm text-gray-500">
              Bạn chưa đặt mật khẩu ChayBook.{" "}
              <Link to="/forgot-password" className="font-medium text-chaybook-primary hover:underline">Tạo mật khẩu bằng email</Link>
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SOCIAL_PROVIDERS.map((provider) => {
              const connection = connections.providers?.find((item) => item.provider === provider);
              return (
                <div key={provider} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    {provider === "google" ? <FcGoogle className="text-xl" /> : <FaFacebook className="text-xl text-[#1877F2]" />}
                    {getSocialProviderName(provider)}
                  </div>
                  {connection?.linked ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-chaybook-primary"><CheckCircle2 className="h-4 w-4" /> Đã liên kết</span>
                  ) : (
                    <Button variant="outline" size="sm" disabled={busy || !connection?.enabled} onClick={() => {
                      setSelectedProvider(provider);
                      setPassword("");
                      setCode("");
                      setCodeSent(false);
                      setError("");
                      setMessage("");
                    }}>{connection?.enabled ? "Liên kết" : "Chưa khả dụng"}</Button>
                  )}
                </div>
              );
            })}
          </div>
          {selectedProvider && (
            <form onSubmit={handleLink} className="mt-5 space-y-4 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Liên kết {getSocialProviderName(selectedProvider)}</p>
              {connections.hasPassword ? (
                <Input
                  label="Mật khẩu ChayBook hiện tại"
                  type="password"
                  name="currentPassword"
                  aria-label="Mật khẩu ChayBook hiện tại"
                  autoComplete="current-password"
                  icon={KeyRound}
                  required
                  value={password}
                  disabled={busy}
                  onChange={(event) => setPassword(event.target.value)}
                />
              ) : (
                <>
                  <p className="text-sm text-gray-500">Xác minh bằng mã gửi đến email tài khoản ChayBook trước khi liên kết.</p>
                  <Button variant="outline" size="sm" disabled={busy} onClick={sendCode}>
                    {action === "sending" ? "Đang gửi mã..." : codeSent ? "Gửi lại mã xác minh" : "Gửi mã xác minh"}
                  </Button>
                  {codeSent && (
                    <Input
                      label="Mã xác minh"
                      name="linkCode"
                      aria-label="Mã xác minh liên kết"
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
                  )}
                </>
              )}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="sm" disabled={busy || (connections.hasPassword ? !password : code.length !== 6)}>
                  {action === "linking" ? "Đang chuyển đến trang xác thực..." : "Tiếp tục xác thực"}
                </Button>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => {
                  setSelectedProvider("");
                  setPassword("");
                  setCode("");
                  setCodeSent(false);
                  setError("");
                  setMessage("");
                }}>Hủy</Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}

export default SocialConnections;

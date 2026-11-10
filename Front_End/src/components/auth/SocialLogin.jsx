import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

import Button from "../common/Button";
import { getSocialProviders, startSocialLogin } from "../../services/socialAuthServices";
import { getSocialAuthErrorMessage } from "../../utils/socialAuth";

function SocialLogin() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSocialProviders()
      .then((data) => {
        if (!cancelled) setProviders(Array.isArray(data?.providers) ? data.providers : []);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải các phương thức đăng nhập. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const isEnabled = (provider) => providers.some((item) => item.provider === provider && item.enabled);
  const handleLogin = (provider) => {
    if (loading || redirecting || !isEnabled(provider)) return;
    setError("");
    setRedirecting(true);
    try {
      startSocialLogin(provider);
    } catch (loginError) {
      setError(getSocialAuthErrorMessage(loginError));
      setRedirecting(false);
    }
  };

  return (
    <>
      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-200"></div>

        <span className="text-sm text-gray-400 whitespace-nowrap">
          or continue with
        </span>

        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Google + Facebook */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <Button
          type="button"
          variant="outline"
          size="md"
          className="flex items-center justify-center gap-2"
          disabled={loading || redirecting || !isEnabled("google")}
          onClick={() => handleLogin("google")}
        >
          <FcGoogle className="text-xl" />

          <span>Google</span>
        </Button>

        {/* Facebook */}
        <Button
          type="button"
          variant="outline"
          size="md"
          className="flex items-center justify-center gap-2"
          disabled={loading || redirecting || !isEnabled("facebook")}
          onClick={() => handleLogin("facebook")}
        >
          <FaFacebook className="text-xl text-[#1877F2]" />

          <span>Facebook</span>
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {!loading && !error && !providers.some((provider) => provider.enabled) && (
        <p className="mt-3 text-center text-xs text-gray-500">Đăng nhập mạng xã hội hiện chưa khả dụng.</p>
      )}
      {redirecting && <p role="status" className="mt-3 text-center text-sm text-gray-500">Đang chuyển đến trang xác thực...</p>}
    </>
  );
}

export default SocialLogin;

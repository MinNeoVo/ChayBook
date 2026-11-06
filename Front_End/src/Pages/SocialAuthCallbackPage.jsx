import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import SocialRegistrationForm from "../components/auth/SocialRegistrationForm";
import { useAuth } from "../context/useAuth";
import { getSocialAuthErrorMessage, getSocialLoginDestination } from "../utils/socialAuth";

function SocialAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const result = searchParams.get("result");
  const errorCode = searchParams.get("error");
  const completed = ["success", "linked"].includes(result);

  if (!errorCode && (completed || result === "registration_required") && loading) {
    return (
      <div role="status" className="flex w-full items-center justify-center gap-3 p-8 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin text-chaybook-primary" />
        Đang hoàn tất xác thực...
      </div>
    );
  }

  if (!errorCode && completed && user) {
    return (
      <Navigate
        to={result === "linked" ? "/profile" : getSocialLoginDestination(user)}
        replace
        state={result === "linked" ? { socialAuthMessage: "Đã liên kết tài khoản thành công." } : null}
      />
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-4">
      {!errorCode && result === "registration_required" ? (
        <SocialRegistrationForm />
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">Chưa thể hoàn tất xác thực</h1>
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {getSocialAuthErrorMessage(errorCode || (completed ? "SESSION_MISSING" : "INVALID_STATE"))}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium text-chaybook-primary">
            <Link to="/login" className="hover:underline">Quay lại đăng nhập</Link>
            {user && <Link to="/profile" className="hover:underline">Trang cá nhân</Link>}
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialAuthCallbackPage;

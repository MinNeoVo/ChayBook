export const SOCIAL_PROVIDERS = ["google", "facebook"];

export const getSocialProviderName = (provider) => {
  if (provider === "google") return "Google";
  if (provider === "facebook") return "Facebook";
  return "tài khoản mạng xã hội";
};

function getBackendUrl(apiBaseUrl, frontendOrigin) {
  const url = new URL(apiBaseUrl, frontendOrigin);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("INVALID_AUTHORIZATION_URL");
  }
  url.pathname = url.pathname.replace(/\/+$/, "").replace(/\/api$/i, "");
  url.search = "";
  url.hash = "";
  return url;
}

export function getSocialAuthorizationUrl(
  apiBaseUrl,
  provider,
  frontendOrigin,
) {
  if (!SOCIAL_PROVIDERS.includes(provider)) {
    throw new Error("PROVIDER_NOT_SUPPORTED");
  }
  const url = getBackendUrl(apiBaseUrl, frontendOrigin);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/oauth2/authorization/${provider}`;
  return url.href;
}

// Link initiation returns a backend URL. Only the configured backend and known
// authorization paths may receive the browser navigation.
export function validateSocialAuthorizationUrl(
  authorizationUrl,
  apiBaseUrl,
  frontendOrigin,
) {
  if (typeof authorizationUrl !== "string" || !authorizationUrl) {
    throw new Error("INVALID_AUTHORIZATION_URL");
  }
  const backendUrl = getBackendUrl(apiBaseUrl, frontendOrigin);
  const url = new URL(
    authorizationUrl,
    `${backendUrl.href.replace(/\/$/, "")}/`,
  );
  const isAllowed = SOCIAL_PROVIDERS.some((provider) => {
    const allowed = new URL(
      getSocialAuthorizationUrl(apiBaseUrl, provider, frontendOrigin),
    );
    return url.origin === allowed.origin && url.pathname === allowed.pathname;
  });
  if (!isAllowed || url.username || url.password || url.hash) {
    throw new Error("INVALID_AUTHORIZATION_URL");
  }
  return url.href;
}

const SOCIAL_ERROR_MESSAGES = {
  ACCESS_DENIED:
    "Bạn đã hủy đăng nhập hoặc chưa cấp quyền truy cập. Vui lòng thử lại khi sẵn sàng.",
  OAUTH_CANCELLED: "Bạn đã hủy đăng nhập. Vui lòng thử lại khi sẵn sàng.",
  PROVIDER_DISABLED: "Phương thức đăng nhập này hiện chưa được bật.",
  PROVIDER_NOT_CONFIGURED: "Phương thức đăng nhập này hiện chưa được bật.",
  PROVIDER_NOT_SUPPORTED: "Phương thức đăng nhập này không được hỗ trợ.",
  PROVIDER_UNAVAILABLE:
    "Nhà cung cấp đăng nhập đang gặp sự cố. Vui lòng thử lại sau.",
  INVALID_STATE:
    "Yêu cầu đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng bắt đầu lại.",
  INVALID_TOKEN:
    "Không thể xác minh tài khoản mạng xã hội. Vui lòng đăng nhập lại.",
  INVALID_AUTHORIZATION_URL:
    "Không thể mở trang xác thực. Vui lòng thử lại sau.",
  EMAIL_ALREADY_EXISTS:
    "Email này đã có tài khoản ChayBook. Hãy đăng nhập bằng phương thức hiện có, rồi liên kết trong trang cá nhân.",
  EMAIL_CONFLICT:
    "Email này đã có tài khoản ChayBook. Hãy đăng nhập bằng phương thức hiện có, rồi liên kết trong trang cá nhân.",
  ACCOUNT_LINK_REQUIRED:
    "Email này đã có tài khoản ChayBook. Hãy đăng nhập bằng phương thức hiện có, rồi liên kết trong trang cá nhân.",
  ACCOUNT_DISABLED: "Tài khoản ChayBook của bạn đã bị vô hiệu hóa.",
  ACCOUNT_LOCKED: "Tài khoản ChayBook của bạn đã bị khóa.",
  ACCOUNT_INACTIVE:
    "Tài khoản ChayBook của bạn hiện không được phép đăng nhập.",
  IDENTITY_ALREADY_LINKED:
    "Tài khoản mạng xã hội này đã được liên kết với một tài khoản ChayBook khác.",
  SOCIAL_IDENTITY_ALREADY_LINKED:
    "Tài khoản mạng xã hội này đã được liên kết với một tài khoản ChayBook khác.",
  SOCIAL_ACCOUNT_CONFLICT:
    "Thông tin tài khoản đã thay đổi hoặc bị trùng. Vui lòng đăng nhập lại bằng phương thức hiện có.",
  INVALID_SOCIAL_IDENTITY:
    "Không thể xác minh tài khoản mạng xã hội. Vui lòng đăng nhập lại.",
  INVALID_EMAIL: "Vui lòng nhập địa chỉ email hợp lệ.",
  AUTHENTICATION_REQUIRED:
    "Vui lòng đăng nhập lại trước khi liên kết tài khoản.",
  PROVIDER_ALREADY_LINKED:
    "Bạn đã liên kết một tài khoản của nhà cung cấp này.",
  REAUTHENTICATION_REQUIRED: "Vui lòng xác thực lại để liên kết tài khoản.",
  INVALID_PASSWORD: "Mật khẩu hiện tại không chính xác.",
  REAUTHENTICATION_FAILED:
    "Không thể xác thực chủ tài khoản. Vui lòng thử lại.",
  PENDING_REGISTRATION_EXPIRED:
    "Phiên đăng ký đã hết hạn. Vui lòng đăng nhập bằng Google hoặc Facebook lại.",
  PENDING_REGISTRATION_NOT_FOUND:
    "Không tìm thấy phiên đăng ký. Vui lòng đăng nhập bằng Google hoặc Facebook lại.",
  INVALID_OTP: "Mã xác minh không chính xác hoặc đã hết hạn.",
  OTP_EXPIRED: "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.",
  RESEND_TOO_SOON:
    "Bạn vừa yêu cầu mã xác minh. Vui lòng đợi một lúc trước khi gửi lại.",
  EMAIL_DELIVERY_FAILED: "Chưa thể gửi email xác minh. Vui lòng thử lại sau.",
  TOO_MANY_ATTEMPTS:
    "Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.",
  RATE_LIMITED:
    "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lúc rồi thử lại.",
  CSRF_INVALID:
    "Phiên xác thực không còn hợp lệ. Vui lòng tải lại trang rồi thử lại.",
  SESSION_MISSING: "Không thể tải phiên đăng nhập. Vui lòng đăng nhập lại.",
  SESSION_EXPIRED: "Phiên xác thực đã hết hạn. Vui lòng bắt đầu lại.",
  LINK_SESSION_CHANGED:
    "Tài khoản đang đăng nhập đã thay đổi. Vui lòng bắt đầu liên kết lại từ trang cá nhân.",
  OAUTH_FAILED:
    "Không thể xác thực với nhà cung cấp đăng nhập. Vui lòng thử lại.",
  PASSWORD_REQUIRED:
    "Tài khoản đã có mật khẩu. Vui lòng xác minh bằng mật khẩu hiện tại.",
};

export function getSocialAuthErrorMessage(error) {
  const code =
    typeof error === "string"
      ? error
      : error?.data?.code || error?.data?.error || error?.message;
  if (typeof code === "string" && Object.hasOwn(SOCIAL_ERROR_MESSAGES, code))
    return SOCIAL_ERROR_MESSAGES[code];
  if (error?.status === 429) return SOCIAL_ERROR_MESSAGES.RATE_LIMITED;
  return "Không thể hoàn tất xác thực. Vui lòng thử lại hoặc đăng nhập bằng phương thức khác.";
}

export const getSocialLoginDestination = (user) =>
  user?.role === "ADMIN" ? "/admin" : "/";

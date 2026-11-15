import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Check,
  X,
  Zap,
  Sparkles,
  QrCode,
  ShieldCheck,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/useAuth";
import {
  createPaymentLink,
  checkPaymentStatus,
  simulatePaymentSuccess,
  getMySubscription,
} from "../services/paymentServices";

export default function UpgradeProPage() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [subData, setSubData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pollTimerRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) {
      getMySubscription()
        .then((data) => setSubData(data))
        .catch((err) => console.error("Error loading subscription info:", err));
    }
  }, [isLoggedIn]);

  // Dọn dẹp polling timer khi unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleStartPayment = async () => {
    if (loading) return;
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/upgrade-pro" } });
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await createPaymentLink();

      // Nếu hệ thống vừa đối soát thấy bạn đã thanh toán xong đơn hàng trước đó
      if (res.status === "PAID") {
        await refreshUser();
        navigate("/payment/success", { state: { orderCode: res.orderCode } });
        return;
      }

      setPaymentData(res);
      setShowPayModal(true);

      // Bắt đầu tự động kiểm tra trạng thái mỗi 5 giây (tối đa 5 phút để tránh quá tải)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      let pollCount = 0;
      pollTimerRef.current = setInterval(async () => {
        pollCount++;
        if (pollCount > 60) {
          clearInterval(pollTimerRef.current);
          return;
        }
        try {
          const statusRes = await checkPaymentStatus(res.orderCode);
          if (statusRes.status === "PAID") {
            clearInterval(pollTimerRef.current);
            await refreshUser();
            navigate("/payment/success", { state: { orderCode: statusRes.orderCode || res.orderCode } });
          }
        } catch (e) {
          console.warn("Polling error:", e);
        }
      }, 5000);
    } catch (err) {
      console.error("Create payment error:", err);
      setErrorMsg(err.message || "Không thể tạo liên kết thanh toán. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!paymentData?.orderCode) return;
    try {
      setCheckingStatus(true);
      const statusRes = await checkPaymentStatus(paymentData.orderCode);
      if (statusRes.status === "PAID") {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        await refreshUser();
        navigate("/payment/success", { state: { orderCode: statusRes.orderCode || paymentData.orderCode } });
      } else {
        alert("Hệ thống chưa nhận được tiền chuyển khoản. Nếu bạn vừa thanh toán, vui lòng đợi 5-10 giây rồi bấm kiểm tra lại nhé!");
      }
    } catch (err) {
      alert("Lỗi kiểm tra trạng thái: " + (err.message || "Thử lại sau."));
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSimulateDemo = async () => {
    if (!paymentData?.orderCode) return;
    try {
      setCheckingStatus(true);
      const statusRes = await simulatePaymentSuccess(paymentData.orderCode);
      if (statusRes.status === "PAID") {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        await refreshUser();
        navigate("/payment/success", { state: { orderCode: paymentData.orderCode, isDemo: true } });
      }
    } catch (err) {
      alert("Lỗi demo: " + (err.message || "Không thể kích hoạt demo"));
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleClosePayModal = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setShowPayModal(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const isAlreadyPro = user?.isPro || subData?.pro;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Banner nếu tài khoản đã là Pro */}
        {isAlreadyPro && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Tài khoản của bạn đang là ChayBook Pro 👑
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subData?.daysRemaining != null
                      ? `Bạn còn ${subData.daysRemaining} ngày sử dụng (hết hạn ngày ${new Date(
                          subData.proExpiresAt
                        ).toLocaleDateString("vi-VN")}). Bạn có thể gia hạn thêm bất cứ lúc nào.`
                      : "Gói Pro đang kích hoạt không giới hạn thời gian."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartPayment}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tạo mã...</span>
                  </>
                ) : (
                  <span>Gia hạn thêm 30 ngày (+2.000đ)</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800 shadow-2xs">
            <Sparkles className="h-4 w-4 text-amber-500" /> NÂNG TẦM TRẢI NGHIỆM ĂN CHAY THÔNG MINH
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Trở thành thành viên <span className="text-amber-500">ChayBook Pro</span>
          </h1>
          <p className="mt-4 text-base text-gray-600 sm:text-lg max-w-2xl mx-auto">
            Mở khóa toàn bộ sức mạnh trí tuệ nhân tạo AI: Trò chuyện không giới hạn, tạo thực đơn cá nhân hóa, nhận diện nguyên liệu ảnh và phân tích video công thức.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* FREE PLAN */}
          <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Gói Tiêu chuẩn (Free)</h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Mặc định
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Trải nghiệm các tính năng cơ bản của nền tảng ChayBook.
              </p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900">0đ</span>
                <span className="text-sm font-medium text-gray-500"> / vĩnh viễn</span>
              </div>

              <ul className="mt-8 space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Tra cứu hàng nghìn công thức món chay miễn phí</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Đọc và tương tác các bài viết kiến thức dinh dưỡng chay</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Tham gia cộng đồng, chia sẻ món ăn cá nhân</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Chatbot AI tư vấn: <strong>Giới hạn 5 câu hỏi / 1 ngày</strong></span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <X className="h-5 w-5 shrink-0 text-gray-400" />
                  <span>Tạo thực đơn cá nhân hóa (Meal Plan) theo BMI (Khóa)</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <X className="h-5 w-5 shrink-0 text-gray-400" />
                  <span>Nhận diện nguyên liệu từ ảnh chụp qua AI (Khóa)</span>
                </li>
                <li className="flex items-start gap-3 text-gray-400">
                  <X className="h-5 w-5 shrink-0 text-gray-400" />
                  <span>Phân tích công thức từ Video YouTube / TikTok (Khóa)</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <div className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 bg-gray-50">
                Gói hiện tại
              </div>
            </div>
          </div>

          {/* PRO PLAN */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/60 to-white p-8 shadow-xl">
            <div className="absolute -top-4 right-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1 text-xs font-bold text-white shadow-md">
              KHUYÊN DÙNG
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-6 w-6 text-amber-500" />
                  <h3 className="text-xl font-bold text-gray-900">Gói ChayBook Pro</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  30 Ngày
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Toàn quyền mở khóa tất cả công cụ AI cao cấp nhất.
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-amber-600">2.000đ</span>
                <span className="text-sm font-medium text-gray-500"> / 30 ngày</span>
                <span className="text-xs text-gray-400 line-through">49.000đ</span>
              </div>

              <ul className="mt-8 space-y-4 text-sm text-gray-800">
                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>
                    <strong>Chatbot AI không giới hạn:</strong> Hỏi đáp dinh dưỡng, thực đơn, lưu lịch sử mọi lúc.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>
                    <strong>Tạo thực đơn cá nhân hóa (Meal Plan):</strong> Tự động tính calo, tránh dị ứng và phù hợp mục tiêu BMI.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>
                    <strong>Nhận diện ảnh AI Vision:</strong> Chụp ảnh tủ lạnh/nguyên liệu, AI gợi ý món ăn thích hợp ngay tức thì.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>
                    <strong>Phân tích Video thông minh:</strong> Tự động bóc tách nguyên liệu và các bước làm từ video clip nấu ăn.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>
                    <strong>Huy hiệu Pro VIP</strong> nổi bật bên cạnh ảnh đại diện.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Button
                type="button"
                variant="primary"
                onClick={handleStartPayment}
                disabled={loading}
                className="w-full justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 shadow-lg shadow-amber-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Đang tạo mã thanh toán...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" /> Nâng cấp Pro ngay (2.000đ)
                  </>
                )}
              </Button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Thanh toán tự động bảo mật qua VietQR / PayOS
              </div>
            </div>
          </div>
        </div>

        {/* Features Comparison Deep-Dive */}
        <div className="mt-16 rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Bảng đối chiếu quyền lợi tài khoản
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-4 font-semibold">Tính năng</th>
                  <th className="py-4 font-semibold text-center">Tài khoản Thường</th>
                  <th className="py-4 font-semibold text-center text-amber-600">Tài khoản Pro 👑</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="py-3.5 font-medium">Hỏi đáp Chatbot AI</td>
                  <td className="py-3.5 text-center text-gray-600">5 câu / ngày</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium">Tạo thực đơn cá nhân hóa (Meal Plan)</td>
                  <td className="py-3.5 text-center text-rose-500 font-semibold">❌ Không hỗ trợ</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">✅ Không giới hạn</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium">Nhận diện nguyên liệu từ hình ảnh</td>
                  <td className="py-3.5 text-center text-rose-500 font-semibold">❌ Không hỗ trợ</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">✅ Không giới hạn</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium">Phân tích công thức từ Video</td>
                  <td className="py-3.5 text-center text-rose-500 font-semibold">❌ Không hỗ trợ</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">✅ Mở khóa toàn diện</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium">Lưu trữ món ăn & lịch sử thực đơn</td>
                  <td className="py-3.5 text-center text-gray-600">Cơ bản</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Đầy đủ & Xuất dữ liệu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP THANH TOÁN VIETQR / PAYOS */}
      {showPayModal && paymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={handleClosePayModal}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={handleClosePayModal}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <QrCode className="h-4 w-4" /> QUÉT MÃ VIETQR TỰ ĐỘNG
              </div>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                Thanh toán nâng cấp ChayBook Pro
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Mở ứng dụng ngân hàng bất kỳ để quét mã QR chuyển khoản chính xác số tiền.
              </p>
            </div>

            {/* Khung mã QR */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-amber-50/50 p-4 border border-amber-200">
              {paymentData.qrCode ? (
                <img
                  src={paymentData.qrCode}
                  alt="Mã QR thanh toán VietQR"
                  className="h-56 w-56 rounded-xl bg-white p-2 shadow-sm object-contain"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-white text-gray-400">
                  Đang tải mã QR...
                </div>
              )}

              <div className="mt-4 w-full space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                  <span className="text-gray-500">Số tiền:</span>
                  <span className="font-bold text-amber-600 text-base">
                    {paymentData.amount?.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                  <span className="text-gray-500">Nội dung chuyển:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
                    <span>ChayBook Pro {paymentData.orderCode}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`ChayBook Pro ${paymentData.orderCode}`)}
                      className="text-amber-600 hover:text-amber-800"
                      title="Sao chép"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {copiedMemo && <span className="text-xs text-emerald-600 font-normal">Đã chép!</span>}
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-mono text-gray-700 font-semibold">#{paymentData.orderCode}</span>
                </div>
              </div>
            </div>

            {/* Waiting indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <span>Hệ thống đang tự động kiểm tra giao dịch chuyển khoản...</span>
            </div>

            {/* Buttons */}
            <div className="mt-5 space-y-2.5">
              {paymentData.checkoutUrl && !paymentData.isMock && (
                <a
                  href={paymentData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Mở trang PayOS thanh toán
                </a>
              )}

              <Button
                type="button"
                variant="primary"
                onClick={handleManualCheck}
                disabled={checkingStatus}
                className="w-full justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
              >
                {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Tôi đã chuyển khoản thành công
              </Button>

              {/* Nút Demo dành cho Giảng viên / Ban giám khảo chấm đồ án */}
              <button
                type="button"
                onClick={handleSimulateDemo}
                disabled={checkingStatus}
                className="w-full rounded-xl border border-dashed border-gray-300 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                ⚡ Kích hoạt nhanh ngay (Chế độ Demo / Test đồ án)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


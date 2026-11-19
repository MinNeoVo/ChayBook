import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Crown, Sparkles, ArrowRight, CalendarDays, Camera, Video, Bot } from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/useAuth";

export default function PaymentSuccessPage() {
  const { refreshUser } = useAuth();
  const location = useLocation();
  const orderCode = location.state?.orderCode;

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-emerald-50/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        {/* Celebration Badge */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-xl shadow-amber-500/30 animate-bounce">
          <Crown className="h-12 w-12 text-white" />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-800">
          <Sparkles className="h-4 w-4 text-emerald-600" /> THANH TOÁN THÀNH CÔNG
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Chào mừng bạn đến với <span className="text-amber-500">ChayBook Pro!</span>
        </h1>

        <p className="mt-3 text-base text-gray-600 leading-relaxed max-w-lg mx-auto">
          Tài khoản của bạn đã được nâng cấp thành công gói Pro 30 ngày. Toàn bộ các tính năng AI chuyên sâu và cao cấp nhất đã sẵn sàng phục vụ bạn.
        </p>

        {orderCode && (
          <div className="mt-4 inline-block rounded-xl bg-gray-100 px-4 py-1.5 text-xs text-gray-600 font-mono">
            Mã đơn hàng: #{orderCode}
          </div>
        )}

        {/* Feature quick links */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
          <Link
            to="/meal-plan"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-amber-600">Tạo thực đơn Meal Plan</h4>
              <p className="text-xs text-gray-500">Thực đơn chuẩn calo theo BMI</p>
            </div>
          </Link>

          <Link
            to="/ingredient-recognition"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-amber-600">Nhận diện ảnh AI</h4>
              <p className="text-xs text-gray-500">Quét ảnh nguyên liệu từ tủ lạnh</p>
            </div>
          </Link>

          <Link
            to="/video-analysis"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-amber-600">Phân tích Video</h4>
              <p className="text-xs text-gray-500">Trích xuất công thức từ video</p>
            </div>
          </Link>

          <Link
            to="/ai-assistant"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-amber-600">Chatbot AI không giới hạn</h4>
              <p className="text-xs text-gray-500">Hỏi đáp thoải mái mọi lúc</p>
            </div>
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <Link to="/">
            <Button variant="secondary" size="md">
              Về trang chủ
            </Button>
          </Link>
          <Link to="/ai-assistant">
            <Button variant="primary" size="md" className="gap-2 bg-amber-500 hover:bg-amber-600">
              Bắt đầu trải nghiệm ngay <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


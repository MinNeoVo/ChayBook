import { Crown, Sparkles, Check, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./Button";

export default function ProLockModal({
  isOpen,
  onClose,
  featureName = "tính năng này",
  customMessage = null,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon with Glowing Effect */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-inner">
          <Crown className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>

        {/* Title */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Sparkles className="h-3.5 w-3.5" /> DÀNH RIÊNG CHO GÓI PRO
          </div>
          <h3 className="mt-2 text-xl font-bold text-gray-900">
            Mở khóa {featureName}
          </h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {customMessage ||
              `Tính năng ${featureName} chỉ dành cho tài khoản ChayBook Pro. Nâng cấp ngay hôm nay để tận hưởng trọn vẹn sức mạnh AI.`}
          </p>
        </div>

        {/* Benefits List */}
        <div className="mt-5 space-y-2.5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>Trò chuyện Chatbot AI không giới hạn (Free 5 câu/ngày)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>Tạo thực đơn cá nhân hóa (Meal Plan) theo BMI</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>Nhận diện nguyên liệu từ hình ảnh qua AI Vision</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>Phân tích công thức từ video YouTube & upload</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/upgrade-pro" onClick={onClose} className="w-full">
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-2.5 shadow-md"
            >
              <Zap className="h-4 w-4" /> Nâng cấp Pro ngay (2.000đ / tháng)
            </Button>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            Để sau, tôi sẽ nâng cấp sau
          </button>
        </div>
      </div>
    </div>
  );
}


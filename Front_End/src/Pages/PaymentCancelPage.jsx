import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Button from "../components/common/Button";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-200 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>

        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Giao dịch chưa hoàn tất
        </h2>

        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Giao dịch nâng cấp ChayBook Pro đã bị hủy hoặc chưa hoàn tất thanh toán. Tài khoản của bạn hiện vẫn giữ nguyên quyền lợi của gói tiêu chuẩn.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link to="/upgrade-pro" className="w-full">
            <Button variant="primary" className="w-full justify-center gap-2 bg-amber-500 hover:bg-amber-600">
              <RefreshCw className="h-4 w-4" /> Thử thanh toán lại
            </Button>
          </Link>
          <Link to="/" className="w-full">
            <Button variant="secondary" className="w-full justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


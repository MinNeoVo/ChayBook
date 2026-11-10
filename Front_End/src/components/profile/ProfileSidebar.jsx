import { useEffect, useState } from "react";
import { Activity, Ruler, Weight, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { useBmi } from "../../context/useBmi";
import { getMyAllergies } from "../../services/allergyServices";
import { formatBmiValue, getBmiCategoryLabel } from "../../utils/bmi";

function ProfileSidebar() {
  const [allergies, setAllergies] = useState([]);
  const [allergiesLoading, setAllergiesLoading] = useState(true);
  const [allergiesError, setAllergiesError] = useState("");
  const {
    bmiRecord,
    initialized: bmiInitialized,
    loading: bmiLoading,
    error: bmiError,
  } = useBmi();

  useEffect(() => {
    const controller = new AbortController();

    getMyAllergies({ signal: controller.signal })
      .then((userAllergies) => {
        if (!Array.isArray(userAllergies)) {
          throw new Error("Dữ liệu dị ứng trả về không hợp lệ.");
        }
        setAllergies(userAllergies);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          console.error("Không thể tải thông tin dị ứng:", requestError);
          setAllergiesError(
            requestError.message || "Không thể tải thông tin dị ứng.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAllergiesLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <aside className="lg:col-span-4 flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Thông tin sức khỏe
          </h2>
          <Activity size={20} className="text-chaybook-primary" />
        </div>

        {bmiRecord ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <HealthMetric
                icon={Ruler}
                label="Chiều cao"
                value={`${bmiRecord.height} cm`}
              />
              <HealthMetric
                icon={Weight}
                label="Cân nặng"
                value={`${bmiRecord.weight} kg`}
              />
            </div>
            <div className="rounded-xl bg-[#f1f4f1] p-4">
              <span className="text-xs text-gray-500">Chỉ số BMI</span>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-chaybook-primary">
                  {formatBmiValue(bmiRecord.bmi)}
                </span>
                <span className="text-right text-xs font-semibold text-gray-700">
                  {getBmiCategoryLabel(bmiRecord.category)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p
            role={bmiError ? "alert" : undefined}
            className={`text-sm leading-6 ${bmiError ? "text-red-600" : "text-gray-600"}`}
          >
            {bmiError ||
              (bmiLoading || !bmiInitialized
                ? "Đang tải thông tin sức khỏe..."
                : "Bạn chưa lưu chiều cao và cân nặng.")}
          </p>
        )}

        <Link
          to="/meal-plan"
          className="mt-4 inline-flex text-sm font-semibold text-chaybook-primary hover:underline"
        >
          Cập nhật tại trang Thực đơn
        </Link>

        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert size={18} className="text-chaybook-primary" />
            <h3 className="text-sm font-bold text-gray-900">
              Dị ứng thực phẩm
            </h3>
          </div>

          {allergiesLoading ? (
            <p className="text-sm text-gray-600">
              Đang tải thông tin dị ứng...
            </p>
          ) : allergiesError ? (
            <p role="alert" className="text-sm text-red-600">
              {allergiesError}
            </p>
          ) : allergies.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {allergies.map((allergy) => (
                <li
                  key={allergy.allergyId}
                  className="rounded-full bg-[#f1f4f1] px-3 py-1 text-sm font-medium text-gray-700"
                >
                  {allergy.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">
              Chưa lưu dị ứng thực phẩm nào.
            </p>
          )}
        </div>
      </div>

      {/* Công thức riêng từ video */}
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Công thức của tôi</h3>

          <p className="mt-1 text-sm text-gray-600">
            Phân tích video và lưu những công thức bạn đã xem lại vào kho riêng.
          </p>
        </div>

        <Link
          to="/video-analysis"
          className="flex w-full items-center justify-center rounded-xl bg-chaybook-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-chaybook-hover"
        >
          Phân tích công thức từ video
        </Link>

        <Link
          to="/my-recipes"
          className="flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-chaybook-primary transition hover:bg-green-50"
        >
          Xem công thức riêng
        </Link>
      </div>
    </aside>
  );
}

function HealthMetric({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f1f4f1] p-3">
      <div className="mb-2 flex items-center gap-2 text-[#466252]">
        <Icon size={16} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="truncate text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

export default ProfileSidebar;

import { useEffect, useState } from "react";
import {
  Brain,
  CalendarCheck,
  Bookmark,
  MapPin,
  School,
  Sparkles,
  Activity,
  Ruler,
  Weight,
  ShieldAlert,
} from "lucide-react";
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
          <h2 className="text-lg font-bold text-gray-900">Thông tin sức khỏe</h2>
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
            <p className="text-sm text-gray-600">Đang tải thông tin dị ứng...</p>
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

      {/* Introduction */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Giới thiệu</h2>

          <Brain size={20} className="text-chaybook-primary" />
        </div>

        <p
          className="
          text-sm
          leading-relaxed
          text-gray-600
          mb-4
        "
        >
          Fostering peaceful everyday dining. Transitioned to 100% whole-food
          plant eating in early 2024 to enhance focus, reduce environmental
          footprint, and share easy weeknight meal formulas.
        </p>

        <div className="space-y-2 mb-6">
          <InfoItem
            icon={School}
            label="Học tại"
            value="FPT University TP. HCM"
          />

          <InfoItem
            icon={MapPin}
            label="Sống tại"
            value="Ho Chi Minh City, Vietnam"
          />

          <InfoItem
            icon={Sparkles}
            label="Triết lý dinh dưỡng"
            value="100% Whole Food Plant-Based"
          />

          <InfoItem
            icon={CalendarCheck}
            label="Tham gia cộng đồng"
            value="March 14, 2024"
          />
        </div>

        <button
          type="button"
          className="
            w-full
            py-2
            px-3
            rounded-lg
            bg-[#ebefec]
            text-gray-800
            text-sm
            font-medium
            hover:bg-gray-200
            transition-colors
          "
        >
          Chỉnh sửa giới thiệu
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3
          className="
          text-xs
          font-bold
          uppercase
          tracking-wider
          text-gray-600
          mb-4
        "
        >
          Truy cập nhanh & bộ sưu tập
        </h3>

        <div className="space-y-2">
          <QuickAction
            icon={Bookmark}
            title="Bài viết & công thức đã lưu"
            badge="24 mục đã lưu"
          />

          <QuickAction
            icon={Activity}
            title="Thực đơn tuần của tôi"
            badge="3 thực đơn đang dùng"
          />

          <QuickAction icon={Activity} title="Nhật ký BMI & vi chất" />
        </div>

        <div
          className="
          mt-4
          p-3
          rounded-xl
          bg-[#e6e9e6]/60
          flex
          items-start
          gap-2
        "
        >
          <Sparkles
            size={18}
            className="text-chaybook-primary shrink-0 mt-0.5"
          />

          <div>
            <span className="text-xs font-semibold text-gray-800">
              Tiêu chuẩn cộng đồng ChayBook
            </span>

            <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
              Các món ăn từ thực vật được đánh giá theo quy định nội dung của
              ChayBook.
            </p>
          </div>
        </div>
      </div>

      {/* Cooking Streak */}
      <div
        className="
        bg-gradient-to-br
        from-[#f1f4f1]
        to-[#92f5a4]/20
        rounded-2xl
        p-6
        shadow-sm
      "
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="
            text-xs
            font-bold
            uppercase
            tracking-wider
            text-chaybook-primary
          "
          >
            Thói quen nấu ăn
          </span>

          <span
            className="
            text-xs
            bg-chaybook-primary
            text-white
            px-2
            py-0.5
            rounded-full
            font-bold
          "
          >
            Chuỗi 5 ngày
          </span>
        </div>

        <p className="text-lg font-semibold text-gray-900">
          Clean Green Living
        </p>

        <div className="grid grid-cols-7 gap-1 mt-4 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[11px] text-gray-500">{day}</span>

              <div
                className={`
                    w-7
                    h-7
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-xs
                    ${
                      index < 5
                        ? "bg-chaybook-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
              >
                {index < 5 ? "✓" : "·"}
              </div>
            </div>
          ))}
        </div>
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

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div
      className="
      flex
      items-center
      gap-3
      p-2
      rounded-lg
      bg-[#f1f4f1]/60
    "
    >
      <Icon size={20} className="text-[#466252] shrink-0" />

      <div className="flex flex-col min-w-0">
        <span className="text-[11px] text-gray-500">{label}</span>

        <span className="text-sm font-semibold text-gray-800 truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, badge }) {
  return (
    <button
      type="button"
      className="
        w-full
        flex
        items-center
        justify-between
        p-3
        rounded-xl
        bg-[#f1f4f1]
        hover:bg-[#ebefec]
        transition-colors
        group
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
          w-8
          h-8
          rounded-lg
          bg-chaybook-primary/10
          text-chaybook-primary
          flex
          items-center
          justify-center
        "
        >
          <Icon size={18} />
        </div>

        <span
          className="
          text-sm
          font-medium
          text-gray-800
          group-hover:text-chaybook-primary
        "
        >
          {title}
        </span>
      </div>

      {badge && (
        <span
          className="
          text-[11px]
          font-semibold
          px-2
          py-0.5
          rounded-full
          bg-[#92f5a4]
          text-[#007233]
        "
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default ProfileSidebar;

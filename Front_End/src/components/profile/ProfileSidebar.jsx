import {
  Brain,
  CalendarCheck,
  Bookmark,
  MapPin,
  School,
  Sparkles,
  Activity,
} from "lucide-react";

function ProfileSidebar() {
  return (
    <aside className="lg:col-span-4 flex flex-col gap-6">
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

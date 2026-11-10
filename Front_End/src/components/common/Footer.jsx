import { Link } from "react-router-dom";
import { Share2, MessageSquare, Mail } from "lucide-react";

const footerSections = [
  {
    title: "Khám phá",
    links: [
      ["Cẩm nang dinh dưỡng", "/content"],
      ["Công thức lành mạnh", "/recipes"],
      ["Video hướng dẫn", "/content"],
      ["Thực đơn", "/meal-plan"],
    ],
  },
  {
    title: "Công cụ tương tác",
    links: [
      ["Trợ lý dinh dưỡng AI", "/ai-assistant"],
      ["Tính chỉ số BMI", "/bmi"],
      ["Phân tích dinh dưỡng", "/bmi"],
      ["Theo dõi calo hằng ngày", "/bmi"],
    ],
  },
  {
    title: "Cộng đồng",
    links: [
      ["Thảo luận", "/community"],
      ["Câu chuyện thành viên", "/community"],
      ["Hướng dẫn dinh dưỡng", "/community"],
      ["Thử thách hằng tuần", "/community"],
    ],
  },
];

const legalLinks = [
  ["contact@chaybook.com", "mailto:contact@chaybook.com"],
  ["Chính sách quyền riêng tư", "#"],
  ["Điều khoản dịch vụ", "#"],
];

const socialLinks = [
  { label: "Chia sẻ", icon: Share2, href: "#" },
  { label: "Tin nhắn", icon: MessageSquare, href: "#" },
  {
    label: "Email liên hệ",
    icon: Mail,
    href: "mailto:contact@chaybook.com",
  },
];

function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-gray-200/80 bg-[#ebefec] pb-12 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-8 border-b border-gray-300/60 pb-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo + Description */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chaybook-primary text-base font-bold text-white shadow-sm">
                C
              </div>

              <span className="text-xl font-bold tracking-tight text-chaybook-primary">
                ChayBook
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-gray-600">
              Ăn ngon hơn, sống khỏe hơn. Người bạn đồng hành trên hành trình
              sống lành mạnh với chế độ ăn chay.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-chaybook-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                {section.title}
              </h4>

              <ul className="flex flex-col gap-2 text-xs text-gray-600">
                {section.links.map(([label, path]) => (
                  <li key={label}>
                    <Link
                      to={path}
                      className="transition-colors hover:text-chaybook-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact & Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Liên hệ & pháp lý
            </h4>

            <ul className="flex flex-col gap-2 text-xs text-gray-600">
              {legalLinks.map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    className="transition-colors hover:text-chaybook-primary"
                  >
                    {label}
                  </a>
                </li>
              ))}

              <li className="pt-1 text-gray-400">
                Dự án tốt nghiệp FPT University
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 ChayBook. Bảo lưu mọi quyền.</p>

          <div className="flex items-center gap-6">
            {["Cookie", "Bảo mật", "Trợ năng"].map((item) => (
              <a
                key={item}
                href="#"
                className="transition-colors hover:text-chaybook-primary"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

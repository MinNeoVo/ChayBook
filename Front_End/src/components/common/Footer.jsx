import { Link } from "react-router-dom";
import { Share2, MessageSquare, Mail } from "lucide-react";

const footerSections = [
  {
    title: "Explore",
    links: [
      ["Nutrition Guides", "/content"],
      ["Healthy Recipes", "/recipes"],
      ["Video Tutorials", "/content"],
      ["Meal Plans", "/content"],
    ],
  },
  {
    title: "Interactive Tools",
    links: [
      ["AI Nutrition Assistant", "/ai-assistant"],
      ["BMI Calculator", "/bmi"],
      ["Macro Analyzer", "/bmi"],
      ["Daily Calorie Tracker", "/bmi"],
    ],
  },
  {
    title: "Community",
    links: [
      ["Discussions", "/community"],
      ["Member Stories", "/community"],
      ["Dietary Guidelines", "/community"],
      ["Weekly Challenges", "/community"],
    ],
  },
];

const legalLinks = [
  ["contact@chaybook.com", "mailto:contact@chaybook.com"],
  ["Privacy Policy", "#"],
  ["Terms of Service", "#"],
];

const socialLinks = [
  { label: "Share", icon: Share2, href: "#" },
  { label: "Message", icon: MessageSquare, href: "#" },
  {
    label: "Contact Email",
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
              Eat Better. Live Healthier. Your complete companion for a thriving
              vegetarian lifestyle.
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
              Contact & Legal
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
                FPT University Capstone Initiative
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-gray-500 sm:flex-row">
          <p>© 2026 ChayBook. All rights reserved.</p>

          <div className="flex items-center gap-6">
            {["Cookies", "Security", "Accessibility"].map((item) => (
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

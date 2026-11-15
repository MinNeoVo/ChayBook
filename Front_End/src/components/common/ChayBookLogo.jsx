/**
 * ChayBook Logo Component
 * Combines the stylized open-cookbook and fresh sprout leaves branding.
 *
 * @param {Object} props
 * @param {"xs"|"sm"|"md"|"lg"|"xl"} [props.size="md"] - Size preset
 * @param {boolean} [props.withText=false] - Whether to render brand title
 * @param {string} [props.subtitle] - Optional subtitle (e.g. "Bảng quản trị")
 * @param {string} [props.className=""] - Additional class for the container
 * @param {string} [props.iconClassName=""] - Additional class for the icon
 * @param {string} [props.textClassName=""] - Additional class for the text
 * @param {"image"|"svg"} [props.type="image"] - Render as realistic logo image or vector badge
 * @param {boolean} [props.inverted=false] - For dark/colored backgrounds (e.g. Admin sidebar)
 */
export default function ChayBookLogo({
  size = "md",
  withText = false,
  subtitle = "",
  className = "",
  iconClassName = "",
  textClassName = "",
  type = "image",
  inverted = false,
}) {
  const sizeMap = {
    xs: { box: "h-7 w-7", text: "text-base", sub: "text-[10px]" },
    sm: { box: "h-8 w-8", text: "text-lg", sub: "text-xs" },
    md: { box: "h-9 w-9 sm:h-10 sm:w-10", text: "text-lg sm:text-xl", sub: "text-xs" },
    lg: { box: "h-12 w-12", text: "text-2xl", sub: "text-sm" },
    xl: { box: "h-16 w-16", text: "text-3xl", sub: "text-base" },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      {/* Logo Icon */}
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-xl transition-transform duration-200 hover:scale-105 ${selectedSize.box} ${
          inverted ? "bg-white/10 shadow-inner" : ""
        } ${iconClassName}`}
      >
        {type === "image" ? (
          <img
            src="/logo-transparent.png"
            alt="ChayBook Logo"
            className="h-full w-full object-contain drop-shadow-sm"
            onError={(e) => {
              // Graceful fallback to SVG if PNG fails to load
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logo.svg";
            }}
          />
        ) : (
          <img
            src="/logo.svg"
            alt="ChayBook Logo"
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {/* Brand Text */}
      {withText && (
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className={`font-bold tracking-tight ${selectedSize.text} ${
              inverted
                ? "text-white"
                : "text-chaybook-primary"
            } ${textClassName}`}
          >
            ChayBook
          </span>
          {subtitle && (
            <span
              className={`font-medium ${selectedSize.sub} ${
                inverted ? "text-white/80" : "text-gray-500"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

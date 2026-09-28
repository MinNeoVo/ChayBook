function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
}) {
  const variants = {
    primary: "bg-chaybook-primary hover:bg-chaybook-hover text-white",

    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",

    danger: "bg-red-500 hover:bg-red-600 text-white",

    outline:
      "border border-gray-300 hover:bg-chaybook-primary hover:text-white text-chaybook-primary",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
                flex 
                items-center 
                justify-center
                font-semibold
                rounded-xl
                transition-all
                shadow-sm
                active:scale-[0.99]
                cursor-pointer
                disabled:opacity-50
                disabled:cursor-not-allowed

                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
    >
      {children}
    </button>
  );
}

export default Button;

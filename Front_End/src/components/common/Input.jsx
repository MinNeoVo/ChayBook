import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Input({
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  error,
  name,
  className = "",
  allowTogglePassword = true,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";
  const actualType = isPasswordType && showPassword ? "text" : type;

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </span>
        )}

        <input
          type={actualType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
                        w-full
                        ${Icon ? "pl-10" : "px-4"}
                        ${isPasswordType && allowTogglePassword ? "pr-10" : "pr-4"}
                        py-2.5
                        rounded-xl
                        border
                        bg-white
                        text-sm
                        text-gray-800
                        placeholder:text-gray-400
                        outline-none
                        transition-all

                        ${
                          error
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-gray-200 focus:border-chaybook-primary focus:ring-2 focus:ring-chaybook-primary/20"
                        }

                        ${className}
                    `}
          {...props}
        />

        {isPasswordType && allowTogglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center p-0.5 rounded transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default Input;

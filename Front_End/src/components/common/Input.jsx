import { useId } from "react";

function Input({
  id,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  error,
  name,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
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
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
                        w-full
                        ${Icon ? "pl-10" : "px-4"}
                        pr-4
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
      </div>

      {/* Error message */}
      {error && <p id={`${inputId}-error`} className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default Input;

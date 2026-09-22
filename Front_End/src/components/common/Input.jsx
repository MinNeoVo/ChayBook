function Input({
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  name,
  className = "",
  ...props
}) {
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
            border-gray-200
            bg-white
            text-sm
            text-gray-800
            placeholder:text-gray-400
            outline-none
            transition-all
            focus:border-chaybook-primary
            focus:ring-2
            focus:ring-chaybook-primary/20
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
}

export default Input;

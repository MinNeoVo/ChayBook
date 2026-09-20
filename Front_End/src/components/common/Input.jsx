import React from 'react';

/**
 * Component Input tái sử dụng linh hoạt:
 * - Hỗ trợ label, placeholder, type
 * - Hỗ trợ icon (Search, Lock, Mail, v.v.)
 * - Hỗ trợ tùy biến className bên ngoài truyền vào
 */
function Input({ 
  label, 
  type = "text", 
  placeholder, 
  icon: Icon, 
  value, 
  onChange, 
  className = "", 
  ...props 
}) {
  return (
    <div className="space-y-1 w-full">
      {/* Hiển thị label nếu được truyền vào */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Render Icon ở đầu ô Input nếu có */}
        {Icon && (
          <span className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full
            ${Icon ? 'pl-10' : 'px-4'} 
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
            focus:border-[#006b2c]
            focus:ring-2
            focus:ring-[#006b2c]/20
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
}

export default Input;
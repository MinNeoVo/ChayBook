function Input({ label, type = "text", placeholder }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold">{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-green-500
                "
      />
    </div>
  );
}
export default Input;

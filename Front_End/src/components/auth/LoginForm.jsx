import { useState } from "react";
import { Mail, Lock } from "lucide-react";

import Input from "../common/Input";

function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    // BƯỚC ĐẤU NỐI BACKEND
    console.log("Dữ liệu sẵn sàng gửi cho Backend API:", formData);

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="Enter your email"
        icon={Mail}
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="Enter your password"
        icon={Lock}
        value={formData.password}
        onChange={handleChange}
        required
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="rounded border-gray-300 text-chaybook-primary focus:ring-chaybook-primary"
          />
          Remember me
        </label>

        <a
          href="#"
          className="text-chaybook-primary hover:underline font-medium"
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-chaybook-primary hover:bg-chaybook-hover text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}

export default LoginForm;

import { useState } from "react";

import { Mail, Lock } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authServices";
import { useAuth } from "../../context/useAuth";

import Input from "../common/Input";

import Button from "../common/Button";

import SocialLogin from "./SocialLogin";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState({});

  const validateForm = () => {
    const newError = {};

    if (!formData.email.trim()) {
      newError.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newError.email = "Email không hợp lệ.";
    }

    if (!formData.password) {
      newError.password = "Vui lòng nhập mật khẩu.";
    }

    setError(newError);

    return Object.keys(newError).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError({});

    try {
      const data = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      login(data.user);
      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);

      if (error.status === 401) {
        setError({
          general: "Email hoặc mật khẩu không chính xác.",
        });
      } else if (error.status === 403) {
        setError({
          general: "Tài khoản của bạn đã bị vô hiệu hóa.",
        });
      } else {
        setError({
          general: error.message || "Đăng nhập thất bại.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Username */}
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Nhập email của bạn"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={error.email}
        />

        {/* Password */}
        <Input
          label="Mật khẩu"
          type="password"
          name="password"
          placeholder="Nhập mật khẩu"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={error.password}
        />
        {/* General Error Message */}
        {error.general && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error.general}
          </div>
        )}

        {/* Login */}
        <Button type="submit" size="md" className="w-full" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="mt-3 text-right">
        <Link to="/forgot-password" className="text-sm font-medium text-chaybook-primary hover:underline">Quên mật khẩu?</Link>
      </div>

      {/* Google + Facebook */}
      <SocialLogin />

      {/* Register */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Bạn chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-chaybook-primary hover:underline font-medium"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </>
  );
}

export default LoginForm;

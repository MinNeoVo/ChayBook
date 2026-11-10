import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser, verifyRegistration } from "../../services/authServices";

import Input from "../common/Input";
import Button from "../common/Button";
import SocialLogin from "./SocialLogin";

function RegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState({});

  const validateForm = () => {
    const newError = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newError.fullName = "Vui lòng nhập họ và tên.";
    } else if (formData.fullName.trim().length > 255) {
      newError.fullName = "Họ và tên không được vượt quá 255 ký tự.";
    }

    // Username
    if (!formData.username.trim()) {
      newError.username = "Vui lòng nhập tên người dùng.";
    } else if (!/^[a-z0-9_.]{3,50}$/.test(formData.username)) {
      newError.username =
        "Tên người dùng phải có từ 3–50 ký tự, chỉ gồm chữ thường, chữ số, dấu gạch dưới (_) hoặc dấu chấm (.).";
    }

    // Email
    if (!formData.email.trim()) {
      newError.email = "Vui lòng nhập email.";
    } else if (formData.email.trim().length > 255) {
      newError.email = "Email không được vượt quá 255 ký tự.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newError.email = "Email không hợp lệ.";
    }

    // Password
    if (!formData.password) {
      newError.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 8) {
      newError.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    } else if (formData.password.length > 72) {
      newError.password = "Mật khẩu không được vượt quá 72 ký tự.";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newError.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (formData.password !== formData.confirmPassword) {
      newError.confirmPassword = "Mật khẩu xác nhận không khớp.";
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

    // Clear error of current field while typing
    if (error[name]) {
      setError((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear general error
    if (error.general) {
      setError((prev) => ({
        ...prev,
        general: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError({});

    try {
      await registerUser({
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      setVerificationPending(true);
    } catch (error) {
      console.error("Registration failed:", error);

      const message = (
        error.message ||
        error.data?.message ||
        error.data?.detail ||
        ""
      ).toLowerCase();

      if (error.status === 409 && message.includes("username")) {
        setError({
          username: "Tên người dùng này đã được sử dụng.",
        });
      } else if (error.status === 409 && message.includes("email")) {
        setError({
          email: "Email này đã được đăng ký.",
        });
      } else {
        setError({
          general: error.message || "Đăng ký thất bại.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError({});
    try {
      await verifyRegistration(formData.email.trim(), verificationCode);
      navigate("/login", { replace: true, state: { successMessage: "Tạo tài khoản thành công! Vui lòng đăng nhập." } });
    } catch (err) {
      setError({ general: err.message || "Xác thực OTP thất bại." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {verificationPending ? (
      <form className="space-y-4" onSubmit={handleVerifyRegistration}>
        <p className="text-sm text-gray-600">Mã OTP gồm 6 chữ số đã được gửi đến {formData.email}. Mã có hiệu lực trong 10 phút. Tài khoản chỉ được tạo sau khi xác thực thành công.</p>
        {error.general && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error.general}</div>}
        <Input label="Mã OTP" type="text" name="otp" placeholder="000000" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <Button type="submit" size="md" className="w-full" disabled={isLoading || verificationCode.length !== 6}>{isLoading ? "Đang xác thực..." : "Xác thực và tạo tài khoản"}</Button>
      </form>
      ) : <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* General Error */}
        {error.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error.general}
          </div>
        )}

        {/* Full Name */}
        <Input
          label="Họ và tên"
          type="text"
          name="fullName"
          placeholder="Nhập họ và tên"
          icon={User}
          value={formData.fullName}
          onChange={handleChange}
          error={error.fullName}
        />

        {/* Username */}
        <Input
          label="Tên người dùng"
          type="text"
          name="username"
          placeholder="Nhập tên người dùng"
          icon={User}
          value={formData.username}
          onChange={handleChange}
          error={error.username}
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="Nhập email"
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
          placeholder="Tạo mật khẩu"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={error.password}
        />

        {/* Confirm Password */}
        <Input
          label="Xác nhận mật khẩu"
          type="password"
          name="confirmPassword"
          placeholder="Nhập lại mật khẩu"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={error.confirmPassword}
        />

        {/* Create Account */}
        <Button type="submit" size="md" className="w-full" disabled={isLoading}>
          {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>}

      {/* Google + Facebook */}
      <SocialLogin />

      {/* Login */}
      <div className="mt-6 border-t border-gray-200 pt-6 text-center">
        <p className="text-sm text-gray-500">
          Bạn đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-medium text-chaybook-primary hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </>
  );
}

export default RegisterForm;

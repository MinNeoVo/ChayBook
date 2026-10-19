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
      newError.fullName = "Full name is required";
    } else if (formData.fullName.trim().length > 255) {
      newError.fullName = "Full name must not exceed 255 characters";
    }

    // Username
    if (!formData.username.trim()) {
      newError.username = "Username is required";
    } else if (!/^[a-z0-9_.]{3,50}$/.test(formData.username)) {
      newError.username =
        "Username must be 3-50 characters and contain only lowercase letters, numbers, _ or .";
    }

    // Email
    if (!formData.email.trim()) {
      newError.email = "Email is required";
    } else if (formData.email.trim().length > 255) {
      newError.email = "Email must not exceed 255 characters";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newError.email = "Email is invalid";
    }

    // Password
    if (!formData.password) {
      newError.password = "Password is required";
    } else if (formData.password.length < 8) {
      newError.password = "Password must be at least 8 characters";
    } else if (formData.password.length > 72) {
      newError.password = "Password must not exceed 72 characters";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newError.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newError.confirmPassword = "Passwords do not match";
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
          username: "This username is already taken.",
        });
      } else if (error.status === 409 && message.includes("email")) {
        setError({
          email: "This email is already registered.",
        });
      } else {
        setError({
          general: error.message || "Registration failed.",
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
      navigate("/login", { replace: true, state: { successMessage: "Account created successfully! Please log in." } });
    } catch (err) {
      setError({ general: err.message || "OTP verification failed." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {verificationPending ? (
      <form className="space-y-4" onSubmit={handleVerifyRegistration}>
        <p className="text-sm text-gray-600">We sent a 6-digit OTP to {formData.email}. It expires in 10 minutes. Your account will only be created after successful verification.</p>
        {error.general && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error.general}</div>}
        <Input label="Email OTP" type="text" name="otp" placeholder="000000" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <Button type="submit" size="md" className="w-full" disabled={isLoading || verificationCode.length !== 6}>{isLoading ? "Verifying..." : "Verify and create account"}</Button>
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
          label="Full Name"
          type="text"
          name="fullName"
          placeholder="Enter your full name"
          icon={User}
          value={formData.fullName}
          onChange={handleChange}
          error={error.fullName}
        />

        {/* Username */}
        <Input
          label="Username"
          type="text"
          name="username"
          placeholder="Enter your username"
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
          placeholder="Enter your email"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={error.email}
        />

        {/* Password */}
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Create your password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={error.password}
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={error.confirmPassword}
        />

        {/* Create Account */}
        <Button type="submit" size="md" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>}

      {/* Google + Facebook */}
      <SocialLogin />

      {/* Login */}
      <div className="mt-6 border-t border-gray-200 pt-6 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-chaybook-primary hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </>
  );
}

export default RegisterForm;

import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import Input from "../common/Input";
import Button from "../common/Button";
import SocialLogin from "./SocialLogin";

function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({});

  const validateForm = () => {
    const newError = {};

    if (!formData.fullName.trim()) {
      newError.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newError.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newError.email = "Email is invalid";
    }

    if (!formData.password) {
      newError.password = "Password is required";
    } else if (formData.password.length < 6) {
      newError.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log("Dữ liệu sẵn sàng gửi cho Backend API:", formData);

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
      </form>

      {/* Google + Facebook */}
      <SocialLogin />

      {/* Login */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-chaybook-primary hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </>
  );
}

export default RegisterForm;

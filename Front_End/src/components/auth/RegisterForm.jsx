import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import { registerUser } from "../../services/authServices";

import Input from "../common/Input";
import Button from "../common/Button";
import SocialLogin from "./SocialLogin";

function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const data = await registerUser({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      console.log("Registration successful:", data);

      alert("Account created successfully!");
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
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

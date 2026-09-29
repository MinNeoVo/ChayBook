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
      newError.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newError.email = "Email is invalid";
    }

    if (!formData.password) {
      newError.password = "Password is required";
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
          general: "Incorrect email or password.",
        });
      } else if (error.status === 403) {
        setError({
          general: "Your account has been disabled.",
        });
      } else {
        setError({
          general: error.message || "Login failed.",
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
          placeholder="Enter your password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={error.password}
        />

        {/* Login */}
        <Button type="submit" size="md" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      {/* Google + Facebook */}
      <SocialLogin />

      {/* Register */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-chaybook-primary hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </>
  );
}

export default LoginForm;

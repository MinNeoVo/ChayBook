import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import Input from '../components/common/Input';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // BƯỚC ĐẤU NỐI BACKEND: Chuẩn bị gửi request POST /api/auth/login
    console.log('Dữ liệu sẵn sàng gửi cho Backend API:', formData);

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back!
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Please enter your details to sign in
        </p>

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
                className="rounded border-gray-300 text-[#006b2c] focus:ring-[#006b2c]"
              />
              Remember me
            </label>
            <a href="#" className="text-[#006b2c] hover:underline font-medium">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
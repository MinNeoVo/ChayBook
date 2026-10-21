import RegisterForm from "../components/auth/RegisterForm";

function RegisterPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Tạo tài khoản
        </h1>

        <p className="text-center text-gray-500 mb-6 text-sm">
          Tham gia ChayBook và bắt đầu hành trình sống khỏe
        </p>

        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;

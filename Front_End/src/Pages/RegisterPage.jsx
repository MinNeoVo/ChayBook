import RegisterForm from "../components/auth/RegisterForm";

function RegisterPage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
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

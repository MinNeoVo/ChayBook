import RegisterForm from "../components/auth/RegisterForm";

function RegisterPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Create an Account
        </h1>

        <p className="text-center text-gray-500 mb-6 text-sm">
          Join ChayBook and start your healthy journey
        </p>

        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;

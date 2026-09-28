import LoginForm from "../components/auth/LoginForm";

function LoginPage() {
  return (
    <div className=" w-full  flex items-stretch  justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back!
        </h1>

        <p className="text-center text-gray-500 mb-6 text-sm">
          Please enter your details to sign in
        </p>

        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;

import LoginForm from "../components/auth/LoginForm";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const successMessage = location.state?.successMessage || "";

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      navigate("/login", {
        replace: true,
        state: null,
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage, navigate]);

  return (
    <div className="flex w-full flex-col items-center justify-center p-4">
      {/* SUCCESS BANNER */}
      {successMessage && (
        <div className="mb-5 w-full max-w-md rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      {/* LOGIN CARD */}
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Welcome Back!
        </h1>

        <p className="mb-6 text-center text-sm text-gray-500">
          Please enter your details to sign in
        </p>

        <LoginForm />
      </div>

      {/* TEST BUTTON
      <button
        type="button"
        className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        onClick={() =>
          navigate("/login", {
            state: {
              successMessage: "Account created successfully! Please log in.",
            },
          })
        }
      >
        Test Success Banner
      </button> */}
    </div>
  );
}

export default LoginPage;

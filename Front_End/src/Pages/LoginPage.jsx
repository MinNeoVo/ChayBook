import Input from "../components/common/Input";
function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <h1>Welcome Back!</h1>

      <Input label="Email" placeholder="Enter your email" />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
      />

      <button>Login</button>
    </div>
  );
}

export default LoginPage;

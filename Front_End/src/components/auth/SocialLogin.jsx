import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

import Button from "../common/Button";

function SocialLogin() {
  return (
    <>
      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-200"></div>

        <span className="text-sm text-gray-400 whitespace-nowrap">
          or continue with
        </span>

        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Google + Facebook */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <Button
          type="button"
          variant="outline"
          size="md"
          className="flex items-center justify-center gap-2"
        >
          <FcGoogle className="text-xl" />

          <span>Google</span>
        </Button>

        {/* Facebook */}
        <Button
          type="button"
          variant="outline"
          size="md"
          className="flex items-center justify-center gap-2"
        >
          <FaFacebook className="text-xl text-[#1877F2]" />

          <span>Facebook</span>
        </Button>
      </div>
    </>
  );
}

export default SocialLogin;

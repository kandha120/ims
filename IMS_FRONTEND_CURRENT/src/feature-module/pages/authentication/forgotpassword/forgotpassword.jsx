import { Link } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { iatlogo, logoWhitePng } from "../../../../utils/imagepath";

const Forgotpassword = () => {
  const route = all_routes;

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={iatlogo} alt="Logo" className="h-24" />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Forgot password?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            If you forgot your password, we’ll email you instructions to reset
            it.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-4 pr-12 py-2 border rounded-xl text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="ti ti-mail"></i>
              </span>
            </div>
          </div>

          {/* Send Reset Instructions Button */}
          <Link
            to={route.signin}
            className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-xl transition duration-300"
          >
            Send Reset Instructions
          </Link>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300 dark:border-gray-700" />
          <span className="mx-3 text-gray-400">OR</span>
          <hr className="flex-grow border-gray-300 dark:border-gray-700" />
        </div>

        {/* Return to Login */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          Return to{" "}
          <Link to={route.signin} className="text-orange-500 hover:underline">
            login
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-gray-400 text-xs">
          © 2025 iatsolutionsPOS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Forgotpassword;

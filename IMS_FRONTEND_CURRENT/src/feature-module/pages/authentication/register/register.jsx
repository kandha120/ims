import { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import {
  appleLogo,
  facebookLogo,
  googleLogo,
  iatlogo,
  logoWhite,
} from "../../../../utils/imagepath";

const Register = () => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

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
            Register
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Create New iatsolutionsPOS Account
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full pl-4 pr-12 py-2 border rounded-xl text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="ti ti-user"></i>
              </span>
            </div>
          </div>

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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={passwordVisibility.password ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full pl-4 pr-12 py-2 border rounded-xl text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700"
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => togglePasswordVisibility("password")}
              >
                {passwordVisibility.password ? (
                  <i className="ti ti-eye"></i>
                ) : (
                  <i className="ti ti-eye-off"></i>
                )}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={passwordVisibility.confirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="w-full pl-4 pr-12 py-2 border rounded-xl text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700"
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => togglePasswordVisibility("confirmPassword")}
              >
                {passwordVisibility.confirmPassword ? (
                  <i className="ti ti-eye"></i>
                ) : (
                  <i className="ti ti-eye-off"></i>
                )}
              </span>
            </div>
          </div>

          {/* Terms & Checkbox */}
          <div className="flex items-center text-sm">
            <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span>
                I agree to the{" "}
                <Link to="#" className="text-orange-500 hover:underline">
                  Terms & Privacy
                </Link>
              </span>
            </label>
          </div>

          {/* Sign Up Button */}
          <Link
            to={route.signin}
            className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-xl transition duration-300"
          >
            Sign Up
          </Link>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300 dark:border-gray-700" />
          <span className="mx-3 text-gray-400">OR</span>
          <hr className="flex-grow border-gray-300 dark:border-gray-700" />
        </div>

        {/* Social Buttons */}
        <div className="flex justify-center gap-3">
          <Link
            to="#"
            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            <img src={facebookLogo} alt="Facebook" className="h-5 w-5 mr-2" />
            Facebook
          </Link>
          <Link
            to="#"
            className="flex-1 flex items-center justify-center py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          >
            <img src={googleLogo} alt="Google" className="h-5 w-5 mr-2" />
            Google
          </Link>
          <Link
            to="#"
            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-black hover:bg-gray-900 text-white transition"
          >
            <img src={appleLogo} alt="Apple" className="h-5 w-5 mr-2" />
            Apple
          </Link>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to={route.signin} className="text-orange-500 hover:underline">
            Sign In Instead
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

export default Register;

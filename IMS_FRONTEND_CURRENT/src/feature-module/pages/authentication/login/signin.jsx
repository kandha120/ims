import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../../routes/all_routes";
import { toast } from "react-toastify";
import { iatlogo } from "../../../../utils/imagepath";
import baseapi from "../../../../env/baseapi";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [admin] = useState("Admin"); // You can make this dynamic if needed

  const navigate = useNavigate();
  const route = all_routes;

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch(`${baseapi}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // needed for cookies
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        toast.error(data.message || `Login failed with status: ${response.status}`);
        return;
      }

      toast.success("Login successful!");
      navigate(route.newdashboard || "/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network or server error. Please check if the backend is running.");
    }
  };


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
            Sign In
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Access the iatsolutionsPOS panel using your email and password.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-4 pr-12 py-2 border rounded-xl text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700"
                required
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
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-4 pr-12 py-2 border rounded-xl text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700"
                required
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? (
                  <i className="ti ti-eye"></i>
                ) : (
                  <i className="ti ti-eye-off"></i>
                )}
              </span>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span>Remember me</span>
            </label>
            <Link
              to={route.forgotPassword}
              className="text-orange-500 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-xl transition duration-300"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signin;
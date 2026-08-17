import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call backend login
    fetch("http://localhost:8200/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: username, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(async () => {
        // fetch current user
        const meRes = await fetch("http://localhost:8200/auth/me", { credentials: "include" });
        if (!meRes.ok) throw new Error("Failed to fetch user");
        const data = await meRes.json();
        localStorage.setItem("ims_user", JSON.stringify({ email: data.email, role: data.role }));
        if (data.role === "admin" || data.role === "superadmin") navigate("/admin/users");
        else if (data.role === "manager") navigate("/index");
        else navigate("/index");
      })
      .catch((err) => {
        alert(err.message || "Login failed");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-base-100 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="input input-bordered w-full"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input input-bordered w-full"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
            <option value="superadmin">Super Admin</option>
          </select>

          <button className="btn btn-primary w-full" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

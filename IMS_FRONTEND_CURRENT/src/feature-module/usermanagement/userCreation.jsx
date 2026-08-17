import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import baseapi from "../../env/baseapi";

const UserCreation = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setFetching(true);
      const res = await fetch(`${baseapi}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Please provide both Username and Password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${baseapi}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: username.trim(),
          password: password,
          role: role,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Failed to create user.");
        return;
      }

      toast.success(`User "${username.trim()}" created successfully with role "${role}"!`);
      setUsername("");
      setPassword("");
      setRole("User");
      fetchUsers();
    } catch (err) {
      console.error("Create user error:", err);
      toast.error("Network or server error while creating user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user "${userEmail}"?`)) return;

    try {
      const res = await fetch(`${baseapi}/api/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("User deleted successfully.");
        fetchUsers();
      } else {
        toast.error("Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error("Error deleting user.");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>User Creation</h4>
              <h6>Create new system users with assigned roles</h6>
            </div>
          </div>
          <div className="page-btn">
            <Link to="/users" className="btn btn-added">
              <i className="ti ti-users me-1" />
              View All Users
            </Link>
          </div>
        </div>

        {/* User Creation Form Card */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title text-white mb-0">
              <i className="ti ti-user-plus me-2"></i>New User Form
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser}>
              <div className="row g-3">
                {/* Username Field */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Username / Email <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-user" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. john@example.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-lock" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`ti ${showPassword ? "ti-eye" : "ti-eye-off"}`} />
                    </button>
                  </div>
                </div>

                {/* Role Field (Admin & User) */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Role <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-shield" />
                    </span>
                    <select
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="Admin">Admin</option>
                      <option value="User">User</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="col-12 text-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-circle-check me-1" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Users Table Card */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">System Users ({users.length})</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchUsers}>
              <i className="ti ti-refresh me-1" />
              Refresh
            </button>
          </div>
          <div className="card-body">
            {fetching ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No users found. Create one above!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Username / Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td className="fw-semibold">{u.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === "Admin" || u.role === "admin" || u.role === "ROLE_ADMIN"
                                ? "bg-danger"
                                : "bg-info"
                            }`}
                          >
                            {u.role || "User"}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success">Active</span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            title="Delete User"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCreation;

import { useState } from "react";
import { toast } from "react-toastify";
import baseapi from "../../../env/baseapi";

const AddUsers = ({ onUserAdded }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Please enter both Username and Password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${baseapi}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: username.trim(),
          password: password,
          role: role,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Failed to create user");
        return;
      }

      toast.success(`User "${username.trim()}" created successfully with role "${role}"!`);
      setUsername("");
      setPassword("");
      setRole("User");
      if (onUserAdded) onUserAdded();

      // Dismiss bootstrap modal
      const modal = document.getElementById("add-units");
      if (modal) {
        const dismissBtn = modal.querySelector('[data-bs-dismiss="modal"]');
        if (dismissBtn) dismissBtn.click();
      }
    } catch (err) {
      console.error(err);
      toast.error("Network or server error while creating user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Add User Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered custom-modal-two">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Add User</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Username / Email <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter username or email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Role <span className="text-danger">*</span></label>
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

                      <div className="col-lg-12">
                        <div className="input-blocks">
                          <label>Password <span className="text-danger">*</span></label>
                          <div className="pass-group">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="form-control pass-input"
                              placeholder="Enter password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                            <span
                              className={`ti toggle-password text-gray-9 ${
                                showPassword ? "ti-eye" : "ti-eye-off"
                              }`}
                              onClick={handleTogglePassword}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit" disabled={loading}>
                        {loading ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUsers;
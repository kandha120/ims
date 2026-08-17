import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AddUsers from "../../core/modals/usermanagement/addusers";
import EditUser from "../../core/modals/usermanagement/edituser";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import Table from "../../core/pagination/datatable";
import baseapi from "../../env/baseapi";
import { toast } from "react-toastify";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseapi}/api/users`);
      if (res.ok) {
        const data = await res.json();
        const formatted = (Array.isArray(data) ? data : []).map((u) => ({
          key: u.id,
          id: u.id,
          username: u.email,
          email: u.email,
          role: u.role || "User",
          status: "Active",
        }));
        setUsers(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
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
    } catch (e) {
      console.error(e);
      toast.error("Error deleting user.");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Username / Email",
      dataIndex: "username",
      render: (text) => <span className="fw-semibold">{text}</span>,
      sorter: (a, b) => (a.username || "").localeCompare(b.username || ""),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (text) => (
        <span
          className={`badge ${
            text === "Admin" || text === "admin" || text === "ROLE_ADMIN"
              ? "bg-danger"
              : "bg-info"
          }`}
        >
          {text || "User"}
        </span>
      ),
      sorter: (a, b) => (a.role || "").localeCompare(b.role || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <span className="d-inline-flex align-items-center p-1 pe-2 rounded-1 text-white bg-success fs-10">
          <i className="ti ti-point-filled me-1 fs-11"></i>
          {text}
        </span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <button
              className="btn btn-sm text-danger"
              onClick={() => handleDelete(record.id)}
              title="Delete User"
            >
              <i data-feather="trash-2" className="feather-trash-2" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>User List</h4>
                <h6>Manage Your Users</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <li onClick={fetchUsers} style={{ cursor: "pointer" }}>
                <RefreshIcon />
              </li>
              <CollapesIcon />
            </ul>
            <div className="page-btn d-flex gap-2">
              <Link to="/user-creation" className="btn btn-secondary">
                <i className="ti ti-user-plus me-1"></i>
                User Creation Form
              </Link>
              <Link
                to="#"
                className="btn btn-added"
                data-bs-toggle="modal"
                data-bs-target="#add-units"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add New User
              </Link>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="mt-2 text-muted">Loading users...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table columns={columns} dataSource={users} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddUsers onUserAdded={fetchUsers} />
      <EditUser />
    </div>
  );
};

export default Users;
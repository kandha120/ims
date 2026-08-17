import React, { useEffect, useState } from "react";

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", email: "", role: "user", password: "" });

  useEffect(() => {
    fetch("http://localhost:8200/api/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  const addUser = () => {
    if (!form.email || !form.password) return alert("Email and password required");

    const payload = {
      email: form.email,
      password: form.password,
      role: form.role,
    };

    fetch(`http://localhost:8200/api/users/register?warehouseId=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((newUser) => {
        // refetch list
        return fetch("http://localhost:8200/api/users", { credentials: "include" });
      })
      .then((res) => res.json())
      .then((list) => {
        setUsers(list);
        setForm({ username: "", email: "", role: "user", password: "" });
      })
      .catch((err) => alert("Failed to add user"));
  };

  const removeUser = (id) => {
    fetch(`http://localhost:8200/api/users/${id}`, { method: "DELETE", credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        setUsers((prev) => prev.filter((u) => u.id !== id));
      })
      .catch((e) => alert(e.message));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">User Management</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="input input-bordered"
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input input-bordered"
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="select select-bordered"
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>

        <button className="btn btn-primary" onClick={addUser}>
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button className="btn btn-sm btn-error" onClick={() => removeUser(u.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersAdmin;

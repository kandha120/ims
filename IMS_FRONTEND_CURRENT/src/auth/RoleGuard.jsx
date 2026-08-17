import React from "react";
import { Navigate } from "react-router-dom";

const RoleGuard = ({ allowedRoles = [], children }) => {
  const raw = localStorage.getItem("ims_user");
  if (!raw) return <Navigate to="/admin/login" replace />;
  try {
    const user = JSON.parse(raw);
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return (
        <div className="p-6">
          <h3 className="text-lg font-semibold">Access denied</h3>
          <p className="text-sm text-base-content/70">You do not have permission to view this page.</p>
        </div>
      );
    }
    return children;
  } catch (e) {
    return <Navigate to="/admin/login" replace />;
  }
};

export default RoleGuard;

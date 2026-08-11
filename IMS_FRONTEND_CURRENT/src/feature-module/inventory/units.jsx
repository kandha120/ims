import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import baseapi from "../../env/baseapi";

export const Units = () => {
  // Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [units, setUnits] = useState([]);

  // Forms
  const [addForm, setAddForm] = useState({ unit: "", status: true });
  const [editForm, setEditForm] = useState({ id: null, unit: "", status: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // === FETCH UNITS ===
  const fetchUnits = async () => {
    try {
      const res = await fetch(`${baseapi}/api/units`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch units");
      const data = await res.json();

      const mapped = (data || []).map(item => ({
        id: item.id,
        unit: item.unit,
        status: item.status === "active" || item.status === "Active" ? "Active" : "Inactive"
      }));

      setUnits(mapped);
      setTotalRecords(mapped.length);
    } catch (err) {
      // toast.error("Failed to load units");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // === ADD UNIT ===
  const handleAdd = async () => {
    const unitName = addForm.unit?.trim();
    if (!unitName) {
      setError("Unit name required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        unit: unitName,
        status: addForm.status ? "Active" : "Inactive"
      };

      const res = await fetch(`${baseapi}/api/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to add unit");

      const newItem = await res.json();
      const mapped = {
        id: newItem.id,
        unit: newItem.unit,
        status: newItem.status
      };

      setUnits(prev => [mapped, ...prev]);
      setTotalRecords(prev => prev + 1);
      setAddForm({ unit: "", status: true });
      toast.success("Unit added!");
      closeModal("add-units");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === EDIT MODAL ===
  const openEditModal = (row) => {
    setEditForm({
      id: row.id,
      unit: row.unit,
      status: row.status === "Active"
    });
    openModal("edit-units");
  };

  // === UPDATE UNIT ===
  const handleUpdate = async () => {
    const unitName = editForm.unit?.trim();
    if (!unitName) {
      setError("Unit name required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        unit: unitName,
        status: editForm.status ? "Active" : "Inactive"
      };

      const res = await fetch(`${baseapi}/api/units/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update unit");

      const updatedItem = await res.json();
      const mapped = {
        id: updatedItem.id,
        unit: updatedItem.unit,
        status: updatedItem.status
      };

      setUnits(prev => prev.map(u => u.id === mapped.id ? mapped : u));
      toast.success("Unit updated!");
      closeModal("edit-units");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === DELETE UNIT ===
  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseapi}/api/units/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete unit");

      setUnits(units.filter((u) => u.id !== deleteId));
      setTotalRecords((prev) => prev - 1);
      toast.success("Unit deleted successfully");
      closeModal("delete-unit-modal");
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === PAGINATION DATA ===
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rows;
    return units.slice(start, start + rows).map((item, i) => ({
      ...item,
      sno: start + i + 1,
    }));
  }, [units, currentPage, rows]);

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Unit List", 14, 22);

    const tableColumn = ["Unit", "Status"];
    const tableRows = units.map((item) => [
      item.unit,
      item.status,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("UnitList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Unit", "Status"],
      ...units.map((item) => [
        `"${item.unit || ""}"`,
        item.status,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "UnitList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === COLUMNS ===
  const columns = [
    {
      header: "S.No",
      field: "sno",
      sortable: false,
    },
    {
      field: "unit",
      header: "Unit of Measurement",
      sortable: true
    },
    {
      field: "status",
      header: "Status",
      sortable: true,
      body: (rowData) => (
        <span className={`badge table-badge ${rowData.status === "Active" ? "bg-success" : "bg-danger"} fw-medium fs-10`}>
          {rowData.status}
        </span>
      )
    },
    {
      header: "Action",
      field: "actions",
      sortable: false,
      body: (row) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            className="text-primary hover-scale me-2"
            to="#"
            onClick={() => openEditModal(row)}
            title="Edit"
          >
            <FiEdit size={20} />
          </Link>
          <Link
            className="text-danger hover-scale"
            to="#"
            onClick={() => {
              setDeleteId(row.id);
              openModal("delete-unit-modal");
            }}
            title="Delete"
          >
            <FiTrash2 size={20} />
          </Link>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Units of Measurement</h4>
                <h6>Manage your units</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchUnits}
            />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                onClick={() => openModal("add-units")}>
                <i className="ti ti-circle-plus me-1"></i> Add Unit
              </Link>
            </div>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={paginatedData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords} />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Unit Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Unit</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    onClick={() => closeModal("add-units")}
                    aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <form>
                    <div className="mb-3">
                      <label className="form-label">
                        Unit<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.unit}
                        onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="unit-status-add"
                          className="check"
                          checked={addForm.status}
                          onChange={(e) => setAddForm({ ...addForm, status: e.target.checked })}
                        />
                        <label htmlFor="unit-status-add" className="checktoggle" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    onClick={() => closeModal("add-units")}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={handleAdd}
                    disabled={loading}>
                    {loading ? "Adding..." : "Add Unit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Unit Modal */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit Unit</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    onClick={() => closeModal("edit-units")}
                    aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <form>
                    <div className="mb-3">
                      <label className="form-label">
                        Unit<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="unit-status-edit"
                          className="check"
                          checked={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.checked })}
                        />
                        <label htmlFor="unit-status-edit" className="checktoggle" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    onClick={() => closeModal("edit-units")}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={handleUpdate}
                    disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="delete-unit-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content p-5 px-3 text-center">
                <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                  <i className="ti ti-trash fs-24 text-danger" />
                </span>
                <h4 className="mb-0 delete-account-font">
                  Are you sure you want to delete this unit?
                </h4>
                <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    onClick={() => closeModal("delete-unit-modal")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={confirmDelete}
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
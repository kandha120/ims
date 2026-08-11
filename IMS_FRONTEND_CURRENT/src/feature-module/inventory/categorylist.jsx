import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import baseapi from "../../env/baseapi";
import { toast } from "react-toastify";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload } from "react-icons/fi";

// Format Date
const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return "—";
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return "—";
  }
};

const CategoryList = () => {
  const dispatch = useDispatch();

  // Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [categories, setCategories] = useState([]);

  // Add Form
  const [addForm, setAddForm] = useState({ name: "", status: true });
  const [editForm, setEditForm] = useState({ id: null, name: "", status: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // === GET ALL CATEGORIES ===
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${baseapi}/api/categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const list = data.data || data || [];

      const mapped = list.map((item) => ({
        id: item.id,
        category: item.name || "—",

        status: item.status === "active" || item.status === 1 ? "Active" : "Inactive",
      }));

      setCategories(mapped);
      setTotalRecords(mapped.length);
      dispatch({ type: "SET_CATEGORY_LIST", payload: mapped });
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [dispatch]);

  // === GET BY ID (FOR EDIT) ===
  const fetchCategoryById = async (id) => {
    try {
      const res = await fetch(`${baseapi}/api/categories/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Not found");

      const data = await res.json();
      return {
        id: data.id,
        name: data.name || "",
        status: data.status === "active" || data.status === 1,
      };
    } catch (err) {
      toast.error("Failed to load category");
      throw err;
    }
  };

  // === ADD CATEGORY ===
  const handleAdd = async () => {
    const name = addForm.name?.trim();
    if (!name) {
      setError("Name required");
      return;
    }

    const payload = { name, status: addForm.status ? "active" : "inactive" };

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${baseapi}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Add failed");

      const newCat = await res.json();

      const mapped = {
        id: newCat.id,
        category: newCat.name,
        status: newCat.status === "active" ? "Active" : "Inactive",
      };

      setCategories((prev) => [mapped, ...prev]);
      setTotalRecords((prev) => prev + 1);
      setAddForm({ name: "", status: true });
      toast.success("Added!");
      closeModal("add-category");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === OPEN EDIT MODAL ===
  const openEditModal = async (id) => {
    try {
      const cat = await fetchCategoryById(id);
      setEditForm(cat);
      openModal("edit-category");
    } catch (err) {
      console.error(err);
    }
  };

  // === UPDATE CATEGORY (PUT) ===
  const handleUpdate = async () => {
    const name = editForm.name?.trim();
    if (!name) {
      setError("Name required");
      return;
    }

    const payload = { name, status: editForm.status ? "active" : "inactive" };

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${baseapi}/api/categories/${editForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      const updated = await res.json();

      const mapped = {
        id: updated.id,
        category: updated.name,
        status: updated.status === "active" ? "Active" : "Inactive",
      };

      setCategories((prev) =>
        prev.map((c) => (c.id === editForm.id ? mapped : c))
      );
      toast.success("Updated!");
      closeModal("edit-category");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === DELETE CATEGORY ===
  const [deleteId, setDeleteId] = useState(null);

  const openDeleteModal = (id) => {
    setDeleteId(id);
    openModal("delete-modal");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`${baseapi}/api/categories/${deleteId}`, {
        method: "DELETE",
        headers: {
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      setTotalRecords((prev) => prev - 1);
      toast.success("Deleted!");
      closeModal("delete-modal");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownloadRowPDF = (row) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Category Details", 14, 20);

    doc.setFontSize(12);
    doc.text(`Category: ${row.category || "N/A"}`, 14, 30);
    doc.text(`Status: ${row.status || "N/A"}`, 14, 40);

    doc.save(`Category_${row.category || "doc"}.pdf`);
  };

  // === PAGINATION ===
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rows;
    return categories.slice(start, start + rows).map((item, i) => ({
      ...item,
      sno: start + i + 1,
    }));
  }, [categories, currentPage, rows]);

  // === COLUMNS ===
  const columns = [
    { header: "S.No", field: "sno", style: { width: "10%" } },
    { header: "Category", field: "category", sortable: true, style: { width: "40%" } },

    {
      header: "Status",
      style: { width: "20%" },
      body: (row) => (
        <span className={`badge ${row.status === "Active" ? "bg-success" : "bg-danger"}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      style: { width: "30%" },
      body: (row) => (
        <div className="d-flex gap-1">
          <button
            className="btn btn-sm btn-white me-2"
            onClick={() => handleDownloadRowPDF(row)}
            title="Download PDF"
          >
            <FiDownload className="text-success" size={20} />
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => {
              setEditForm({ id: row.id, name: row.category, status: row.status === 'Active' });
              openModal("edit-category");
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => openDeleteModal(row.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];


  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Category List", 14, 22);

    const tableColumn = ["S.No", "Category", "Status"];
    const tableRows = categories.map((item, index) => [
      index + 1,
      item.category,
      item.status,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("CategoryList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "Category", "Status"],
      ...categories.map((item, index) => [
        index + 1,
        `"${item.category}"`, // Quote strings to handle commas
        item.status
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "CategoryList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid">
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Category</h4>
                <h6>Manage your categories</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchCategories}
            />
            <div className="page-btn">
              <button
                className="btn btn-primary"
                onClick={() => openModal("add-category")}
              >
                Add Category
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <PrimeDataTable
                column={columns}
                data={paginatedData}
                rows={rows}
                setRows={setRows}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={totalRecords}
              />
            </div>
          </div>
        </div>

        {/* ADD MODAL */}
        <div className="modal fade" id="add-category">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Category</h5>
                <button type="button" className="btn-close" onClick={() => closeModal("add-category")} />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Status</span>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.checked })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => closeModal("add-category")}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAdd}
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EDIT MODAL – WITH CREATED DATE */}
        <div className="modal fade" id="edit-category">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Category</h5>
                <button type="button" className="btn-close" onClick={() => closeModal("edit-category")} />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span>Status</span>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.checked })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => closeModal("edit-category")}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DELETE MODAL */}
        <div className="modal fade" id="delete-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Confirm Delete</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this category?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => closeModal("delete-modal")}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
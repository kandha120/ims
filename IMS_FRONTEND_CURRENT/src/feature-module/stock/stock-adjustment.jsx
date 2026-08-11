import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CommonSelect from "../../components/select/common-select";
import CommonFooter from "../../components/footer/commonFooter";
import { toast } from "react-toastify";

// API roots
const API_ROOT = "http://localhost:8200/api";
const STOCK_API = `${API_ROOT}/adjustment`;
const WAREHOUSE_API = `${API_ROOT}/warehouses`;
const PRODUCT_BY_WAREHOUSE_API = `${API_ROOT}/stock/by-warehouse`; // Fetches from AddStock table

const getCSRFToken = () => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, 9) === 'csrftoken=') {
        cookieValue = decodeURIComponent(cookie.substring(9));
        break;
      }
    }
  }
  return cookieValue;
};

const StockAdjustment = () => {
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);

  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(true);
  const [errorWarehouse, setErrorWarehouse] = useState(null);

  // Dynamic products based on selected warehouse
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [viewNotesText, setViewNotesText] = useState("");

  const [addForm, setAddForm] = useState({
    product_name: "",
    warehouse: "",
    reference_number: "",
    store: "electro",
    person: "",
    quantity: 0,
    currentQty: 0, // Added field
    notes: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const [editForm, setEditForm] = useState({
    adjustment_id: null,
    product_name: "",
    warehouse: "",
    reference_number: "",
    store: "electro",
    person: "",
    quantity: 0,
    notes: "",
    type: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Warehouse options (static)
  const warehouseOptions = [
    { value: "", label: "Choose Warehouse" },
    ...warehouses.map((w) => ({ value: w.name ?? "", label: w.name ?? "Unnamed" })),
  ];

  // Dynamic product options
  const productOptions = [
    { value: "", label: addForm.warehouse || editForm.warehouse ? "Choose Product" : "Choose Warehouse" },
    ...products.map((p) => {
      const name = p.productName ?? p.product_name ?? p.name ?? "";
      return { value: name, label: name || "Unknown Product" };
    }),
  ];

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Adjustment List", 14, 22);

    const tableColumn = ["S.No", "Warehouse", "Product", "Ref No", "Person", "Qty"];
    const tableRows = listData.map((item) => [
      item.id,
      item.warehouse,
      item.product_name,
      item.reference_number,
      item.person,
      item.quantity,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("StockAdjustmentList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "Warehouse", "Product", "Ref No", "Person", "Qty"],
      ...listData.map((item) => [
        item.id,
        `"${item.warehouse || ""}"`,
        `"${item.product_name || ""}"`,
        `"${item.reference_number || ""}"`,
        `"${item.person || ""}"`,
        item.quantity,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "StockAdjustmentList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: (
        <label className="checkboxs">
          <input type="checkbox" id="select-all" />
          <span className="checkmarks" />
        </label>
      ),
      body: () => (
        <label className="checkboxs">
          <input type="checkbox" />
          <span className="checkmarks" />
        </label>
      ),
      sortable: false,
    },
    { header: "S.No", field: "id" },
    { header: "Warehouse", field: "warehouse" },
    {
      header: "Product",
      field: "product_name",
      body: (data) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2"></Link>
          <Link to="#">{data?.product_name || "Unknown Product"}</Link>
        </div>
      ),
    },
    { header: "Reference Number", field: "reference_number" },
    {
      header: "Person",
      field: "person",
      body: (data) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2"></Link>
          <Link to="#">{data?.person || "Unknown Person"}</Link>
        </div>
      ),
    },
    { header: "Qty", field: "quantity" },
    {
      header: "Action",
      field: "actions",
      sortable: false,
      body: (row) => (
        <div className="d-flex align-items-center edit-delete-action">
          <Link
            className="me-2 border rounded d-flex align-items-center p-2"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleViewNotes(row);
            }}
          >
            <i className="feather icon-file-text" />
          </Link>
          <Link
            className="me-2 border rounded d-flex align-items-center p-2"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleEditClick(row);
            }}
          >
            <i className="feather icon-edit" />
          </Link>
          <Link
            className="p-2 border rounded d-flex align-items-center"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDeleteClick(row);
            }}
          >
            <i className="feather icon-trash-2" />
          </Link>
        </div>
      ),
    },
  ];

  // Fetch adjustments
  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${STOCK_API}/all`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json().catch(() => []);
      const adjustments = (Array.isArray(data) ? data : []).map((item, index) => ({
        id: index + 1,
        adjustment_id: item.id,
        warehouse: item.warehouse ?? item.warehouseName ?? "",
        store: "electro",
        product_name: item.productName || item.product_name || item.name || "",
        person: item.responsiblePerson || item.person || "",
        quantity: item.quantity ?? 0,
        notes: item.notes || "",
        reference_number: item.referenceNumber || item.reference_number || "",
        type: item.type || "addition",
      }));
      setListData(adjustments);
      setTotalRecords(adjustments.length);
    } catch (err) {
      console.error("fetchAdjustments error:", err);
      setError(err.message || String(err));
      toast.error(`Error loading adjustments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouse(true);
      const res = await fetch(WAREHOUSE_API, { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch warehouses (${res.status})`);
      const result = await res.json().catch(() => []);
      setWarehouses(Array.isArray(result) ? result : result.warehouses || []);
    } catch (err) {
      console.error("fetchWarehouses error:", err);
      setErrorWarehouse(err.message || String(err));
      setWarehouses([]);
    } finally {
      setLoadingWarehouse(false);
    }
  };

  // Fetch products by selected warehouse
  const fetchProductsByWarehouse = async (warehouseName) => {
    if (!warehouseName) {
      setProducts([]);
      return;
    }
    try {
      setLoadingProducts(true);
      const url = `${PRODUCT_BY_WAREHOUSE_API}/${encodeURIComponent(warehouseName)}`;
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        toast.error("Failed to load products for this warehouse");
        setProducts([]);
        return;
      }
      const result = await res.json().catch(() => []);
      const productList = Array.isArray(result) ? result : result.products || result.data || [];
      setProducts(productList);
    } catch (err) {
      console.error("fetchProductsByWarehouse error:", err);
      toast.error("Error loading products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAdjustments();
    fetchWarehouses();
  }, []);

  // Load products when warehouse changes in Add modal
  useEffect(() => {
    if (showAddModal) {
      fetchProductsByWarehouse(addForm.warehouse);
    }
  }, [addForm.warehouse, showAddModal]);

  // Load products when warehouse changes in Edit modal
  useEffect(() => {
    if (showEditModal && editForm.warehouse) {
      fetchProductsByWarehouse(editForm.warehouse);
    }
  }, [editForm.warehouse, showEditModal]);

  // Delete handler - Fixed with body + CSRF
  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !deletingItem.adjustment_id) return;

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      };

      const response = await fetch(`${STOCK_API}/delete/${deletingItem.adjustment_id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
        body: JSON.stringify({}), // This fixes 400 error in many backends
        cache: "no-store",
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Delete failed (${response.status})`);
      }

      toast.success("Adjustment deleted successfully!");
      await fetchAdjustments();
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete adjustment");
    }
  };

  // Add handlers
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSelectChange = (field, selectedOption) => {
    const newVal = selectedOption?.value ?? "";

    // Calculate current quantity if product changes
    let currentQty = addForm.currentQty;
    let quantityAlert = addForm.quantityAlert;
    if (field === "product_name") {
      const selectedProduct = products.find(p => (p.productName ?? p.product_name ?? p.name) === newVal);
      currentQty = selectedProduct?.quantity ?? 0;
      quantityAlert = Number(selectedProduct?.quantityAlert ?? selectedProduct?.quantity_alert ?? selectedProduct?.alertQuantity ?? 0);
    }

    setAddForm((prev) => ({
      ...prev,
      [field]: newVal,
      currentQty: field === "product_name" ? currentQty : prev.currentQty,
      ...(field === "warehouse" ? { product_name: "", currentQty: 0 } : {}), // Reset product on warehouse change
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    if (!addForm.warehouse) return toast.error("Please select a Warehouse");
    if (!addForm.product_name) return toast.error("Please select a Product");
    if (!addForm.person?.trim()) return toast.error("Please enter Responsible Person");
    if (!addForm.quantity || Number(addForm.quantity) === 0) return toast.error("Enter valid quantity (non-zero)");

    const payload = {
      warehouse: addForm.warehouse,
      responsiblePerson: addForm.person,
      productName: addForm.product_name,
      quantity: Number(addForm.quantity),
      referenceNumber: addForm.reference_number || "",
      notes: addForm.notes || "",
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      };

      const res = await fetch(`${STOCK_API}/add`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Add failed");
      }

      // === UPDATE STOCK IN MANAGE STOCK ===
      try {
        // Fetch all stock to find the correct ID and current quantity
        const stockRes = await fetch(`${API_ROOT}/stock/all`, {
          credentials: "include",
          cache: "no-store",
        });

        let targetStockId = null;
        let currentStockQty = 0;
        let isNewStock = true;

        if (stockRes.ok) {
          const stockData = await stockRes.json().catch(() => []);
          const allStocks = Array.isArray(stockData) ? stockData : (stockData.data || []);

          const matchingStock = allStocks.find(s =>
            (s.warehouse === addForm.warehouse || s.warehouseName === addForm.warehouse) &&
            (s.productName === addForm.product_name || s.product_name === addForm.product_name)
          );

          if (matchingStock) {
            targetStockId = matchingStock.id;
            currentStockQty = Number(matchingStock.quantity || 0);
            isNewStock = false;
          }
        }

        const adjustQty = Number(addForm.quantity);
        const newQty = currentStockQty + adjustQty;

        const stockPayload = {
          warehouse: addForm.warehouse,
          responsiblePerson: addForm.person,
          productName: addForm.product_name,
          quantity: newQty,
          referenceNumber: addForm.reference_number,
          notes: addForm.notes
        };

        if (isNewStock) {
          // If stock doesn't exist, create it
          await fetch(`${API_ROOT}/stock/add`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCSRFToken(),
            },
            credentials: "include",
            body: JSON.stringify(stockPayload)
          });
        } else {
          // If stock exists, update it
          await fetch(`${API_ROOT}/stock/update/${targetStockId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCSRFToken(),
            },
            credentials: "include",
            body: JSON.stringify(stockPayload)
          });
        }
      } catch (stockErr) {
        console.error("Failed to update stock level:", stockErr);
        toast.warning("Adjustment saved, but stock level update failed.");
      }
      // ====================================

      toast.success("Adjustment added successfully!");
      setAddForm({
        product_name: "",
        warehouse: "",
        reference_number: "",
        person: "",
        quantity: 0,
        currentQty: 0,
        notes: "",
      });
      setProducts([]);
      setShowAddModal(false);
      await fetchAdjustments();
    } catch (err) {
      toast.error(err.message || "Error adding adjustment");
    } finally {
      setIsAdding(false);
    }
  };

  // Edit handlers
  const handleEditClick = (item) => {
    setEditForm({
      adjustment_id: item.adjustment_id,
      product_name: item.product_name || "",
      warehouse: item.warehouse || "",
      reference_number: item.reference_number || "",
      person: item.person || "",
      quantity: item.quantity || 0,
      notes: item.notes || "",
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (field, selectedOption) => {
    const newVal = selectedOption?.value ?? "";
    setEditForm((prev) => ({
      ...prev,
      [field]: newVal,
      ...(field === "warehouse" ? { product_name: "" } : {}),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);

    if (!editForm.warehouse) return toast.error("Select warehouse");
    if (!editForm.product_name) return toast.error("Select product");
    if (!editForm.person?.trim()) return toast.error("Enter person");
    if (!editForm.quantity || Number(editForm.quantity) === 0) return toast.error("Valid quantity required (non-zero)");

    const payload = {
      warehouse: editForm.warehouse,
      responsiblePerson: editForm.person,
      productName: editForm.product_name,
      quantity: Number(editForm.quantity),
      referenceNumber: editForm.reference_number || "",
      notes: editForm.notes || "",
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      };

      const res = await fetch(`${STOCK_API}/update/${editForm.adjustment_id}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Adjustment updated!");
      setShowEditModal(false);
      await fetchAdjustments();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsEditing(false);
    }
  };

  const handleViewNotes = (item) => {
    setViewNotesText(item.notes || "No notes available.");
    setShowNotesModal(true);
  };

  const globalLoading = loading || loadingWarehouse;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-center justify-content-between">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Stock Adjustment</h4>
                <h6>Manage your stock adjustment</h6>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <TableTopHead
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onRefresh={fetchAdjustments}
              />
              <div className="page-btn">
                <Link
                  to="#"
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAddModal(true);
                  }}
                >
                  <i className="ti ti-circle-plus me-1" />
                  Add Adjustment
                </Link>
              </div>
            </div>
          </div>

          {globalLoading ? (
            <div className="card">
              <div className="card-body p-3 text-center">
                <div className="spinner-border" role="status" />
                <p className="mt-2">Loading data...</p>
              </div>
            </div>
          ) : error || errorWarehouse ? (
            <div className="card">
              <div className="card-body p-3">
                <div className="alert alert-danger">
                  Error: {error || errorWarehouse}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <PrimeDataTable
                    column={columns}
                    data={listData}
                    rows={rows}
                    setRows={setRows}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalRecords={totalRecords}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <CommonFooter />
      </div>

      {/* Add Modal */}
      <div className={`modal fade stock-adjust-modal ${showAddModal ? "show d-block" : ""}`} style={{ display: showAddModal ? "block" : "none" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add Adjustment</h4>
              <button type="button" className="close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Warehouse <span className="text-danger">*</span></label>
                  <CommonSelect
                    options={warehouseOptions}
                    value={addForm.warehouse}
                    onChange={(opt) => handleAddSelectChange("warehouse", opt)}
                    placeholder="Select Warehouse"
                  />
                </div>
                <div className="mb-3">
                  <label>Product Name <span className="text-danger">*</span></label>
                  <CommonSelect
                    options={productOptions}
                    value={addForm.product_name}
                    onChange={(opt) => handleAddSelectChange("product_name", opt)}
                    placeholder="Select Product"
                    filter
                    isDisabled={!addForm.warehouse}
                    isLoading={loadingProducts}
                  />
                </div>
                <div className="mb-3">
                  <label>Reference Number</label>
                  <input type="text" name="reference_number" className="form-control" value={addForm.reference_number} onChange={handleAddInputChange} />
                </div>
                <div className="mb-3">
                  <label>Current Stock</label>
                  <input type="text" className="form-control" value={addForm.currentQty} disabled readOnly />
                </div>
                <div className="mb-3">
                  <label>Quantity <span className="text-danger">*</span></label>
                  <input type="number" name="quantity" className="form-control" value={addForm.quantity} onChange={handleAddInputChange} required />
                </div>
                <div className="mb-3">
                  <label>Responsible Person <span className="text-danger">*</span></label>
                  <input type="text" name="person" className="form-control" value={addForm.person} onChange={handleAddInputChange} required />
                </div>
                <div className="mb-3">
                  <label>Notes</label>
                  <textarea name="notes" className="form-control" value={addForm.notes} onChange={handleAddInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary me-2" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? "Creating..." : "Create Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className={`modal fade stock-adjust-modal ${showEditModal ? "show d-block" : ""}`} style={{ display: showEditModal ? "block" : "none" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Edit Adjustment</h4>
              <button type="button" className="close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Warehouse</label>
                  <CommonSelect
                    options={warehouseOptions}
                    value={editForm.warehouse}
                    onChange={(opt) => handleEditSelectChange("warehouse", opt)}
                  />
                </div>
                <div className="mb-3">
                  <label>Product Name</label>
                  <CommonSelect
                    options={productOptions}
                    value={editForm.product_name}
                    onChange={(opt) => handleEditSelectChange("product_name", opt)}
                    filter
                    isDisabled={!editForm.warehouse}
                    isLoading={loadingProducts}
                  />
                </div>
                <div className="mb-3">
                  <label>Reference Number</label>
                  <input type="text" name="reference_number" className="form-control" value={editForm.reference_number} onChange={handleEditInputChange} />
                </div>
                <div className="mb-3">
                  <label>Responsible Person</label>
                  <input type="text" name="person" className="form-control" value={editForm.person} onChange={handleEditInputChange} required />
                </div>
                <div className="mb-3">
                  <label>Notes</label>
                  <textarea name="notes" className="form-control" value={editForm.notes} onChange={handleEditInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary me-2" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isEditing}>
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* View Notes & Delete Modals remain same */}
      <div className={`modal fade ${showNotesModal ? "show d-block" : ""}`} style={{ display: showNotesModal ? "block" : "none" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Notes</h4>
              <button type="button" className="close" onClick={() => setShowNotesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>{viewNotesText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${showDeleteModal ? "show d-block" : ""}`} style={{ display: showDeleteModal ? "block" : "none" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="content p-5 px-3 text-center">
              <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                <i className="ti ti-trash fs-24 text-danger" />
              </span>
              <h4>Are you sure you want to delete this adjustment?</h4>
              <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                <button type="button" className="btn me-2 btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StockAdjustment;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import TableTopHead from "../../components/table-top-head";
import CommonSelect from "../../components/select/common-select";
import CommonFooter from "../../components/footer/commonFooter";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = "http://localhost:8200/api";
const STOCK_API = `${API_BASE_URL}/stock`;
const WAREHOUSES_API = `${API_BASE_URL}/warehouses`;

const getAuthHeaders = () => {
  return { Accept: "*/*" };
};

const ManageStock = () => {
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);

  const [loadingWarehouse, setLoadingWarehouse] = useState(true);
  const [errorWarehouse, setErrorWarehouse] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // Edit states
  const [editingItem, setEditingItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Add states
  const [addForm, setAddForm] = useState({
    warehouse: "",
    person: "",
    product_name: "",
    quantity: "",
    quantity_alert: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit form (separate from add)
  const [editForm, setEditForm] = useState({
    warehouse: "",
    person: "",
    product_name: "",
    quantity: "",
  });

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Stock List", 14, 22);

    const tableColumn = ["S.No", "Warehouse", "Product", "Person", "Quantity"];
    const tableRows = listData.map((item) => [
      item.id,
      item.warehouse,
      item.product_name,
      item.person,
      item.quantity,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("StockList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "Warehouse", "Product", "Person", "Quantity"],
      ...listData.map((item) => [
        item.id,
        `"${item.warehouse || ""}"`,
        `"${item.product_name || ""}"`,
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
    link.setAttribute("download", "StockList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns - Date removed, Edit icon added before Delete
  const columns = [
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
      header: "Actions",
      field: "actions",
      sortable: false,
      body: (row) => (
        <div className="d-flex align-items-center edit-delete-action">
          {/* Edit Icon */}
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
          {/* Delete Icon */}
          <Link
            className="me-2 border rounded d-flex align-items-center p-2"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setDeletingItem(row);
              setShowDeleteConfirm(true);
            }}
          >
            <i className="feather icon-trash-2" />
          </Link>
        </div>
      ),
    },
  ];

  async function safeFetch(url, opts = {}) {
    const finalOpts = {
      method: opts.method || "GET",
      headers: { ...(opts.headers || {}) },
      credentials: "include",
    };
    if (opts.body) finalOpts.body = opts.body;
    finalOpts.cache = "no-store";

    console.log("Request:", url, finalOpts);
    const res = await fetch(url, finalOpts).catch((err) => {
      console.error("Network fetch failed:", url, err);
      throw err;
    });
    console.log("Response status:", res.status, url);

    const text = await res.text().catch(() => "");
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      json = text;
    }
    return { res, json, status: res.status, ok: res.ok };
  }

  // Fetch warehouses
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingWarehouse(true);
        setErrorWarehouse(null);
        const { res, json } = await safeFetch(WAREHOUSES_API);
        if (!res.ok) throw new Error(`Failed to fetch warehouses (${res.status})`);
        setWarehouses(Array.isArray(json) ? json : json?.warehouses || []);
      } catch (err) {
        console.error("fetchWarehouses error:", err);
        setErrorWarehouse(err?.message || String(err));
        setWarehouses([]);
      } finally {
        if (mounted) setLoadingWarehouse(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const url = `${API_BASE_URL}/products`;
      const { res, json } = await safeFetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load products");
      const productList = Array.isArray(json) ? json : json?.products || json?.data || [];
      setProducts(productList);
    } catch (err) {
      console.error("fetchProducts error:", err);
      toast.error("Could not load products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch stocks
  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const { res, json } = await safeFetch(`${STOCK_API}/all`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(`Auth error (${res.status})`);
        }
        throw new Error(`HTTP error: ${res.status}`);
      }
      const arr = Array.isArray(json) ? json : json?.data || json?.stocks || [];
      const stocks = (arr || []).map((s, idx) => ({
        id: idx + 1,
        stock_id: s.id ?? s.stock_id ?? null,
        warehouse: s.warehouse ?? s.warehouseName ?? "",
        product_name: s.productName ?? s.product_name ?? s.name ?? "",
        person: s.responsiblePerson ?? s.person ?? "",
        quantity: s.quantity ?? 0,
      }));
      setListData(stocks);
      setTotalRecords(stocks.length);
    } catch (err) {
      console.error("fetchStocks error:", err);
      setError(err?.message || String(err));
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Handle Edit Click
  const handleEditClick = (row) => {
    setEditingItem(row);
    setEditForm({
      warehouse: row.warehouse,
      person: row.person,
      product_name: row.product_name,
      quantity: row.quantity,
      quantity_alert: row.quantityAlert || "",
    });
    // Load products for this warehouse

    openModal("edit-stock");
  };

  // Edit form handlers
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleEditSelectChange = (field, value) => {
    setEditForm((p) => ({ ...p, [field]: value }));
    if (field === "warehouse") {
      setEditForm((p) => ({ ...p, product_name: "" })); // Reset product if warehouse changes
    }
  };

  // Submit Edit
  const handleEditSubmit = async (ev) => {
    ev.preventDefault();
    if (!editingItem?.stock_id) return;

    setIsEditing(true);
    setEditError("");
    try {
      if (!editForm.warehouse) throw new Error("Select warehouse");
      if (!editForm.product_name) throw new Error("Select product");
      if (!editForm.person) throw new Error("Enter person");
      if (!editForm.quantity || Number(editForm.quantity) <= 0) throw new Error("Enter valid quantity");

      const payload = {
        warehouse: editForm.warehouse,
        responsiblePerson: editForm.person,
        productName: editForm.product_name,
        quantity: Number(editForm.quantity),
        quantityAlert: Number(editForm.quantity_alert),
      };

      const url = `${STOCK_API}/update/${editingItem.stock_id}`;
      const { res, json } = await safeFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Update failed (${res.status}) ${json?.message || ""}`);

      toast.success("Stock updated successfully");
      await fetchStocks();
      setEditingItem(null);
      // Close modal
      closeModal("edit-stock");
    } catch (err) {
      console.error("Edit error:", err);
      setEditError(err?.message || "Update failed");
      toast.error(err?.message || "Update failed");
    } finally {
      setIsEditing(false);
    }
  };

  // Add handlers (unchanged)
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddForm((p) => ({ ...p, [name]: value }));
  };

  const handleAddSelectChange = (field, value) => {
    setAddForm((p) => ({ ...p, [field]: value }));
  };

  const handleAddSubmit = async (ev) => {
    ev.preventDefault();
    setIsAdding(true);
    setAddError("");
    try {
      if (!addForm.warehouse) throw new Error("Select a warehouse");
      if (!addForm.product_name) throw new Error("Select a product");
      if (!addForm.person) throw new Error("Enter person");
      if (!addForm.quantity || Number(addForm.quantity) <= 0) throw new Error("Enter valid quantity");

      const payload = {
        warehouse: addForm.warehouse,
        responsiblePerson: addForm.person,
        productName: addForm.product_name,
        quantity: Number(addForm.quantity),
        quantityAlert: Number(addForm.quantity_alert),
      };

      const { res, json } = await safeFetch(`${STOCK_API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Add failed (${res.status}) ${json?.message || ""}`);

      toast.success("Stock added");
      setAddForm({ warehouse: "", person: "", product_name: "", quantity: "", quantity_alert: "" });
      await fetchStocks();
      closeModal("add-stock");
    } catch (err) {
      console.error("Add error:", err);
      setAddError(err?.message || String(err));
      toast.error(err?.message || "Add failed");
    } finally {
      setIsAdding(false);
    }
  };

  // Delete handler (unchanged)
  const handleDeleteConfirm = async () => {
    if (!deletingItem?.stock_id) {
      setShowDeleteConfirm(false);
      setDeletingItem(null);
      return;
    }
    try {
      const url = `${STOCK_API}/delete/${deletingItem.stock_id}`;
      const { res, json } = await safeFetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Deleted");
      await fetchStocks();
      setShowDeleteConfirm(false);
      setDeletingItem(null);
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const globalLoading = loading || loadingWarehouse;
  const hasForbidden = (error || errorWarehouse)?.toString().includes("403") || (error || errorWarehouse)?.toString().includes("401");

  if (globalLoading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="page-title">
              <h4>Manage Stock</h4>
              <h6>Manage your stock</h6>
            </div>
            <TableTopHead />
          </div>
          <div className="card">
            <div className="card-body p-3 text-center">
              <div className="spinner-border" role="status" />
              <p className="mt-2">Loading...</p>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    );
  }

  if (hasForbidden || error || errorWarehouse) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="page-title">
              <h4>Manage Stock</h4>
              <h6>Manage your stock</h6>
            </div>
            <TableTopHead />
          </div>
          <div className="card">
            <div className="card-body p-3">
              <div className="alert alert-danger">
                Error: {error || errorWarehouse}
                <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchStocks}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-center justify-content-between">
            <div>
              <h4>Manage Stock</h4>
              <h6>Manage your stock</h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              <TableTopHead
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onRefresh={fetchStocks}
              />
              <Link to="#" className="btn btn-primary" onClick={() => openModal("add-stock")}>
                <i className="ti ti-circle-plus me-1" />
                Add Stock
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi callback={() => { }} rows={rows} setRows={setRows} />
            </div>

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
        </div>
        <CommonFooter />
      </div>

      {/* Add Stock Modal */}
      <div className="modal fade" id="add-stock">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Stock</h4>
              </div>
              <button type="button" className="close" onClick={() => closeModal("add-stock")} aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {addError && <div className="alert alert-danger mb-3">{addError}</div>}
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Product name</label>
                      <CommonSelect
                        className="w-100"
                        options={[
                          { value: "", label: "Choose Product" },
                          ...Array.from(new Set(products.map((p) => p.product_name ?? p.productName ?? p.name)))
                            .filter(Boolean)
                            .map((name) => ({
                              value: name,
                              label: name,
                            })),
                        ]}
                        value={addForm.product_name}
                        onChange={(opt) => handleAddSelectChange("product_name", opt?.value ?? "")}
                        placeholder="Choose Product"
                        filter
                        isLoading={loadingProducts}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Responsible Person</label>
                      <input
                        type="text"
                        className="form-control"
                        name="person"
                        value={addForm.person}
                        onChange={handleAddInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Warehouse</label>
                      <CommonSelect
                        className="w-100"
                        options={[{ value: "", label: "Choose Warehouse" }, ...warehouses.map((w) => ({ value: w.name, label: w.name }))]}
                        value={addForm.warehouse}
                        onChange={(opt) => handleAddSelectChange("warehouse", opt?.value ?? "")}
                        placeholder="Choose Warehouse"
                        filter={false}
                        isDisabled={!addForm.product_name}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        className="form-control"
                        value={addForm.quantity}
                        onChange={handleAddInputChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Quantity Alert</label>
                      <input
                        type="number"
                        name="quantity_alert"
                        className="form-control"
                        value={addForm.quantity_alert}
                        onChange={handleAddInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary me-2" onClick={() => closeModal("add-stock")}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Stock Modal */}
      <div className="modal fade" id="edit-stock">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Stock</h4>
              </div>
              <button type="button" className="close" onClick={() => closeModal("edit-stock")} aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {editError && <div className="alert alert-danger mb-3">{editError}</div>}
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Warehouse</label>
                      <CommonSelect
                        className="w-100"
                        options={[{ value: "", label: "Choose Warehouse" }, ...warehouses.map((w) => ({ value: w.name, label: w.name }))]}
                        value={editForm.warehouse}
                        onChange={(opt) => handleEditSelectChange("warehouse", opt?.value ?? "")}
                        placeholder="Choose Warehouse"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Responsible Person</label>
                      <input
                        type="text"
                        className="form-control"
                        name="person"
                        value={editForm.person}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Product name</label>
                      <CommonSelect
                        className="w-100"
                        options={[
                          { value: "", label: "Choose Product" },
                          ...Array.from(new Set(products.map((p) => p.product_name ?? p.productName ?? p.name)))
                            .filter(Boolean)
                            .map((name) => ({
                              value: name,
                              label: name,
                            })),
                        ]}
                        value={editForm.product_name}
                        onChange={(opt) => handleEditSelectChange("product_name", opt?.value ?? "")}
                        placeholder="Choose Product"
                        filter
                        isLoading={loadingProducts}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        className="form-control"
                        value={editForm.quantity}
                        onChange={handleEditInputChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Quantity Alert</label>
                      <input
                        type="number"
                        name="quantity_alert"
                        className="form-control"
                        value={editForm.quantity_alert}
                        onChange={handleEditInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary me-2" onClick={() => closeModal("edit-stock")}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isEditing}>
                  {isEditing ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingItem && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this stock entry?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default ManageStock;
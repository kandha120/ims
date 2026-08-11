import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { downloadImg } from "../../utils/imagepath";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = "http://localhost:8200/api";
const ENDPOINTS = {
  STOCK_ALL: `${API_BASE_URL}/transfer/all`,
  STOCK_ADD: `${API_BASE_URL}/transfer/add`,
  STOCK_UPDATE: (id) => `${API_BASE_URL}/transfer/update/${id}`,
  STOCK_DELETE: (id) => `${API_BASE_URL}/transfer/delete/${id}`,
  STOCK_BY_ID: (id) => `${API_BASE_URL}/transfer/${id}`,
  WAREHOUSES: `${API_BASE_URL}/warehouses`,
  // Fetch actual stock entries (AddStock) which have accurate quantity for the warehouse
  PRODUCTS_BY_WAREHOUSE: (name) => `${API_BASE_URL}/stock/by-warehouse/${encodeURIComponent(name)}`,
};

const buildHeaders = (extra = {}) => {
  const base = { Accept: "*/*", ...extra };
  const csrf = getCSRFToken();
  if (csrf) base["X-CSRFToken"] = csrf;
  return base;
};

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

async function safeFetch(url, opts = {}) {
  const finalOpts = {
    method: opts.method || "GET",
    headers: { ...(opts.headers || {}), ...buildHeaders() },
    credentials: "include",
    cache: "no-store",
  };
  if (opts.body) finalOpts.body = opts.body;
  console.log("[safeFetch] Request =>", url, finalOpts);
  let res;
  try {
    res = await fetch(url, finalOpts);
  } catch (err) {
    console.error("[safeFetch] Network error:", err);
    throw err;
  }
  const status = res.status;
  const ok = res.ok;
  let text = "";
  let json = null;
  try {
    text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
  } catch (e) { }
  console.log("[safeFetch] Response =>", url, { status, ok, json, text });
  return { res, status, ok, json, text };
}



const StockTransfer = () => {
  const [allData, setAllData] = useState([]);
  const [listData, setListData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [addForm, setAddForm] = useState({
    warehouseFrom: "",
    warehouseTo: "",
    referenceNumber: "",
    productName: "",
    quantity: 0,
    currentStock: 0,
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    id: null,
    warehouseFrom: "",
    warehouseTo: "",
    referenceNumber: "",
    productName: "",
    quantity: 0,
    currentStock: 0,
    notes: "",
  });

  // Static warehouses
  const [warehouses, setWarehouses] = useState([]);
  // Dynamic products based on selected "From" warehouse
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [errorWarehouses, setErrorWarehouses] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const getWarehouseName = (id) => {
    if (!id) return "";
    const found = warehouses.find((w) => String(w.id) === String(id) || w.name === id);
    return found ? (found.name || found.warehouse) : id;
  };

  const getProductName = (id) => {
    if (!id) return "";
    const found = products.find((p) => String(p.id) === String(id) || p.productName === id || p.product_name === id);
    return found ? (found.productName || found.product_name || found.name) : id;
  };

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Transfer List", 14, 22);

    const tableColumn = ["S.No", "Ref No", "Warehouse From", "Warehouse To", "Product", "Quantity"];
    const tableRows = listData.map((item, index) => [
      index + 1,
      item.referenceNumber,
      getWarehouseName(item.warehouseFrom),
      getWarehouseName(item.warehouseTo),
      getProductName(item.productName),
      item.quantity,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("StockTransferList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "Ref No", "Warehouse From", "Warehouse To", "Product", "Quantity"],
      ...listData.map((item, index) => [
        index + 1,
        `"${item.referenceNumber || ""}"`,
        `"${getWarehouseName(item.warehouseFrom) || ""}"`,
        `"${getWarehouseName(item.warehouseTo) || ""}"`,
        `"${getProductName(item.productName) || ""}"`,
        item.quantity,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "StockTransferList.csv");
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
      key: "checked",
    },
    {
      header: "S.No",
      key: "sno",
      body: (rowData, { rowIndex }) => rowIndex + 1,
    },
    { header: "Reference No", field: "referenceNumber", key: "referenceNumber" },
    {
      header: "Warehouse From",
      key: "warehouseFrom",
      body: (row) => getWarehouseName(row.warehouseFrom)
    },
    {
      header: "Warehouse To",
      key: "warehouseTo",
      body: (row) => getWarehouseName(row.warehouseTo)
    },
    {
      header: "Product",
      key: "productName",
      body: (row) => getProductName(row.productName)
    },
    { header: "Quantity", field: "quantity", key: "quantity" },
    {
      header: "Action",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (rowData) => (
        <div className="edit-delete-action d-flex align-items-center justify-content-center gap-2">
          <Link
            className="p-2 border rounded d-flex align-items-center"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setEditForm({
                id: rowData.id,
                warehouseFrom: rowData.warehouseFrom ?? "",
                warehouseTo: rowData.warehouseTo ?? "",
                referenceNumber: rowData.referenceNumber ?? "",
                productName: rowData.productName ?? "",
                quantity: rowData.quantity ?? 0,
                notes: rowData.notes ?? "",
              });
              openModal("edit-stock-transfer");
            }}
          >
            <i className="feather icon-edit text-primary fs-18" />
          </Link>
          <Link
            className="p-2 border rounded d-flex align-items-center"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setSelectedId(rowData.id);
              openModal("delete-modal");
            }}
          >
            <i className="feather icon-trash-2 text-danger fs-18" />
          </Link>
        </div>
      ),
    },
  ];

  // Load static warehouses
  useEffect(() => {
    let mounted = true;
    const loadWarehouses = async () => {
      try {
        setErrorWarehouses(null);
        const { ok, json, status, text } = await safeFetch(ENDPOINTS.WAREHOUSES);
        if (!ok) throw new Error(`Failed to fetch warehouses (${status})`);
        const list = Array.isArray(json) ? json : json?.warehouses ?? json?.data ?? [];
        if (mounted) setWarehouses(list);
      } catch (err) {
        console.error("warehouses load error:", err);
        if (mounted) {
          setWarehouses([]);
          setErrorWarehouses(String(err?.message || err));
        }
      }
    };
    loadWarehouses();
    return () => (mounted = false);
  }, []);

  // Fetch products when "From Warehouse" changes (Add modal)
  useEffect(() => {
    const fetchProducts = async () => {
      if (!addForm.warehouseFrom) {
        setProducts([]);
        return;
      }
      try {
        setLoadingProducts(true);
        const url = ENDPOINTS.PRODUCTS_BY_WAREHOUSE(addForm.warehouseFrom);
        const { ok, json } = await safeFetch(url);
        if (!ok) {
          toast.error("Failed to load products for selected warehouse");
          setProducts([]);
          return;
        }
        const list = Array.isArray(json) ? json : json?.products ?? json?.data ?? [];
        setProducts(list);
      } catch (err) {
        console.error("products load error:", err);
        toast.error("Error loading products");
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [addForm.warehouseFrom]);

  // Fetch products when editing and warehouseFrom changes
  useEffect(() => {
    const fetchEditProducts = async () => {
      if (!editForm.warehouseFrom) {
        setProducts([]);
        return;
      }
      try {
        setLoadingProducts(true);
        const url = ENDPOINTS.PRODUCTS_BY_WAREHOUSE(editForm.warehouseFrom);
        const { ok, json } = await safeFetch(url);
        if (!ok) {
          setProducts([]);
          return;
        }
        const list = Array.isArray(json) ? json : json?.products ?? json?.data ?? [];
        setProducts(list);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    if (editForm.id) fetchEditProducts();
  }, [editForm.warehouseFrom, editForm.id]);

  // Fetch all transfers
  const fetchAllStocks = async () => {
    setLoading(true);
    try {
      const { ok, json, status, text } = await safeFetch(ENDPOINTS.STOCK_ALL);
      if (!ok) throw new Error(`Failed to fetch transfers (${status})`);
      const arr = Array.isArray(json) ? json : json?.data ?? [];
      const mapped = arr.map((item, idx) => ({
        ...item,
        id: item.id || idx + 1,
        warehouseFrom: item.warehouseFrom ?? "",
        warehouseTo: item.warehouseTo ?? "",
        referenceNumber: item.referenceNumber ?? "",
        productName: item.productName ?? "",
        quantity: item.quantity ?? 0,
        notes: item.notes ?? "",
      }));
      setAllData(mapped);
    } catch (err) {
      console.error("Error fetching transfers:", err);
      toast.error(err.message || "Failed to fetch transfers");
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStocks();
  }, []);

  // Client-side search & pagination
  useEffect(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const filtered = q
      ? allData.filter((r) => {
        return (
          String(r.warehouseFrom ?? "").toLowerCase().includes(q) ||
          String(r.warehouseTo ?? "").toLowerCase().includes(q) ||
          String(r.productName ?? "").toLowerCase().includes(q) ||
          String(r.referenceNumber ?? "").toLowerCase().includes(q)
        );
      })
      : allData.slice();

    const total = filtered.length;
    const from = (currentPage - 1) * rowsPerPage;
    const pageSlice = filtered.slice(from, from + rowsPerPage);
    setListData(pageSlice);
    setTotalRecords(total);
  }, [allData, searchQuery, currentPage, rowsPerPage]);

  const warehouseOptions = [
    { value: "", label: "Choose Warehouse" },
    ...warehouses.map((w) => ({
      value: w.name ?? w.id ?? "",
      label: w.name ?? w.warehouse ?? "Unnamed",
    })),
  ];

  const productOptions = [
    { value: "", label: addForm.warehouseFrom || editForm.warehouseFrom ? "Choose Product" : "First select Warehouse From" },
    ...products.map((p) => ({
      value: p.productName ?? p.product_name ?? p.name ?? p.id ?? "",
      label: p.productName ?? p.product_name ?? p.name ?? "Unknown",
    })),
  ];

  // Add handlers
  const handleAddFormChange = (field, value) => {
    const final = value && typeof value === "object" ? value.value ?? value : value;

    let currentStock = addForm.currentStock;
    if (field === "productName") {
      const foundProd = products.find(p => (p.productName ?? p.product_name ?? p.name ?? p.id) === final);
      currentStock = foundProd ? (foundProd.quantity ?? 0) : 0;
    }

    setAddForm((p) => ({
      ...p,
      [field]: field === "quantity" ? Number(final) || 0 : final,
      currentStock: field === "productName" ? currentStock : p.currentStock,
      ...(field === "warehouseFrom" ? { productName: "", currentStock: 0 } : {}),
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.warehouseFrom || !addForm.warehouseTo || !addForm.productName || Number(addForm.quantity) <= 0) {
      toast.error("Please fill From/To warehouses, product and valid quantity");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        warehouseFrom: addForm.warehouseFrom,
        warehouseTo: addForm.warehouseTo,
        referenceNumber: addForm.referenceNumber || "",
        productName: addForm.productName,
        quantity: Number(addForm.quantity),
        notes: addForm.notes || "",
      };
      const { ok, status, text } = await safeFetch(ENDPOINTS.STOCK_ADD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!ok) throw new Error(`Create failed (${status})`);
      toast.success("Stock transfer created.");
      await fetchAllStocks();
      setAddForm({ warehouseFrom: "", warehouseTo: "", referenceNumber: "", productName: "", quantity: 0, currentStock: 0, notes: "" });
      setProducts([]);
      closeModal("add-stock-transfer");
    } catch (err) {
      toast.error(err.message || "Create failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handlers
  const handleEditChange = (field, value) => {
    const final = value && typeof value === "object" ? value.value ?? value : value;
    setEditForm((p) => ({
      ...p,
      [field]: field === "quantity" ? Number(final) || 0 : final,
      ...(field === "warehouseFrom" ? { productName: "" } : {}),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.warehouseFrom || !editForm.warehouseTo || !editForm.productName || Number(editForm.quantity) <= 0) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        warehouseFrom: editForm.warehouseFrom,
        warehouseTo: editForm.warehouseTo,
        referenceNumber: editForm.referenceNumber || "",
        productName: editForm.productName,
        quantity: Number(editForm.quantity),
        notes: editForm.notes || "",
      };
      const { ok, status } = await safeFetch(ENDPOINTS.STOCK_UPDATE(editForm.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!ok) throw new Error(`Update failed (${status})`);
      toast.success("Stock transfer updated.");
      await fetchAllStocks();
      closeModal("edit-stock-transfer");
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const { ok, status } = await safeFetch(ENDPOINTS.STOCK_DELETE(selectedId), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!ok) throw new Error(`Delete failed (${status})`);
      toast.success("Transfer deleted.");
      await fetchAllStocks();
      closeModal("delete-modal");
      setSelectedId(null);
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Stock Transfer</h4>
                <h6>Manage your stock transfer</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchAllStocks}
            />
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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-center justify-content-between">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Stock Transfer</h4>
                <h6>Manage your stock transfer</h6>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <TableTopHead
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onRefresh={fetchAllStocks}
              />
              <div className="page-btn">
                <Link to="#" className="btn btn-primary" onClick={() => openModal("add-stock-transfer")}>
                  <i className="ti ti-circle-plus me-1" />
                  Add New
                </Link>
              </div>
              <div className="page-btn import">
                <Link to="#" className="btn btn-secondary color" onClick={() => openModal("view-notes")}>
                  <i className="feather icon-download me-1" />
                  Import Transfer
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi callback={(val) => { setSearchQuery(val); setCurrentPage(1); }} rows={rowsPerPage} setRows={(r) => { setRowsPerPage(r); setCurrentPage(1); }} />
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link to="#" className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    Warehouse
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    {warehouseOptions.map((w) => <li key={w.value}><Link to="#" className="dropdown-item rounded-1">{w.label}</Link></li>)}
                  </ul>
                </div>
                <div className="dropdown">
                  <Link to="#" className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Recently Added</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Ascending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Descending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Last Month</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={listData}
                  rows={rowsPerPage}
                  setRows={setRowsPerPage}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="add-stock-transfer">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Add Stock Transfer</h4></div>
              <button type="button" className="close" data-bs-dismiss="modal"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Warehouse From <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={warehouseOptions}
                      value={addForm.warehouseFrom}
                      onChange={(opt) => handleAddFormChange("warehouseFrom", opt)}
                      placeholder="Select From Warehouse"
                      filter
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Warehouse To <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={warehouseOptions.filter(w => w.value !== addForm.warehouseFrom)}
                      value={addForm.warehouseTo}
                      onChange={(opt) => handleAddFormChange("warehouseTo", opt)}
                      placeholder="Select To Warehouse"
                      filter
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Product Name <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={productOptions}
                      value={addForm.productName}
                      onChange={(opt) => handleAddFormChange("productName", opt)}
                      placeholder="Select Product"
                      filter
                      isDisabled={!addForm.warehouseFrom}
                      isLoading={loadingProducts}
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Reference Number</label>
                    <input type="text" className="form-control" value={addForm.referenceNumber} onChange={(e) => handleAddFormChange("referenceNumber", e.target.value)} />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Current Stock</label>
                    <input type="text" className="form-control" value={addForm.currentStock} disabled readOnly />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Quantity <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" value={addForm.quantity} onChange={(e) => handleAddFormChange("quantity", e.target.value)} min="1" />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" value={addForm.notes} onChange={(e) => handleAddFormChange("notes", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button type="button" className="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-stock-transfer">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title"><h4>Edit Stock Transfer</h4></div>
              <button type="button" className="close" data-bs-dismiss="modal"><span aria-hidden="true">×</span></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Warehouse From <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={warehouseOptions}
                      value={editForm.warehouseFrom}
                      onChange={(opt) => handleEditChange("warehouseFrom", opt)}
                      placeholder="Select From Warehouse"
                      filter
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Warehouse To <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={warehouseOptions}
                      value={editForm.warehouseTo}
                      onChange={(opt) => handleEditChange("warehouseTo", opt)}
                      placeholder="Select To Warehouse"
                      filter
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Product Name <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={productOptions}
                      value={editForm.productName}
                      onChange={(opt) => handleEditChange("productName", opt)}
                      placeholder="Select Product"
                      filter
                      isDisabled={!editForm.warehouseFrom}
                      isLoading={loadingProducts}
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Reference Number</label>
                    <input type="text" className="form-control" value={editForm.referenceNumber} onChange={(e) => handleEditChange("referenceNumber", e.target.value)} />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Quantity <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" value={editForm.quantity} onChange={(e) => handleEditChange("quantity", e.target.value)} min="1" />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" value={editForm.notes} onChange={(e) => handleEditChange("notes", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button type="button" className="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Import & Delete Modals - unchanged */}
      <div className="modal fade" id="view-notes">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header"><div className="page-title"><h4>Import Transfer</h4></div>
              <button type="button" className="close" data-bs-dismiss="modal"><span aria-hidden="true">×</span></button>
            </div>
            <form>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label"> Upload CSV File</label>
                  <div className="image-upload download">
                    <input type="file" />
                    <div className="image-uploads"><img src={downloadImg} alt="img" /><h4>Drag and drop a <span>file to upload</span></h4></div>
                  </div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button><button type="submit" className="btn btn-primary">Submit</button></div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="content p-5 px-3 text-center">
              <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                <i className="ti ti-trash fs-24 text-danger" />
              </span>
              <h4>Are you sure you want to delete this transfer?</h4>
              <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                <button type="button" className="btn me-2 btn-secondary" onClick={() => { setSelectedId(null); closeModal("delete-modal"); }}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default StockTransfer;
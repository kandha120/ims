import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import { qrCodeImage, stockImg01 } from "../../utils/imagepath";
import CommonSelect from "../../components/select/common-select";
import { closeModal, fixBootstrapModal } from "../../utils/modal-cleanup";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import { Editor } from "primereact/editor";
import { toast } from "react-toastify";
import baseapi from "../../env/baseapi";

const PurchaseReturns = () => {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState(10);

  // Track which parent modal called "Add Supplier"
  const parentModalRef = useRef(null);

  // Form states for ADD modal
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [date, setDate] = useState(new Date());
  const [text, setText] = useState("");
  const [reference, setReference] = useState("");
  const [productSku, setProductSku] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(""); // For dropdown value
  const [selectedProductName, setSelectedProductName] = useState(""); // For filtering
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [orderTax, setOrderTax] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Form states for EDIT modal
  const [editId, setEditId] = useState(null);
  const [editSelectedSupplier, setEditSelectedSupplier] = useState("");
  const [editSelectedStatus, setEditSelectedStatus] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [editText, setEditText] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editProductSku, setEditProductSku] = useState("");
  const [editSelectedProductId, setEditSelectedProductId] = useState(""); // For dropdown value
  const [editQuantity, setEditQuantity] = useState(1);
  const [editCost, setEditCost] = useState(0);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editOrderTax, setEditOrderTax] = useState(0);
  const [editOrderDiscount, setEditOrderDiscount] = useState(0);
  const [editShipping, setEditShipping] = useState(0);

  // API data
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [errorSuppliers, setErrorSuppliers] = useState(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [stockData, setStockData] = useState([]);


  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Reusable fetch
  const fetchPurchaseReturns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseapi}/api/purchase-returns`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      console.log("purchase returns data", data);

      // Safe mapping of API response
      const returnsList = Array.isArray(data)
        ? data.map((item) => ({
          ...item,
          supplier: item.supplierName || item.supplier || "N/A",
          paymentStatus: item.paymentStatus || item.payment_status || "N/A",
          grandTotal: item.total || item.cost * item.quantity || 0,
          product: item.product || item.productSku || "N/A",
          paid: item.paid || 0,
          due: item.due || 0
        }))
        : [];

      setPurchaseReturns(returnsList);
    } catch (err) {
      console.error("Error fetching purchase returns:", err);
      setError("Failed to load purchase returns.");
      setPurchaseReturns([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);

      const resp = await fetch(`${baseapi}/api/suppliers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!resp.ok) throw new Error(`Suppliers: ${resp.status}`);

      const data = await resp.json();

      const list = Array.isArray(data)
        ? data
        : data.data || data.suppliers || data.results || [];

      const supplierOptions = list.map((s) => ({
        id: s.id,
        label: s.supplierName || `${s.firstName} ${s.lastName}`,
        value: s.supplierName || `${s.firstName} ${s.lastName}`,
      }));

      setSuppliers(supplierOptions);

      console.log(supplierOptions, "prem21");
    } catch (err) {
      console.error("Supplier API Error:", err);
      setErrorSuppliers(err.message);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch Warehouses
  const fetchWarehouses = async () => {
    try {
      const resp = await fetch(`${baseapi}/api/warehouses`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed to fetch warehouses");
      const data = await resp.json();
      setWarehouses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Warehouse fetch error:", err);
    }
  };

  // Fetch Products & Stock
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);

      const [pRes, sRes] = await Promise.all([
        fetch(`${baseapi}/api/products`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
        fetch(`${baseapi}/api/stock/all`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      ]);

      if (!pRes.ok) throw new Error(`Products: ${pRes.status}`);

      const pData = await pRes.json();
      const catalogList = Array.isArray(pData) ? pData : (pData.data || pData.products || []);

      // Stock Data
      let stockList = [];
      if (sRes.ok) {
        const sData = await sRes.json();
        stockList = Array.isArray(sData) ? sData : (sData.products || sData.data || []);
      }

      // Merge Logic (Same as Purchase List)
      const mergedList = [];
      const catalogMap = new Map();
      catalogList.forEach(c => {
        const name = c.productName || c.product_name || c.name || c.product || c.title;
        if (name) catalogMap.set(name, c);
      });

      // 1. Add All Stock Entries
      stockList.forEach(stockItem => {
        const catItem = catalogMap.get(stockItem.productName);
        mergedList.push({
          ...stockItem,
          productName: stockItem.productName,
          sku: stockItem.sku || (catItem ? catItem.sku || catItem.productSku : ""),
          warehouseName: stockItem.warehouse?.name || stockItem.warehouse || "Unknown Warehouse",
          cost: stockItem.cost || (catItem ? catItem.cost || catItem.purchase_price : 0),
          price: stockItem.price || (catItem ? catItem.sale_price || catItem.price : 0),
          tax: stockItem.tax || (catItem ? catItem.tax : 0),
          discount: stockItem.discount || (catItem ? catItem.discount : 0),
          id: stockItem.id // Stock ID
        });
      });

      // 2. Add Catalog Items not in Stock
      const stockProductNames = new Set(stockList.map(s => s.productName));
      catalogList.forEach(catItem => {
        const name = catItem.productName || catItem.product_name || catItem.name || catItem.product || catItem.title;
        if (name && !stockProductNames.has(name)) {
          mergedList.push({
            ...catItem,
            productName: name,
            sku: catItem.sku || catItem.productSku,
            warehouseName: catItem.warehouse || "Unallocated",
            cost: catItem.cost || catItem.purchase_price || 0,
            price: catItem.sale_price || catItem.price || 0,
            id: `cat-${catItem.id}`
          });
        }
      });

      console.log("Merged Products:", mergedList);
      setProducts(mergedList);
    } catch (error) {
      console.error("Error fetching products:", error);
      setErrorProducts(error.message);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Stock Data
  const fetchStock = async () => {
    try {
      const res = await fetch(`${baseapi}/api/stock/all`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStockData(Array.isArray(data) ? data : data.data || []);
    } catch { console.error("Failed to load stock data"); }
  };

  // 2. Call it inside useEffect
  useEffect(() => {
    fetchPurchaseReturns();
    fetchSuppliers();
    fetchProducts();
    fetchWarehouses();
    fetchStock();
  }, []);

  // Product select → auto-fill (for ADD)
  const handleProductSelect = (selectedValue) => {
    const selected = products.find((p) => String(p.id) === String(selectedValue));

    if (selected) {
      setSelectedProductId(String(selected.id)); // Set ID for dropdown
      setProductSku(selected.sku || selected.productSku || selected.product || "");
      setCost(parseFloat(selected.cost ?? selected.unit_price ?? selected.price ?? 0));
      setImageUrl(selected.image ?? "");
      setSelectedProductName(selected.productName || selected.name);
      // Auto-select warehouse from the stock entry
      setSelectedWarehouse(selected.warehouseName || "");
    } else {
      setSelectedProductId("");
      setProductSku("");
      setCost(0);
      setImageUrl("");
      setSelectedProductName("");
      setSelectedWarehouse("");
    }
  };


  // Product select → auto-fill (for EDIT)
  const handleEditProductSelect = (selectedValue) => {
    const selected = products.find((p) => String(p.id) === String(selectedValue));

    if (selected) {
      setEditSelectedProductId(String(selected.id)); // Set ID for dropdown
      // Use the actual SKU/Name for the payload, NOT the ID
      setEditProductSku(selected.sku || selected.productSku || selected.product || selected.productName || "");
      setEditCost(parseFloat(selected.cost ?? selected.unit_price ?? selected.price ?? 0));
      setEditImageUrl(selected.image ?? "");
    } else {
      setEditSelectedProductId("");
      setEditProductSku("");
      setEditCost(0);
      setEditImageUrl("");
    }
  };

  // Reset ADD form
  const resetAddForm = () => {
    setSelectedSupplier("");
    setSelectedStatus("");
    setSelectedWarehouse("");
    setDate(new Date());
    setText("");
    setReference("");
    setReference("");
    setProductSku("");
    setSelectedProductId(""); // Reset dropdown value
    setQuantity(1);
    setCost(0);
    setImageUrl("");
    setOrderTax(0);
    setOrderDiscount(0);
    setShipping(0);
  };

  // Reset EDIT form
  const resetEditForm = () => {
    setEditId(null);
    setEditSelectedSupplier("");
    setEditSelectedStatus("");
    setEditDate(new Date());
    setEditText("");
    setEditReference("");
    setEditReference("");
    setEditProductSku("");
    setEditSelectedProductId(""); // Reset dropdown value
    setEditQuantity(1);
    setEditCost(0);
    setEditImageUrl("");
    setEditOrderTax(0);
    setEditOrderDiscount(0);
    setEditShipping(0);
  };

  // Robust cleanup for Bootstrap modals
  const cleanupModals = () => {
    // 1. Remove all backdrops
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());

    // 2. Reset body classes/styles
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
    document.body.style.removeProperty("overflow");
  };

  // Close ADD modal
  const closeAddModal = () => {
    const closeBtn = document.getElementById("btn-close-add-modal");
    if (closeBtn) closeBtn.click();
    else {
      const modalEl = document.getElementById("add-sales-new");
      if (modalEl) {
        const instance = window.bootstrap?.Modal?.getInstance(modalEl);
        if (instance) instance.hide();
      }
    }
    // Force cleanup after transition
    setTimeout(cleanupModals, 400);
  };

  // Close EDIT modal
  const closeEditModal = () => {
    const closeBtn = document.getElementById("btn-close-edit-modal");
    if (closeBtn) closeBtn.click();
    else {
      const modalEl = document.getElementById("edit-sales-new");
      if (modalEl) {
        const instance = window.bootstrap?.Modal?.getInstance(modalEl);
        if (instance) instance.hide();
      }
    }
    resetEditForm();
    // Force cleanup after transition
    setTimeout(cleanupModals, 400);
  };

  // Close Add Supplier Modal - Swap Logic
  const closeSupplierModal = () => {
    const closeBtn = document.getElementById("btn-close-supplier-modal");
    if (closeBtn) closeBtn.click();
    else {
      const modalEl = document.getElementById("add_customer");
      if (modalEl && window.bootstrap) {
        const instance = window.bootstrap.Modal.getInstance(modalEl);
        if (instance) instance.hide();
      }
    }

    // Restore the parent modal if it was open
    setTimeout(() => {
      // ALWAYS clean up first to remove any "stuck" backdrops from the Supplier modal
      // This ensures we start with a clean DOM before showing the parent
      cleanupModals();

      if (parentModalRef.current) {
        const parentId = parentModalRef.current;
        const parentEl = document.getElementById(parentId);
        if (parentEl && window.bootstrap) {
          const instance = window.bootstrap.Modal.getInstance(parentEl);
          if (instance) instance.show(); // Show it again
          else {
            const newInstance = new window.bootstrap.Modal(parentEl);
            newInstance.show();
          }
        }
        parentModalRef.current = null; // Clear ref
      }
    }, 400);
  };

  // New Supplier State
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierLastName, setNewSupplierLastName] = useState("");
  const [newSupplierCompanyName, setNewSupplierCompanyName] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [newSupplierCity, setNewSupplierCity] = useState("");
  const [newSupplierState, setNewSupplierState] = useState("");
  const [newSupplierCountry, setNewSupplierCountry] = useState("");
  const [newSupplierPostalCode, setNewSupplierPostalCode] = useState("");
  const [newSupplierGstin, setNewSupplierGstin] = useState("");
  const [newSupplierStatus, setNewSupplierStatus] = useState(true);

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();

    if (!newSupplierName || !newSupplierEmail || !newSupplierPhone) {
      toast.error("Please fill all required fields (First Name, Email, Phone)");
      return;
    }

    try {
      const payload = {
        firstName: newSupplierName,
        lastName: newSupplierLastName,
        companyName: newSupplierCompanyName,
        email: newSupplierEmail,
        phone: newSupplierPhone,
        address: newSupplierAddress,
        city: newSupplierCity,
        state: newSupplierState,
        country: newSupplierCountry,
        postalCode: newSupplierPostalCode,
        gstin: newSupplierGstin,
        status: newSupplierStatus ? "Active" : "Inactive",
      };

      const res = await fetch(`${baseapi}/api/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add supplier");
      }

      toast.success("Supplier added successfully!");

      // Refresh list and select new supplier
      await fetchSuppliers();
      const fullName = `${newSupplierName} ${newSupplierLastName || ""}`.trim();
      setSelectedSupplier(fullName);

      // Reset
      setNewSupplierName("");
      setNewSupplierLastName("");
      setNewSupplierCompanyName("");
      setNewSupplierEmail("");
      setNewSupplierPhone("");
      setNewSupplierAddress("");
      setNewSupplierCity("");
      setNewSupplierState("");
      setNewSupplierCountry("");
      setNewSupplierPostalCode("");
      setNewSupplierGstin("");
      setNewSupplierStatus(true);

      closeSupplierModal();

    } catch (error) {
      console.error("Add Supplier Error:", error);
      toast.error(error.message);
    }
  };

  const handleOpenSupplier = () => {
    // 1. Identify active parent
    const parentAdd = document.getElementById("add-sales-new");
    const parentEdit = document.getElementById("edit-sales-new");

    let activeParentId = null;
    if (parentAdd?.classList.contains("show")) activeParentId = "add-sales-new";
    else if (parentEdit?.classList.contains("show")) activeParentId = "edit-sales-new";

    // 2. Hide parent if exists
    if (activeParentId) {
      parentModalRef.current = activeParentId;
      const parentEl = document.getElementById(activeParentId);

      // CRITICAL: Blur the active element to prevent "focus trap" inside hidden modal
      if (document.activeElement && parentEl.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      const parentInstance = window.bootstrap.Modal.getInstance(parentEl);
      if (parentInstance) parentInstance.hide();
    }

    // 3. Show Supplier Modal
    // Small timeout to allow transition of hiding parent to start/finish prevents conflict
    setTimeout(() => {
      const modalEl = document.getElementById("add_customer");
      if (modalEl && window.bootstrap) {
        let modal = window.bootstrap.Modal.getInstance(modalEl);
        if (!modal) {
          modal = new window.bootstrap.Modal(modalEl);
        }
        modal.show();
      }
    }, 200);
  };

  const handleSupplierCancel = () => {
    setNewSupplierName("");
    setNewSupplierLastName("");
    setNewSupplierCompanyName("");
    setNewSupplierEmail("");
    setNewSupplierPhone("");
    setNewSupplierAddress("");
    setNewSupplierCity("");
    setNewSupplierState("");
    setNewSupplierCountry("");
    setNewSupplierPostalCode("");
    setNewSupplierGstin("");
    setNewSupplierStatus(true);
    closeSupplierModal();
  };

  // ADD Submit handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSupplier || !reference || !productSku) {
      toast.error("Please fill all required fields.");
      return;
    }

    const payload = {
      supplierName: selectedSupplier,
      reference,
      date: new Date(date).toISOString().split('T')[0], // YYYY-MM-DD
      warehouseName: selectedWarehouse, // Sending selected Warehouse
      product: selectedProductName || productSku, // Prefer Name for robust stock matching
      quantity: parseInt(quantity) || 1,
      cost: parseFloat(cost) || 0,
      orderTax: parseFloat(orderTax) || 0,
      discount: parseFloat(orderDiscount) || 0, // Backend uses 'discount'
      shipping: String(parseFloat(shipping) || 0), // Backend expects String
      status: "PENDING",
      description: text || "",
    };

    try {
      const response = await fetch(`${baseapi}/api/purchase-returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success("Purchase return added successfully!");
      await fetchPurchaseReturns();
      resetAddForm();
      closeAddModal();
    } catch (err) {
      console.error("Add failed:", err);
      toast.error(err.message || "Failed to add purchase return.");
    }
  };

  // EDIT Submit handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editId || !editSelectedSupplier || !editReference || !editProductSku || !editSelectedStatus) {
      toast.error("Please fill all required fields.");
      return;
    }

    const payload = {
      supplierName: editSelectedSupplier,
      reference: editReference,
      date: new Date(editDate).toISOString().split('T')[0],
      product: editProductSku,
      quantity: parseInt(editQuantity) || 1,
      cost: parseFloat(editCost) || 0,
      orderTax: parseFloat(editOrderTax) || 0,
      discount: parseFloat(editOrderDiscount) || 0,
      shipping: String(parseFloat(editShipping) || 0),
      status: editSelectedStatus,
      description: editText || "",
    };

    try {
      const response = await fetch(`${baseapi}/api/purchase-returns/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast.success("Purchase return updated successfully!");
      await fetchPurchaseReturns();
      closeEditModal();
    } catch (err) {
      console.error("Edit failed:", err);
      toast.error(err.message || "Failed to update purchase return.");
    }
  };

  // Handle Edit button click
  const handleEdit = (row) => {
    setEditId(row.id);
    setEditSelectedSupplier(row.supplierName || row.supplier || "");
    setEditSelectedStatus(row.status || "");
    setEditDate(new Date(row.date || Date.now()));
    setEditText(row.description || "");
    setEditReference(row.reference || "");

    // Find the correct product ID based on Name/SKU and Warehouse
    // The dropdown uses ID as value, so we must find the matching ID
    const productMatch = products.find(p =>
      (p.productName === (row.product || row.productSku) || p.sku === (row.product || row.productSku)) &&
      (!row.warehouseName || p.warehouseName === row.warehouseName)
    );

    // Fallback if strict warehouse match fails (e.g. old data), try name match only
    const fallbackMatch = !productMatch ? products.find(p => p.productName === (row.product || row.productSku) || p.sku === (row.product || row.productSku)) : null;

    const resolvedId = productMatch ? String(productMatch.id) : (fallbackMatch ? String(fallbackMatch.id) : "");
    setEditSelectedProductId(resolvedId); // Set ID for dropdown
    setEditProductSku(productMatch ? (productMatch.sku || productMatch.productSku) : (row.product || row.productSku || ""));

    setEditQuantity(row.quantity || 1);
    setEditCost(row.cost || 0);
    setEditImageUrl(row.image || "");
    setEditOrderTax(row.orderTax || 0);
    setEditOrderDiscount(row.discount || row.orderDiscount || 0); // Read 'discount' from backend
    setEditShipping(parseFloat(row.shipping) || 0);

    // Open edit modal
    setTimeout(() => {
      const modalEl = document.getElementById("edit-sales-new");
      if (modalEl && window.bootstrap) {
        const modal = new window.bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 100);
  };

  // Handle Delete button click
  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // DELETE API handler
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`${baseapi}/api/purchase-returns/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      toast.success("Purchase return deleted successfully!");
      // Hide modal first
      setShowDeleteModal(false);
      setDeleteId(null);

      // Then refresh list
      await fetchPurchaseReturns();

      // Then force cleanup backdrops
      setTimeout(cleanupModals, 400);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete purchase return.");
    }
  };

  // Table columns
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
    { header: "Product", field: "product" },
    { header: "Date", field: "date" },
    { header: "Supplier Name", field: "supplier" },
    { header: "Quantity", field: "quantity" },
    { header: "Reference", field: "reference" },
    {
      header: "Actions",
      body: (row) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              to="#"
              className="me-2 p-2"
              onClick={() => handleEdit(row)}
            >
              <i className="ti ti-edit" />
            </Link>
            <Link
              to="#"
              className="p-2"
              onClick={() => handleDelete(row.id)}
            >
              <i className="ti ti-trash" />
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const handleSearch = (value) => setSearchQuery(value || "");

  const filteredData = purchaseReturns.filter(
    (item) =>
      !_searchQuery ||
      (item.supplier?.toLowerCase().includes(_searchQuery.toLowerCase())) ||
      (item.reference?.toLowerCase().includes(_searchQuery.toLowerCase()))
  );

  const supplierOptions = loadingSuppliers
    ? [{ label: "Loading...", value: "", disabled: true }]
    : errorSuppliers
      ? [{ label: "Error loading suppliers", value: "", disabled: true }]
      : [
        { label: "Select Supplier", value: "" },
        ...suppliers.map((s) => ({
          label: s.label,
          value: s.value,
        })),
      ];

  const productOptions = loadingProducts
    ? [{ label: "Loading...", value: "", disabled: true }]
    : errorProducts
      ? [{ label: "Error loading products", value: "", disabled: true }]
      : [
        { label: "Select Product", value: "" },
        ...products.map((p) => ({
          label: `${p.productName || p.name || "Unknown"} (${p.sku || p.productSku || "N/A"}) - ${p.warehouseName || "Unknown Warehouse"}`,
          value: String(p.id) // Use unique ID from fetchProducts merge logic
        })),
      ];

  const statusOptions = [
    { label: "Select", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Received", value: "RECEIVED" },
  ];

  const warehouseOptions = selectedProductName
    ? [
      { label: "Select Warehouse", value: "" },
      ...stockData
        .filter(s => s.productName === selectedProductName && (parseFloat(s.quantity) > 0))
        .map(s => ({
          label: `${s.warehouse || s.warehouseName} (Qty: ${s.quantity})`,
          value: s.warehouse || s.warehouseName
        }))
        // Remove duplicates if any
        .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i)
    ]
    : [
      { label: "Select Warehouse", value: "" },
      ...warehouses.map(w => ({ label: w.name, value: w.name }))
    ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Purchase Return List</h4>
                <h6>Manage your purchase return</h6>
              </div>
            </div>

            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-sales-new"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Purchase Return
              </Link>
            </div>
            <TableTopHead />
          </div>

          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi callback={handleSearch} rows={rows} setRows={setRows} />
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Status
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Paid</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Unpaid</Link></li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Recently Added</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Ascending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Descending</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Last Month</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Last 7 Days</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                {loading ? (
                  <p className="p-3">Loading...</p>
                ) : error ? (
                  <p className="text-danger p-3">{error}</p>
                ) : filteredData.length === 0 ? (
                  <p className="p-3">No purchase returns found.</p>
                ) : (
                  <PrimeDataTable
                    column={columns}
                    data={filteredData}
                    totalRecords={filteredData.length}
                    rows={rows}
                    setRows={setRows}
                    currentPage={1}
                    setCurrentPage={() => { }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="add-sales-new">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add Purchase Return</h4>
              <button
                type="button"
                className="close"
                aria-label="Close"
                onClick={closeAddModal}
              >
                <span>×</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="row">
                  {/* Row 1: Supplier & Date */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Supplier Name <span className="text-danger">*</span></label>
                      <div className="row">
                        <div className="col-lg-10 col-sm-10 col-10">
                          <CommonSelect
                            className="w-100"
                            options={supplierOptions}
                            value={selectedSupplier}
                            onChange={(opt) => setSelectedSupplier(opt.value)}
                            placeholder="Select Supplier"
                            optionValue="value"
                          />
                        </div>
                        <div className="col-lg-2 col-sm-2 col-2 ps-0">
                          <div className="add-icon">
                            <Link to="#" onClick={handleOpenSupplier}>
                              <i className="plus feather icon-plus-circle" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Date <span className="text-danger">*</span></label>
                      <div className="input-groupicon calender-input">
                        <i className="info-img feather icon-calendar" />
                        <CommonDatePicker value={date} onChange={setDate} className="w-100" />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Reference & Warehouse */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Reference <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Warehouse</label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseOptions}
                        value={selectedWarehouse}
                        onChange={(opt) => setSelectedWarehouse(opt.value)}
                        placeholder="Select Warehouse"
                        optionValue="value"
                      />
                    </div>
                  </div>

                  {/* Row 3: Product & Quantity */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Product <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="w-100"
                        options={productOptions}
                        value={selectedProductId}
                        onChange={(opt) => handleProductSelect(opt.value)}
                        placeholder="Select Product"
                        optionValue="value"
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Quantity <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
                            setQuantity(val);
                          }
                        }}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Row 4: Description (Full Width) */}
                  <div className="col-lg-12">
                    <div className="mb-3 summer-description-box">
                      <label className="form-label">Description</label>
                      <Editor
                        value={text}
                        onTextChange={(e) => setText(e.htmlValue)}
                        style={{ height: "200px" }}
                      />
                      <p className="mt-1">Maximum 60 Words</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                  id="btn-close-add-modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-sales-new">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Edit Purchase Return</h4>
              <button
                type="button"
                className="close"
                aria-label="Close"
                onClick={closeEditModal}
              >
                <span>×</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {/* ... existing modal body content ... */}
                <div className="row">
                  {/* Row 1: Supplier & Date */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Supplier Name <span className="text-danger">*</span></label>
                      <div className="row">
                        <div className="col-lg-10 col-sm-10 col-10">
                          <CommonSelect
                            className="w-100"
                            options={supplierOptions}
                            value={editSelectedSupplier}
                            onChange={(opt) => setEditSelectedSupplier(opt.value)}
                            placeholder="Select Supplier"
                          />
                        </div>
                        <div className="col-lg-2 col-sm-2 col-2 ps-0">
                          <div className="add-icon">
                            <Link to="#" onClick={handleOpenSupplier}>
                              <i className="plus feather icon-plus-circle" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Date <span className="text-danger">*</span></label>
                      <div className="input-groupicon calender-input">
                        <i className="info-img feather icon-calendar" />
                        <CommonDatePicker value={editDate} onChange={setEditDate} className="w-100" />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Reference & Product */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Reference <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={editReference}
                        onChange={(e) => setEditReference(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Product <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="w-100"
                        options={productOptions}
                        value={editSelectedProductId}
                        onChange={(opt) => handleEditProductSelect(opt.value)}
                        placeholder="Select Product"
                      />
                    </div>
                  </div>

                  {/* Row 3: Quantity & Cost */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Quantity <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={editQuantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
                            setEditQuantity(val);
                          }
                        }}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Cost <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        value={editCost}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
                            setEditCost(val);
                          }
                        }}
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Row 4: Tax & Discount */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Order Tax</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editOrderTax}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
                            setEditOrderTax(val);
                          }
                        }}
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Discount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editOrderDiscount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
                            setEditOrderDiscount(val);
                          }
                        }}
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Row 5: Shipping & Image URL */}
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Shipping</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editShipping}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
                            setEditShipping(val);
                          }
                        }}
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Image URL (optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-lg-3 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Status <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="w-100"
                        options={statusOptions}
                        value={editSelectedStatus}
                        onChange={(opt) => setEditSelectedStatus(opt.value)}
                        placeholder="Select Status"
                      />
                    </div>
                  </div>

                  <div className="col-lg-12">
                    <div className="mb-3 summer-description-box">
                      <label className="form-label">Description</label>
                      <Editor
                        value={editText}
                        onTextChange={(e) => setEditText(e.htmlValue)}
                        style={{ height: "200px" }}
                      />
                      <p className="mt-1">Maximum 60 Words</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                  id="btn-close-edit-modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      <div className="modal fade" id="add_customer">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add Supplier</h4>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleSupplierCancel}
              >
                <span>×</span>
              </button>
            </div>
            <form onSubmit={handleSupplierSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">First Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Last Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierLastName}
                        onChange={(e) => setNewSupplierLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierCompanyName}
                        onChange={(e) => setNewSupplierCompanyName(e.target.value)}
                        placeholder="Enter Company Name"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        value={newSupplierEmail}
                        onChange={(e) => setNewSupplierEmail(e.target.value)}
                        placeholder="Enter the Email"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Phone <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        placeholder="Enter the Phone number"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Address <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierAddress}
                        onChange={(e) => setNewSupplierAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">City <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierCity}
                        onChange={(e) => setNewSupplierCity(e.target.value)}
                        placeholder="Enter the City"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">GSTIN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierGstin}
                        onChange={(e) => setNewSupplierGstin(e.target.value)}
                        placeholder="Enter GSTIN"
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">State <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierState}
                        onChange={(e) => setNewSupplierState(e.target.value)}
                        placeholder="Enter the State"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Country <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierCountry}
                        onChange={(e) => setNewSupplierCountry(e.target.value)}
                        placeholder="Enter the Country"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-12 col-12">
                    <div className="mb-3">
                      <label className="form-label">Postal Code <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={newSupplierPostalCode}
                        onChange={(e) => setNewSupplierPostalCode(e.target.value)}
                        placeholder="Enter the Postal Code"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-0">
                  <div className="status-toggle text-end d-flex justify-content-between align-items-center">
                    <span className="status-label">Status</span>
                    <input
                      type="checkbox"
                      id="status_1"
                      className="check"
                      checked={newSupplierStatus}
                      onChange={(e) => setNewSupplierStatus(e.target.checked)}
                    />
                    <label htmlFor="status_1" className="checktoggle" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                  id="btn-close-supplier-modal"
                  onClick={handleSupplierCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Delete Modal Integration */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Return"
        message="Are you sure you want to delete this purchase return?"
      />
    </div>
  );
};

export default PurchaseReturns;
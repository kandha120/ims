import React, { useState, useEffect, useCallback, useMemo } from "react";
import CommonFooter from "../../components/footer/commonFooter";
import { toast } from "react-toastify";
import CommonSelect from "../../components/select/common-select";
import baseapi from "../../env/baseapi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableTopHead from "../../components/table-top-head";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";

// Helpers
const snakeToCamel = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const camel = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );
    camel[camelKey] = snakeToCamel(value);
  }
  return camel;
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const formatDateForAPI = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toISOString();
  } catch {
    return "";
  }
};

// Proper GET Method for Products & Stock
const fetchProducts = async () => {
  try {
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

    if (!pRes.ok) throw new Error(`Products HTTP error! Status: ${pRes.status}`);

    const pData = await pRes.json();
    const catalogList = Array.isArray(pData) ? pData : (pData.products || pData.data || []);

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
        id: stockItem.id
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

    return mergedList;
  } catch (err) {
    console.error("Fetch products error:", err);
    return [];
  }
};

const PurchaseOrder = () => {
  // ✅ SAFE STATE INITIALIZATION
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteId, setDeleteId] = useState(null); // ✅ DELETE STATE

  // Token removed
  const token = true; // Placeholder to avoid breaking logic checks temporarily

  const emptyItem = {
    sNo: 1,
    productId: "",
    productName: "",
    description: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    discount: 0,
    tax: 0,
    total: 0,
    image: "",
  };

  const [formData, setFormData] = useState({
    companyName: "",
    // companyAddress, companyContact, companyGSTIN removed
    referencePoNo: "",
    date: "",
    supplierName: "",
    supplierAddress: "",
    supplierGSTIN: "",
    contactPerson: "",
    paymentTerms: "",
    expectedDelivery: "",
    freightCharges: 0,
    subtotal: 0,
    grandTotal: 0,
    notes: "",
    // status removed
    termsAndConditions: "",
    warehouseName: "",
    warehouseId: null, // For dropdown binding
    supplierId: null, // For dropdown binding
    items: [emptyItem],
  });

  // ✅ FIXED: SAFE API CALL FUNCTION WITH DEBUG LOGS
  const apiRequest = useCallback(async (url, options = {}) => {
    try {
      // Token check removed


      console.log("🔧 API REQUEST:", url, options.method || "GET");

      const response = await fetch(`${baseapi}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        credentials: "include",
      });

      console.log("📡 API RESPONSE:", url, response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("API ERROR:", url, response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json().catch(() => ({}));
      console.log(" API SUCCESS:", url, json);
      return json;
    } catch (err) {
      console.error(" API REQUEST FAILED:", url, err);
      throw err;
    }
  }, [token]);

  // ✅ FIXED: Safe suppliers & products loading with proper GET
  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) {
        setLoadingSuppliers(false);
        setLoadingProducts(false);
        return;
      }

      try {
        setLoadingSuppliers(true);
        setLoadingProducts(true);

        const [supRes, prodRes, wareRes] = await Promise.allSettled([
          apiRequest("/api/suppliers", { method: "GET" }),
          fetchProducts(), // Corrected typo: fetchProducts
          apiRequest("/api/warehouses", { method: "GET" }),
        ]);

        // ✅ SAFE SUPPLIERS PROCESSING
        if (supRes.status === "fulfilled") {
          try {
            const suppliersList = Array.isArray(supRes.value)
              ? supRes.value
              : (supRes.value.results || supRes.value.data || supRes.value.suppliers || []);
            setSuppliers(suppliersList || []);
          } catch (e) {
            setSuppliers([]);
          }
        } else {
          setSuppliers([]);
        }

        // ✅ SAFE PRODUCTS PROCESSING
        if (prodRes.status === "fulfilled") {
          setProducts(prodRes.value || []);
        } else {
          setProducts([]);
        }

        // ✅ SAFE WAREHOUSES PROCESSING
        if (wareRes.status === "fulfilled") {
          try {
            const warehouseList = Array.isArray(wareRes.value)
              ? wareRes.value
              : (wareRes.value.results || wareRes.value.data || []);
            setWarehouses(warehouseList || []);
          } catch (e) {
            setWarehouses([]);
          }
        } else {
          setWarehouses([]);
        }

      } catch (err) {
        console.error("Load initial data error:", err);
        setSuppliers([]);
        setProducts([]);
      } finally {
        setLoadingSuppliers(false);
        setLoadingProducts(false);
      }
    };

    loadInitialData();
  }, [token, apiRequest]);

  // ✅ FIXED: Safe supplier options with useMemo
  const supplierOptions = useMemo(() => {
    try {
      return (suppliers || []).map((supplier) => {
        const fullName = `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim();
        const name = fullName || supplier.companyName ||
          `Supplier ${supplier.id || ''}`;

        const id = supplier.id ||
          supplier.supplierId ||
          fullName ||
          supplier.name ||
          `sup-${Math.random()}`;

        return {
          value: String(id),
          label: String(name),
        };
      }).filter(option => option.value && option.label);
    } catch (e) {
      console.error("Supplier options error:", e);
      return [];
    }
  }, [suppliers]);

  // ✅ FIXED: Safe product options with Product Name - SKU
  const productOptions = useMemo(() => {
    try {
      return (products || []).map((product) => {
        const name = product.productName || product.name || 'Unknown Product';
        const sku = product.sku || 'N/A';
        const displayLabel = `${name} - ${sku}`;
        return {
          value: String(product.id || product.product_id || product.sku || ''),
          label: displayLabel,
        };
      }).filter(option => option.value);
    } catch (e) {
      console.error("Product options error:", e);
      return [];
    }
  }, [products]);

  // ✅ WAREHOUSE OPTIONS
  const warehouseOptions = useMemo(() => {
    try {
      return (warehouses || []).map((warehouse) => ({
        value: String(warehouse.name || warehouse.id || ""),
        label: String(warehouse.name || ""),
      })).filter(option => option.value);
    } catch (e) {
      console.error("Warehouse options error:", e);
      return [];
    }
  }, [warehouses]);

  // ✅ FIXED: Safe supplier selection (PrimeReact Dropdown)
  const handleSupplierSelect = useCallback((e) => {
    try {
      const selectedValue = e?.value;
      if (!selectedValue) {
        setFormData(prev => ({
          ...prev,
          supplierName: "",
          supplierAddress: "",
          supplierGSTIN: "",
          contactPerson: "",
        }));
        return;
      }

      // Find the full supplier object to get additional details
      const supplier = suppliers.find(s => String(s.id) === String(selectedValue));
      const fullName = `${supplier?.firstName || ''} ${supplier?.lastName || ''}`.trim();
      const displayName = fullName || supplier?.companyName ||
        selectedValue;

      setFormData(prev => ({
        ...prev,
        supplierId: selectedValue,
        supplierName: displayName,
        supplierAddress: supplier?.address || "",
        supplierGSTIN: supplier?.gstin || "", // Ensure gstin is fetched
        contactPerson: supplier?.phone || "", // Map phone to Contact Person
      }));
    } catch (e) {
      console.error("Supplier select error:", e);
    }
  }, [suppliers]);

  // ✅ FIXED: Safe warehouse selection (PrimeReact Dropdown)
  const handleWarehouseSelect = useCallback((e) => {
    try {
      const selectedValue = e?.value;
      // Find warehouse to get the name
      const warehouse = warehouses.find(w => String(w.name) === String(selectedValue));
      setFormData(prev => ({
        ...prev,
        warehouseId: warehouse?.id || null, // Store ID
        warehouseName: selectedValue || "", // Store name for display/submission
      }));
    } catch (e) {
      console.error("Warehouse select error:", e);
    }
  }, [warehouses]);

  // ✅ SAFE VALIDATION
  const validateForm = useCallback(() => {
    try {
      const errors = [];

      if (!formData.companyName?.trim()) errors.push("Company Name is required.");
      if (!formData.date) errors.push("PO Date is required.");
      if (!formData.supplierName?.trim()) errors.push("Supplier is required.");
      if (!formData.warehouseName?.trim()) errors.push("Warehouse is required.");
      if (!formData.supplierGSTIN?.trim()) errors.push("Supplier GSTIN is required.");
      if (!formData.expectedDelivery) errors.push("Expected Delivery Date is required.");

      (formData.items || []).forEach((item, idx) => {
        if (!item.productId) errors.push(`Item ${idx + 1}: Product is required.`);
        if (!item.quantity || item.quantity <= 0) errors.push(`Item ${idx + 1}: Quantity must be greater than 0.`);
        if (!item.unitPrice || item.unitPrice < 0) errors.push(`Item ${idx + 1}: Unit Price cannot be negative.`);
      });

      return errors;
    } catch (e) {
      console.error("Validation error:", e);
      return ["Validation error occurred"];
    }
  }, [formData]);

  // ✅ SAFE CALCULATIONS
  const calcItemTotal = useCallback((quantity, unitPrice, discount, tax) => {
    try {
      const q = parseFloat(quantity) || 0;
      const p = parseFloat(unitPrice) || 0;
      const d = parseFloat(discount) || 0;
      const t = parseFloat(tax) || 0;
      const raw = (q * p - d) * (1 + t / 100);
      return parseFloat(isFinite(raw) ? raw.toFixed(2) : 0);
    } catch {
      return 0;
    }
  }, []);

  // ✅ SAFE item change handler
  const handleItemChange = useCallback((index, field, value) => {
    try {
      const items = [...(formData.items || [])];
      if (index >= items.length) return;

      const it = { ...items[index] };
      let parsedValue = value;

      if (["quantity", "unitPrice", "discount", "tax"].includes(field)) {
        const num = value === "" ? 0 : parseFloat(value);
        parsedValue = isNaN(num) ? 0 : Math.max(0, num);
        if (field === "tax" && parsedValue > 100) parsedValue = 100;
        if (field === "quantity" && parsedValue <= 0) parsedValue = 1;
      }

      it[field] = parsedValue;
      it.total = calcItemTotal(it.quantity, it.unitPrice, it.discount, it.tax);
      items[index] = it;

      setFormData(prev => ({ ...prev, items }));
    } catch (e) {
      console.error("Item change error:", e);
    }
  }, [formData.items, calcItemTotal]);

  // ✅ SAFE product select - FIXED: Single state update to avoid race conditions
  const handleProductSelect = useCallback((index, selectedProductId) => {
    try {
      const items = [...(formData.items || [])];
      if (index >= items.length) return;

      const item = { ...items[index] };

      if (!selectedProductId) {
        // Clear product selection
        item.productId = "";
        item.productName = "";
        item.description = "";
        item.unitPrice = 0;
        item.tax = 0;
        item.unit = "pcs";
        item.total = 0;
      } else {
        // Find the selected product
        const selected = products.find(p =>
          String(p.id || p.product_id || p.sku) === String(selectedProductId)
        );

        if (!selected) return;

        // Auto fill all fields in one go
        item.productId = selected.id || selected.product_id || selected.sku;
        item.productName = selected.productName || selected.name || "";
        item.description = selected.description || selected.productName || "";
        item.unitPrice = Number(selected.price || selected.unit_price || selected.cost || 0);
        // Tax and discount will be manually entered as per user request
        item.tax = 0;
        item.discount = item.discount || 0; // Keep existing discount
        item.unit = selected.units || selected.unit || "pcs";

        // Recalculate total
        item.total = calcItemTotal(
          item.quantity || 1,
          item.unitPrice,
          item.discount || 0,
          item.tax
        );
      }

      items[index] = item;
      setFormData(prev => ({ ...prev, items }));

    } catch (e) {
      console.error("Product select error:", e);
    }
  }, [products, formData.items, calcItemTotal]);

  const addItem = useCallback(() => {
    try {
      const items = [...(formData.items || []), {
        ...emptyItem,
        sNo: (formData.items?.length || 0) + 1
      }];
      setFormData(prev => ({ ...prev, items }));
    } catch (e) {
      console.error("Add item error:", e);
    }
  }, [formData.items]);

  const removeItem = useCallback((index) => {
    try {
      if ((formData.items?.length || 0) <= 1) {
        toast.warning("At least one item is required.");
        return;
      }
      const items = (formData.items || []).filter((_, i) => i !== index);
      items.forEach((it, i) => { it.sNo = i + 1; });
      setFormData(prev => ({ ...prev, items }));
    } catch (e) {
      console.error("Remove item error:", e);
    }
  }, [formData.items]);

  const handleChange = useCallback((e) => {
    try {
      const { name, value } = e.target;
      let parsed = value;

      if (name === "freightCharges") {
        const num = value === "" ? 0 : parseFloat(value);
        parsed = isNaN(num) ? 0 : Math.max(0, num);
      }
      if (name === "companyContact") {
        parsed = value.replace(/\D/g, "").slice(0, 10);
      }
      if (name === "companyGSTIN" || name === "supplierGSTIN") {
        parsed = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
      }

      setFormData(prev => ({ ...prev, [name]: parsed }));
    } catch (e) {
      console.error("Form change error:", e);
    }
  }, []);

  // ✅ SAFE orders fetch
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest("/api/purchase-order/all", { method: "GET" });
      const rawOrders = Array.isArray(response)
        ? response
        : (response.data || response.orders || response.results || []);
      setOrders(rawOrders || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, apiRequest]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ FIXED: SAFE SUBMIT HANDLER
  const handleAddOrUpdateOrder = useCallback(async (e) => {
    e?.preventDefault();
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(err => toast.warning(err));
        return;
      }

      const subtotal = (formData.items || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      const grandTotal = subtotal + (Number(formData.freightCharges) || 0);

      const apiPayload = {
        companyName: (formData.companyName || "").trim(),
        // companyAddress, companyContact, companyGstin removed
        referencePoNo: (formData.referencePoNo || "").trim() || `PO-${Date.now()}`,
        date: formatDateForAPI(formData.date),
        supplierName: (formData.supplierName || "").trim(),
        supplierAddress: (formData.supplierAddress || "").trim(),
        supplierGstin: (formData.supplierGSTIN || "").trim(),
        contactPerson: (formData.contactPerson || "").trim(),
        paymentTerms: (formData.paymentTerms || "").trim(),
        expectedDelivery: formatDateForAPI(formData.expectedDelivery),
        items: (formData.items || []).map((item) => ({
          productSku: String(item.productId || ""),
          description: ((item.description || item.productName) || "").trim(),
          quantity: Number(item.quantity) || 1,
          unit: (item.unit || "pcs").trim(),
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 0,
          total: Number(item.total) || 0
        })),
        freightCharges: Number(formData.freightCharges) || 0,
        termsAndConditions: (formData.termsAndConditions || "").trim(),
        description: (formData.notes || "").trim(),
        warehouseName: (formData.warehouseName || "").trim(),
        due: grandTotal,
        // paid, orderTax, orderDiscount removed
      };

      let response;
      if (editIndex !== null && orders[editIndex]?.id) {
        const orderId = orders[editIndex].id;
        response = await apiRequest(`/api/purchase-order/update/${orderId}`, {
          method: "PUT",
          body: JSON.stringify(apiPayload),
        });
        toast.info("Purchase order updated successfully!");
        setEditIndex(null);
      } else {
        response = await apiRequest("/api/purchase-order/add", {
          method: "POST",
          body: JSON.stringify(apiPayload),
        });
        toast.success("Purchase order added successfully!");
      }

      await fetchOrders();

      // Reset form
      setFormData({
        companyName: "",
        companyAddress: "",
        companyContact: "",
        companyGSTIN: "",
        referencePoNo: "",
        date: "",
        supplierName: "",
        supplierAddress: "",
        supplierGSTIN: "",
        contactPerson: "",
        paymentTerms: "",
        expectedDelivery: "",
        freightCharges: 0,
        subtotal: 0,
        grandTotal: 0,
        notes: "",
        status: "PENDING",
        termsAndConditions: "",
        items: [emptyItem],
      });

      // Close modal safely
      try {
        const modalEl = document.getElementById("poModal");
        if (modalEl && window.bootstrap) {
          const inst = window.bootstrap.Modal.getInstance(modalEl);
          if (inst) inst.hide();
        }

        // Force cleanup
        setTimeout(removeBackdrop, 200);
      } catch (e) {
        // Ignore modal close error
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to save purchase order. Please try again.");
    }
  }, [formData, editIndex, orders, validateForm, fetchOrders, apiRequest, token]);

  // Helper to force remove backdrop
  const removeBackdrop = () => {
    document.body.classList.remove("modal-open");
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "0px";
  };

  const editOrder = useCallback((index) => {
    try {
      if (index < 0 || !orders[index]) return;

      const orderToEdit = { ...orders[index] };
      const mapped = {
        companyName: orderToEdit.companyName || orderToEdit.company_name || "",
        // companyAddress, companyContact, companyGSTIN removed
        referencePoNo: orderToEdit.poNumber || orderToEdit.po_number || "",
        date: orderToEdit.date || "",
        supplierName: orderToEdit.supplierName || orderToEdit.supplier_name || "",
        supplierAddress: orderToEdit.supplierAddress || orderToEdit.supplier_billing_address || "",
        supplierGSTIN: orderToEdit.supplierGSTIN || orderToEdit.supplier_gstin || "",
        contactPerson: orderToEdit.contactPerson || orderToEdit.supplier_contact_person || "",
        paymentTerms: orderToEdit.paymentTerms || orderToEdit.payment_terms || "",
        expectedDelivery: orderToEdit.expectedDelivery || orderToEdit.expected_delivery_date || "",
        freightCharges: Number(orderToEdit.freightCharges || orderToEdit.freight_charges || 0),
        subtotal: Number(orderToEdit.subtotal || 0),
        grandTotal: Number(orderToEdit.grandTotal || orderToEdit.grand_total || 0),
        notes: orderToEdit.notes || "",
        // status removed
        termsAndConditions: orderToEdit.termsAndConditions || orderToEdit.terms_and_conditions || "",
        warehouseName: orderToEdit.warehouseName || orderToEdit.warehouse_name || "",
        items: (orderToEdit.items || []).map((item, idx) => ({
          sNo: idx + 1,
          productId: item.productId || item.product_id || "",
          productName: item.productName || item.product_name || "",
          description: item.description || item.desc || "",
          quantity: Number(item.quantity || 1),
          unit: item.unit || "pcs",
          unitPrice: Number(item.unitPrice || item.unit_price || 0),
          discount: Number(item.discount || 0),
          tax: Number(item.tax || 0),
          total: calcItemTotal(item.quantity || 0, item.unitPrice || 0, item.discount || 0, item.tax || 0),
          image: item.image || "",
        })),
      };

      setFormData(mapped);
      setEditIndex(index);

      // Open modal safely
      try {
        setTimeout(() => {
          const modal = new window.bootstrap.Modal(document.getElementById("poModal"));
          modal.show();
        }, 100);
      } catch (e) {
        // Ignore modal error
      }
    } catch (e) {
      console.error("Edit order error:", e);
    }
  }, [orders, calcItemTotal]);

  // 🔥🔥🔥 FIXED DELETE FUNCTION WITH FULL DEBUGGING 🔥🔥🔥
  const deleteOrder = useCallback((orderId) => {
    console.log("🗑️ === DELETE BUTTON CLICKED ===");
    console.log("📋 Order ID to delete:", orderId);
    console.log("🔢 Order ID type:", typeof orderId);

    if (!orderId) {
      console.error("❌ NO ORDER ID PROVIDED!");
      toast.error("Cannot delete: Invalid order ID");
      return;
    }

    setDeleteId(orderId);
    console.log("✅ Delete ID set:", orderId);

    // Open modal with timeout to ensure DOM is ready
    setTimeout(() => {
      try {
        const modalEl = document.getElementById("deletePOModal");
        if (modalEl && window.bootstrap) {
          const modal = new window.bootstrap.Modal(modalEl);
          modal.show();
          console.log("✅ Delete modal opened");
        } else {
          console.error("❌ Modal element or Bootstrap not found");
        }
      } catch (e) {
        console.error("❌ Modal open error:", e);
      }
    }, 100);
  }, []);

  // 🔥🔥🔥 FIXED: SEPARATE DELETE EFFECT WITH FULL DEBUG LOGS 🔥🔥🔥
  useEffect(() => {
    console.log("🔄 === DELETE EFFECT TRIGGERED ===");
    console.log("📋 Current deleteId:", deleteId);

    if (!deleteId || !token) {
      console.log("⏭️ Skipping delete - no ID or token");
      return;
    }

    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (!confirmDeleteBtn) {
      console.error("❌ Confirm delete button NOT FOUND");
      return;
    }

    const handleDelete = async () => {
      console.log("🚀 === CONFIRM DELETE CLICKED ===");
      console.log("🗑️ Deleting order ID:", deleteId);

      try {
        // 🔥 CALL DELETE API WITH DEBUG LOGS
        const response = await apiRequest(`/api/purchase-order/delete/${deleteId}`, {
          method: "DELETE"
        });

        console.log("✅ DELETE API SUCCESS:", response);
        toast.success("Purchase order deleted successfully!");

        // 🔥 UPDATE LOCAL STATE
        setOrders(prev => {
          const newOrders = prev.filter(o => String(o.id) !== String(deleteId));
          console.log("📊 Orders after delete:", newOrders.length);
          return newOrders;
        });

        // 🔥 CLOSE MODAL
        try {
          const modalEl = document.getElementById("deletePOModal");
          if (modalEl && window.bootstrap) {
            const modal = window.bootstrap.Modal.getInstance(modalEl);
            if (modal) {
              modal.hide();
              console.log("✅ Delete modal closed");
            }
          }
          // Force cleanup
          setTimeout(removeBackdrop, 200);
        } catch (e) {
          console.error("❌ Modal close error:", e);
        }

        // 🔥 CLEAR STATE
        setDeleteId(null);
        console.log("✅ Delete completed successfully");

      } catch (err) {
        console.error("💥 DELETE FAILED:", err);
        toast.error("Failed to delete purchase order: " + err.message);
      }
    };

    // 🔥 ATTACH EVENT LISTENER
    confirmDeleteBtn.onclick = handleDelete;
    console.log("✅ Delete handler attached to button");

    // 🔥 CLEANUP
    return () => {
      if (confirmDeleteBtn.onclick === handleDelete) {
        confirmDeleteBtn.onclick = null;
        console.log("🧹 Delete handler removed");
      }
    };
  }, [deleteId, token, apiRequest]);

  const toTitleCase = useCallback((str) => {
    try {
      return str
        .replace(/([A-Z][a-z])/g, " $1")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    } catch {
      return str;
    }
  }, []);

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Orders List", 14, 22);

    const tableColumn = ["S.No", "PO Number", "Date", "Supplier", "Warehouse", "Total Amount"];
    const tableRows = orders.map((order, index) => [
      index + 1,
      order?.poNumber || order?.po_number || order?.referencePoNo || "N/A",
      order?.date ? new Date(order.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A",
      order?.supplierName || order?.supplier_name || "N/A",
      order?.warehouseName || order?.warehouse_name || "N/A",
      (Number(order?.total) || 0).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("PurchaseOrders.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "PO Number", "Date", "Supplier", "Warehouse", "Total Amount"],
      ...orders.map((order, index) => [
        index + 1,
        `"${order?.poNumber || order?.po_number || order?.referencePoNo || "N/A"}"`,
        `"${order?.date ? new Date(order.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A"}"`,
        `"${order?.supplierName || order?.supplier_name || "N/A"}"`,
        `"${order?.warehouseName || order?.warehouse_name || "N/A"}"`,
        (Number(order?.total) || 0).toFixed(2),
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "PurchaseOrders.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRowPDF = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Purchase Order", 14, 20);

    doc.setFontSize(10);
    doc.text(`PO Number: ${order?.poNumber || order?.po_number || order?.referencePoNo || "N/A"}`, 14, 30);
    doc.text(`Date: ${order?.date ? new Date(order.date).toLocaleDateString("en-GB") : "N/A"}`, 14, 35);
    doc.text(`Supplier: ${order?.supplierName || order?.supplier_name || "N/A"}`, 14, 40);
    doc.text(`Warehouse: ${order?.warehouseName || order?.warehouse_name || "N/A"}`, 14, 45);

    const tableColumn = ["Product", "Qty", "Unit Price", "Total"];
    const tableRows = (order.items || []).map((item) => [
      item.productName || item.product_name || item.description || "N/A",
      item.quantity || 0,
      Number(item.unitPrice || item.unit_price || 0).toFixed(2),
      Number(item.total || 0).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Grand Total: ${(Number(order?.total) || 0).toFixed(2)}`, 14, finalY);

    doc.save(`PO_${order?.poNumber || "download"}.pdf`);
  };

  // ✅ SAFE RENDER - NO CRASHES
  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header mb-4">
            <h4>Loading purchase orders...</h4>
          </div>
        </div>
        <CommonFooter />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header mb-4 d-flex justify-content-between align-items-center">
          <h4>Purchase Orders</h4>
          <div className="d-flex align-items-center gap-2">
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchOrders}
            />
            <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#poModal">
              Add Purchase Order
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-light">
              <tr>
                <th>S.No</th>
                <th>PO Number</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Warehouse</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No purchase orders found.</td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const orderId = order?.id;
                  console.log(`📋 Order ${index + 1}:`, { id: orderId, poNumber: order?.poNumber });

                  return (
                    <tr key={orderId || index}>
                      <td>{index + 1}</td>
                      <td>{order?.poNumber || order?.po_number || order?.referencePoNo || "N/A"}</td>
                      <td>
                        {order?.date ? new Date(order.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        }) : "N/A"}
                      </td>
                      <td>{order?.supplierName || order?.supplier_name || "N/A"}</td>
                      <td>{order?.warehouseName || order?.warehouse_name || "N/A"}</td>
                      <td>₹{(Number(order?.total) || 0).toFixed(2)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="bg-transparent border-0 p-0 text-success hover-scale me-2"
                            onClick={() => handleDownloadRowPDF(order)}
                            type="button"
                            title="Download PDF"
                            style={{ display: "inline-flex" }}
                          >
                            <FiDownload size={20} />
                          </button>
                          <button
                            className="bg-transparent border-0 p-0 text-warning hover-scale me-2"
                            onClick={() => editOrder(index)}
                            type="button"
                            title="Edit"
                            style={{ display: "inline-flex" }}
                          >
                            <FiEdit size={20} />
                          </button>
                          {/* 🔥 FIXED DELETE BUTTON WITH DEBUG */}
                          <button
                            className="bg-transparent border-0 p-0 text-danger hover-scale"
                            onClick={() => deleteOrder(orderId)}
                            type="button"
                            title="Delete"
                            style={{ display: "inline-flex" }}
                          >
                            <FiTrash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ FIXED DELETE MODAL */}
        <div className="modal fade" id="deletePOModal" tabIndex="-1" aria-labelledby="deletePOModalLabel">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="deletePOModalLabel">Confirm Delete</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this purchase order? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  id="confirmDeleteBtn"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ MAIN MODAL - UNCHANGED */}
        <div className="modal fade" id="poModal" tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <form onSubmit={handleAddOrUpdateOrder}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editIndex !== null ? "Edit Purchase Order" : "Add Purchase Order"}
                  </h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-4">
                    {[
                      { name: "companyName", type: "text", label: "Company Name", required: true },
                      { name: "referencePoNo", type: "text", label: "Reference PO No" },
                      { name: "date", type: "date", required: true },
                      {
                        name: "supplierName",
                        type: "select",
                        options: supplierOptions,
                        required: true,
                        label: "Supplier Name"
                      },
                      {
                        name: "warehouseName",
                        type: "select",
                        options: warehouseOptions,
                        label: "Choose Warehouse",
                        required: true
                      },
                      { name: "supplierAddress", type: "text", label: "Supplier Address" },
                      { name: "supplierGSTIN", type: "text", label: "Supplier GSTIN" },
                      { name: "contactPerson", type: "text", label: "Contact Person" },
                      { name: "paymentTerms", type: "text", label: "Payment Terms" },
                      { name: "expectedDelivery", type: "date", required: true },
                      { name: "freightCharges", type: "number", min: 0, step: "0.01", label: "Freight Charges" },
                      { name: "notes", type: "textarea", label: "Notes" },
                      { name: "termsAndConditions", type: "textarea", label: "Terms & Conditions" },
                    ].map((field) => (
                      <div key={field.name} className={field.type === "textarea" ? "col-12" : "col-md-6"}>
                        <div className="mb-2">
                          <label className="form-label">{field.label || toTitleCase(field.name)}</label>
                          {field.type === "select" ? (
                            <CommonSelect
                              className="w-100"
                              options={field.options || []}
                              value={
                                field.name === "supplierName"
                                  ? formData.supplierId
                                  : field.name === "warehouseName"
                                    ? formData.warehouseName
                                    : formData[field.name]
                              }
                              onChange={
                                field.name === "supplierName"
                                  ? handleSupplierSelect
                                  : handleWarehouseSelect
                              }
                              placeholder={
                                (field.name === "warehouseName" ? loadingWarehouses : loadingSuppliers)
                                  ? `Loading ${field.name.replace('Name', 's')}...`
                                  : (field.label || "Select")
                              }
                              isDisabled={field.name === "warehouseName" ? loadingWarehouses : loadingSuppliers}
                              isLoading={field.name === "warehouseName" ? loadingWarehouses : loadingSuppliers}
                              isClearable
                              isSearchable
                            />
                          ) : field.type === "textarea" ? (
                            <textarea
                              className="form-control form-control-sm"
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleChange}
                              rows={3}
                            />
                          ) : (
                            <input
                              type={field.type}
                              className="form-control form-control-sm"
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleChange}
                              min={field.min}
                              step={field.step}
                              required={field.required}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ✅ ITEMS TABLE - UNCHANGED */}
                  <div className="table-responsive" style={{ overflowX: "auto" }}>
                    <table className="table table-bordered table-sm mb-3">
                      <thead className="table-light">
                        <tr>
                          <th>S.No</th>
                          <th>Product</th>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Unit Price</th>
                          <th>Discount</th>
                          <th>Tax (%)</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.sNo || idx + 1}</td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={item.productId || ""}
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                                required
                                disabled={loadingProducts}
                              >
                                <option value="">Choose Product</option>
                                {(products || []).map((p) => (
                                  <option
                                    key={p.id || p.product_id || p.sku || idx}
                                    value={p.id || p.product_id || p.sku || ''}
                                  >
                                    {`${p.productName || 'Unknown'} (${p.sku || 'N/A'}) - ${p.warehouseName || 'Unknown Warehouse'}`}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.description || item.productName || ""}
                                onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.quantity || 1}
                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                min="1"
                                step="1"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.unit || "pcs"}
                                onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.unitPrice || 0}
                                onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                min="0"
                                step="0.01"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.discount || 0}
                                onChange={(e) => handleItemChange(idx, "discount", e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={item.tax || 0}
                                onChange={(e) => handleItemChange(idx, "tax", e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <strong>₹{(Number(item.total) || 0).toFixed(2)}</strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeItem(idx)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button type="button" className="btn btn-primary mb-3" onClick={addItem}>
                    + Add Item
                  </button>

                  {/* ✅ TOTALS - UNCHANGED */}
                  <div className="text-end mt-3">
                    <p>
                      <strong>Subtotal:</strong> ₹
                      {(formData.items || []).reduce((acc, i) => acc + (Number(i.total) || 0), 0).toFixed(2)}
                    </p>
                    <p>
                      <strong>Freight Charges:</strong> ₹
                      {(Number(formData.freightCharges) || 0).toFixed(2)}
                    </p>
                    <p className="h4 text-success">
                      <strong>Grand Total:</strong> ₹
                      {(
                        (formData.items || []).reduce((acc, i) => acc + (Number(i.total) || 0), 0) +
                        (Number(formData.freightCharges) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="modal-footer d-flex justify-content-between flex-wrap">
                  <button type="submit" className="btn btn-success me-2 mb-2 mb-sm-0">
                    {editIndex !== null ? "Update Purchase Order" : "Save Purchase Order"}
                  </button>
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default PurchaseOrder;
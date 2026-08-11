import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import { toast } from "react-toastify";
import baseapi from "../../env/baseapi";
import TableTopHead from "../../components/table-top-head";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";

// const API_BASE = "http://localhost:8200/api";

const CreditNote = () => {
  const [formData, setFormData] = useState({
    creditNoteNumber: "",
    date: "",
    originalPoNumber: "",
    originalInvoiceDate: "",
    customer: "",
    reasonForIssue: "",
    items: [{ description: "", quantity: "", unitPrice: "", amount: 0, productId: null }],
    gst: 0,
    remarks: "",
    authorisedSignatory: "",
    status: "PENDING",
  });

  const [creditNotes, setCreditNotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // ========================
  // Data Helpers
  // ========================
  const snakeToCamel = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    const camel = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/([-_][a-z])/g, (g) => g[1].toUpperCase());
      camel[camelKey] = snakeToCamel(value);
    }
    return camel;
  };

  const camelToSnake = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(camelToSnake);
    const snake = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, (g) => `_${g.toLowerCase()}`);
      snake[snakeKey] = camelToSnake(value);
    }
    return snake;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString();
  };

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(`${baseapi}/api/credit-note/all`, {
      ...options,

      headers: {
        method: "GET",


        "Content-Type": "application/json", ...options.headers
      },
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err}`);
    }
    return response.json();
  };

  // ========================
  // Fetch Data
  // ========================
  // Fetch Products & Customers (same as yours)
  // Fetch Products & Stock (Merged)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const [pRes, sRes] = await Promise.all([
          fetch(`${baseapi}/api/products`, {
            credentials: "include"
          }),
          fetch(`${baseapi}/api/stock/all`, {
            credentials: "include"
          })
        ]);

        if (!pRes.ok) throw new Error("Products fetch failed");

        const pData = await pRes.json();
        const catalogList = Array.isArray(pData) ? pData : (pData.products || pData.data || []);

        // Stock Data
        let stockList = [];
        if (sRes.ok) {
          const sData = await sRes.json();
          stockList = Array.isArray(sData) ? sData : (sData.products || sData.data || []);
        }

        // Merge Logic
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
            quantity: stockItem.quantity || 0,
            sale_price: stockItem.price || (catItem ? catItem.sale_price || catItem.price : 0),
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
              quantity: 0,
              sale_price: catItem.sale_price || catItem.price || 0,
              id: `cat-${catItem.id}`
            });
          }
        });

        setProducts(mergedList);
      } catch (err) {
        toast.error("Failed to load products");
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // ========================
  // 3. UPDATE CREDIT NOTE (PUT)
  // ========================
  const handleUpdate = async (e) => {
    e.preventDefault();

    const payload = {
      creditNoteNumber: formData.creditNoteNumber || selectedNote.creditNoteNumber,
      date: formData.date,
      originalPoNumber: formData.originalPoNumber,
      originalInvoiceDate: formData.originalInvoiceDate || null,
      customer: formData.customer,
      reasonForIssue: formData.reasonForIssue,
      items: formData.items.map((item) => ({
        productName: item.description,
        qty: Number(item.quantity),
        autoPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        productId: item.productId || null,
      })),
      totalAmount: totalAmount,
      gst: Number(formData.gst),
      totalCredit: totalCredit,
      remarks: formData.remarks,
      authorisedSignatory: formData.authorisedSignatory,
      status: formData.status,
    };

    try {
      const res = await fetch(`${baseapi}/api/credit-note/update/${selectedNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Update failed");
      }
      const updatedNote = await res.json();

      setCreditNotes(creditNotes.map(n => n.id === selectedNote.id ? {
        ...updatedNote,
        date: updatedNote.date?.split("T")[0],
        originalInvoiceDate: updatedNote.original_invoice_date?.split("T")[0],
      } : n));

      toast.success("Updated successfully da macha!");
      setEditMode(false);
      document.querySelector('#edit-credit-note .btn-close').click();
    } catch (err) {
      toast.error("Update error da: " + err.message);
    }
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${baseapi}/api/customers`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : data.data || data.customers || []);
      } catch {
        toast.error("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // ========================
  // 1. GET ALL CREDIT NOTES
  // ========================
  useEffect(() => {
    const fetchCreditNotes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseapi}/api/credit-note/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const notes = (data.credit_notes || data || []).map(note => ({
          ...note,
          date: note.date ? note.date.split("T")[0] : "",
          originalInvoiceDate: note.original_invoice_date ? note.original_invoice_date.split("T")[0] : "",
        }));

        setCreditNotes(notes);
      } catch (err) {
        toast.error("Failed to load credit notes");
      } finally {
        setLoading(false);
      }
    };

    fetchCreditNotes();
  }, []);

  // Product Options (Warehouse Aware)
  const productOptions = products.map((p) => {
    const name = p.productName || p.product_name || p.name || p.product || p.title || "Unknown Product";
    const warehouse = p.warehouseName || "Unknown Warehouse";
    const uniqueValue = `${name} - ${warehouse}`;
    return {
      value: uniqueValue,
      label: `${uniqueValue} (Qty: ${p.quantity})`,
      unitPrice: Number(p.sale_price || p.price || p.unit_price || p.net_unit_price || 0),
    };
  });

  // ========================
  // Input Handlers
  // ========================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "gst" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleProductSelect = (index, selectedValue) => {
    const selectedProduct = products.find(p => {
      const name = p.productName || p.product_name || p.name || p.product || p.title || "Unknown Product";
      const warehouse = p.warehouseName || "Unknown Warehouse";
      return `${name} - ${warehouse}` === selectedValue;
    });

    if (!selectedProduct) return;

    const unitPrice =
      parseFloat(selectedProduct.sale_price) ||
      parseFloat(selectedProduct.price) ||
      parseFloat(selectedProduct.unit_price) ||
      parseFloat(selectedProduct.net_unit_price) ||
      0;

    const rawProductId = selectedProduct.id || selectedProduct.product_id || null;
    const productId = rawProductId ? Number(rawProductId) : null;

    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const quantity = parseFloat(updatedItems[index].quantity) || 0;

      updatedItems[index] = {
        ...updatedItems[index],
        description: selectedValue,
        unitPrice: unitPrice,
        amount: quantity * unitPrice,
        productId: Number.isFinite(productId) ? productId : null,
      };

      return { ...prev, items: updatedItems };
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    const qty = parseFloat(newItems[index].quantity) || 0;
    const price = parseFloat(newItems[index].unitPrice) || 0;
    newItems[index].amount = qty * price;

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: "", unitPrice: "", amount: 0 },
      ],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const totalAmount = formData.items.reduce(
    (sum, i) => sum + (i.amount || 0),
    0
  );


  // ========================
  // 4. DELETE CREDIT NOTE
  // ========================
  const handleDelete = async () => {


    try {
      const res = await fetch(`${baseapi}/api/credit-note/delete/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete aagala");

      setCreditNotes(creditNotes.filter(n => n.id !== deleteId));
      toast.success("Deleted da macha!");
      document.querySelector('#delete .btn-close').click();
    } catch (err) {
      toast.error("Delete error da");
    }
  };

  useEffect(() => {
    const gstValue = +(totalAmount * 0.18).toFixed(2);
    setFormData((prev) => {
      if (prev.gst !== gstValue) return { ...prev, gst: gstValue };
      return prev;
    });
  }, [totalAmount]);

  const totalCredit = +(totalAmount + (parseFloat(formData.gst) || 0)).toFixed(
    2
  );

  // ========================
  // Submit Handlers with FULL VALIDATION
  // ========================
  // ========================
  // 2. ADD NEW CREDIT NOTE (POST)
  // ========================
  const handleAdd = async (e) => {
    e.preventDefault();


    const payload = {
      creditNoteNumber: formData.creditNoteNumber || `CN${String(creditNotes.length + 1).padStart(3, "0")}`,
      date: formData.date,
      originalPoNumber: formData.originalPoNumber,
      originalInvoiceDate: formData.originalInvoiceDate || null,
      customer: formData.customer,
      reasonForIssue: formData.reasonForIssue,
      items: formData.items.map((item) => ({
        productName: item.description,
        qty: Number(item.quantity),
        autoPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        productId: item.productId || null,
      })),
      totalAmount: totalAmount,
      gst: Number(formData.gst),
      totalCredit: totalCredit,
      remarks: formData.remarks,
      authorisedSignatory: formData.authorisedSignatory,
      status: formData.status,
    };

    try {
      const res = await fetch(`${baseapi}/api/credit-note/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Add panna mudiyala");
      }
      const newNote = await res.json();

      setCreditNotes([...creditNotes, {
        ...newNote,
        date: newNote.date?.split("T")[0],
        originalInvoiceDate: newNote.original_invoice_date?.split("T")[0],
      }]);

      toast.success("Credit Note added successfully da macha!");
      resetForm();
      document.querySelector('#add-credit-note .btn-close').click(); // modal close
    } catch (err) {
      toast.error("Error da macha: " + err.message);
    }
  };
  // ========================
  // Other Helpers
  // ========================
  const resetForm = () => {
    setFormData({
      creditNoteNumber: `CN${(creditNotes.length + 1)
        .toString()
        .padStart(3, "0")}`,
      date: "",
      originalPoNumber: "",
      originalInvoiceDate: "",
      customer: "",
      reasonForIssue: "",
      items: [{ description: "", quantity: "", unitPrice: "", amount: 0, productId: null }],
      gst: 0,
      remarks: "",
      authorisedSignatory: "",
      status: "PENDING",
    });
  };

  const hideModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
      const bsModal = window.bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    }
  };

  // ========================
  // Render Form Fields (with number-only inputs)
  // ========================
  const renderFormFields = () => (
    <div className="row g-3">
      <div className="col-12 col-sm-6">
        <label className="form-label">Credit Note Number</label>
        <input
          type="text"
          name="creditNoteNumber"
          value={formData.creditNoteNumber}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>

      <div className="col-12 col-sm-6">
        <label className="form-label">Date *</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          className="form-control"
          required
        />
      </div>

      <div className="col-12 col-sm-6">
        <label className="form-label">Customer *</label>
        {loadingCustomers ? (
          <div className="spinner-border spinner-border-sm ms-2" />
        ) : (
          <select
            name="customer"
            value={formData.customer}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            <option value="">Select Customer</option>
            {customers.map((cust, idx) => {
              const name = cust.customerName || cust.customer_name || (cust.firstName ? `${cust.firstName} ${cust.lastName || ""}` : null) || cust.name || cust.customer || "Unknown";
              return (
                <option key={cust.id || idx} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        )}
      </div>

      <div className="col-12 col-sm-6">
        <label className="form-label">Original PO Number</label>
        <input
          type="text"
          name="originalPoNumber"
          value={formData.originalPoNumber}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>

      <div className="col-12 col-sm-6">
        <label className="form-label">Original Invoice Date</label>
        <input
          type="date"
          name="originalInvoiceDate"
          value={formData.originalInvoiceDate}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>

      <div className="col-12">
        <label className="form-label">Reason for Issue</label>
        <textarea
          name="reasonForIssue"
          value={formData.reasonForIssue}
          onChange={handleInputChange}
          rows={2}
          className="form-control"
        />
      </div>

      {/* Items Section */}
      <div className="col-12 mt-3">
        <h6>Items</h6>
        {loadingProducts ? (
          <div className="text-center py-2">
            <div className="spinner-border spinner-border-sm" />
          </div>
        ) : (
          formData.items.map((item, index) => (
            <div key={index} className="row g-2 mb-2 align-items-center">
              <div className="col-12 col-sm-3">
                <select
                  className="form-select"
                  value={item.description}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                  required
                >
                  <option value="">Choose Product</option>
                  {productOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-sm-2">
                <input
                  type="number"
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                  min="1"
                  step="1"
                  placeholder="Qty"
                  className="form-control"
                  required
                />
              </div>
              <div className="col-12 col-sm-2">
                <input
                  type="number"
                  step="0.01"
                  name="unitPrice"
                  value={item.unitPrice || ""}
                  readOnly
                  className="form-control bg-light text-success fw-semibold"
                  placeholder="Auto Price"
                />
              </div>
              <div className="col-12 col-sm-2">
                <input
                  type="text"
                  value={Number(item.amount || 0).toFixed(2)}
                  readOnly
                  className="form-control bg-light"
                />
              </div>
              <div className="col-12 col-sm-3">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="btn btn-danger btn-sm"
                  disabled={formData.items.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        <button
          type="button"
          className="btn btn-link text-primary p-0"
          onClick={addItem}
        >
          + Add Item
        </button>
      </div>

      {/* Totals */}
      <div className="col-12 col-sm-4">
        <label className="form-label">Total Amount</label>
        <input
          type="text"
          value={Number(totalAmount || 0).toFixed(2)}
          readOnly
          className="form-control bg-light"
        />
      </div>

      <div className="col-12 col-sm-4">
        <label className="form-label">GST (18%)</label>
        <input
          type="number"
          name="gst"
          value={Number(formData.gst || 0).toFixed(2)}
          readOnly
          className="form-control bg-light"
        />
      </div>

      <div className="col-12 col-sm-4">
        <label className="form-label">Total Credit</label>
        <input
          type="text"
          value={Number(totalCredit || 0).toFixed(2)}
          readOnly
          className="form-control bg-light"
        />
      </div>

      <div className="col-12 col-sm-6">
        <label className="form-label">Authorised Signatory</label>
        <input
          type="text"
          name="authorisedSignatory"
          value={formData.authorisedSignatory}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>

      <div className="col-12 col-sm-6">
        <label className="form-label">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="col-12">
        <label className="form-label">Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleInputChange}
          rows={2}
          className="form-control"
        />
      </div>
    </div>
  );

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Credit Notes List", 14, 22);

    const tableColumn = ["S.No", "Credit Note #", "Date", "Customer", "Reason", "Amount", "GST", "Total"];
    const tableRows = creditNotes.map((note) => [
      note.id,
      note.creditNoteNumber,
      note.date,
      note.customer,
      note.reasonForIssue,
      Number(note.totalAmount || 0).toFixed(2),
      Number(note.gst || 0).toFixed(2),
      Number(note.totalCredit || 0).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("CreditNotes.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "Credit Note #", "Date", "Customer", "Reason", "Amount", "GST", "Total"],
      ...creditNotes.map((note) => [
        note.id,
        `"${note.creditNoteNumber || ""}"`,
        `"${note.date || ""}"`,
        `"${note.customer || ""}"`,
        `"${note.reasonForIssue || ""}"`,
        Number(note.totalAmount || 0).toFixed(2),
        Number(note.gst || 0).toFixed(2),
        Number(note.totalCredit || 0).toFixed(2),
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "CreditNotes.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRowPDF = (note) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Credit Note", 14, 20);

    doc.setFontSize(10);
    doc.text(`CN Number: ${note.creditNoteNumber || "N/A"}`, 14, 30);
    doc.text(`Date: ${note.date || "N/A"}`, 14, 35);
    doc.text(`Customer: ${note.customer || "N/A"}`, 14, 40);

    const tableColumn = ["Product", "Qty", "Price", "Amount"];
    const tableRows = (note.items || []).map((item) => [
      item.description || item.productName || item.product_name || "Item",
      item.quantity || item.qty || 0,
      Number(item.unitPrice || item.autoPrice || 0).toFixed(2),
      Number(item.amount || 0).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Credit: $${Number(note.totalCredit || 0).toFixed(2)}`, 14, finalY);

    doc.save(`CN_${note.creditNoteNumber || "doc"}.pdf`);
  };

  if (loading) return <div className="content">Loading...</div>;
  if (error) return <div className="content text-danger">Error: {error}</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header mb-4 d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h4>Credit Note</h4>
              <h6>Manage Your Credit Notes</h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              <TableTopHead
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onRefresh={() => window.location.reload()}
              />
              <div>
                <Link
                  to="#"
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add-credit-note"
                  onClick={resetForm}
                >
                  Add Credit Note
                </Link>
              </div>
            </div>
          </div>

          <div className="card employee-table mt-3">
            <div className="card-body table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>S.no</th>
                    <th>Credit Note #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No credit notes found.
                      </td>
                    </tr>
                  ) : (
                    creditNotes.map((note) => (
                      <tr key={note.id}>
                        <td>{note.id}</td>
                        <td>{note.creditNoteNumber}</td>
                        <td>{note.date}</td>
                        <td>{note.customer}</td>
                        <td>{note.reasonForIssue}</td>
                        <td>${Number(note.totalAmount || 0).toFixed(2)}</td>
                        <td>${Number(note.gst || 0).toFixed(2)}</td>
                        <td>${Number(note.totalCredit || 0).toFixed(2)}</td>
                        <td className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-white"
                            onClick={() => handleDownloadRowPDF(note)}
                            title="Download PDF"
                          >
                            <FiDownload className="text-success" size={20} />
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-credit-note"
                            onClick={() => {
                              setSelectedNote(note);
                              setFormData({
                                ...note,
                                creditNoteNumber: note.creditNoteNumber,
                                items: (note.items || []).map(i => ({
                                  description: i.productName || i.description || "",
                                  quantity: i.qty || i.quantity || 0,
                                  unitPrice: i.autoPrice || i.unitPrice || 0,
                                  amount: i.amount || 0,
                                  productId: i.productId || null // Preserve productId if available
                                })),
                              });
                              setEditMode(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            data-bs-toggle="modal"
                            data-bs-target="#delete"
                            onClick={() => setDeleteId(note.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="add-credit-note">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add Credit Note</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                onClick={resetForm}
              ></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">{renderFormFields()}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-credit-note">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Edit Credit Note</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                onClick={() => {
                  setEditMode(false);
                  setSelectedNote(null);
                  resetForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">{renderFormFields()}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={() => {
                    setEditMode(false);
                    setSelectedNote(null);
                    resetForm();
                  }}
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

      {/* Delete Modal */}
      <div className="modal fade" id="delete">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Confirm Delete</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this credit note?</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
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
    </>
  );
};

export default CreditNote;
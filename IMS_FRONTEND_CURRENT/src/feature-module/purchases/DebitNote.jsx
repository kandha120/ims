import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import TableTopHead from "../../components/table-top-head";
import { toast } from "react-toastify";
import baseapi from "../../env/baseapi";


const DEBIT_NOTES_API = `${baseapi}/api/debit-note/update`;
const DELETE_NOTES = `${baseapi}/api/debit-note/delete`;

const DebitNote = () => {
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [errorSuppliers, setErrorSuppliers] = useState(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    debitNoteNumber: "",
    date: "",
    originalPoNumber: "",
    originalInvoiceDate: "",
    supplierName: "",
    reasonForIssue: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    gst: 0,
    remarks: "",
    authorisedSignatory: "",
  });

  // Validation Function
  const validateForm = () => {
    const errors = [];

    if (!formData.date) errors.push("Date is required.");
    if (!formData.supplierName) errors.push("Supplier Name is required.");
    if (!formData.reasonForIssue.trim()) errors.push("Reason for Issue is required.");

    if (formData.items.length === 0) {
      errors.push("At least one item is required.");
    } else {
      formData.items.forEach((item, idx) => {
        if (!item.description) errors.push(`Item ${idx + 1}: Product is required.`);
        if (!item.quantity || item.quantity <= 0) errors.push(`Item ${idx + 1}: Quantity must be greater than 0.`);
        if (!item.unitPrice || item.unitPrice < 0) errors.push(`Item ${idx + 1}: Unit Price cannot be negative.`);
      });
    }

    if (formData.gst < 0 || formData.gst > 100) {
      errors.push("GST must be between 0 and 100%.");
    }

    return errors;
  };

  // Reusable fetch
  const fetchDebitNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseapi}/api/debit-note/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log("✅ Debit Notes Response:", data);

      const notesArray = Array.isArray(data)
        ? data
        : data.debitNotes || data.data || data.results || [];
      setDebitNotes(notesArray);
    } catch (err) {
      console.error("Error fetching debit notes:", err);
      setError("Failed to load debit notes.");
      setDebitNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebitNotes();

  }, []);

  // Fetch Suppliers
  useEffect(() => {
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

        // Always make sure data is an array
        const list = Array.isArray(data)
          ? data
          : data.data || data.suppliers || data.results || [];

        // Convert to dropdown format
        const supplierOptions = list.map((s) => ({
          id: s.id,
          label: s.supplierName || s.firstName + " " + s.lastName,
          value: s.supplierName || s.firstName + " " + s.lastName,
        }));

        setSuppliers(supplierOptions);


        console.log(supplierOptions, "prem21");

      } catch (err) {
        console.error("Supplier API Error:", err);
        setErrorSuppliers(err.message);
        setSuppliers([]); // keep as array
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);




  // Fetch Products & Stock
  useEffect(() => {
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
            cost: stockItem.cost || (catItem ? catItem.cost || catItem.purchase_price : 0),
            price: stockItem.price || (catItem ? catItem.sale_price || catItem.price : 0),
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
              cost: catItem.cost || catItem.purchase_price || 0,
              price: catItem.sale_price || catItem.price || 0,
              id: `cat-${catItem.id}`
            });
          }
        });

        console.log("Merged Products (Debit):", mergedList);
        setProducts(mergedList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // snake_case → camelCase
  const snakeToCamel = (obj) => {
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    if (obj && typeof obj === "object") {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/([-_][a-z])/g, (g) =>
          g.toUpperCase().replace("-", "").replace("_", "")
        );
        acc[camelKey] = snakeToCamel(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  // Product select → auto-fill price
  const handleProductSelect = (index, selectedValue) => {
    const selected = products.find(
      (p) => `${p.productName} - ${p.warehouseName}` === selectedValue
    );

    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (selected) {
      item.description = selectedValue;
      item.unitPrice = parseFloat(selected.unit_price ?? selected.price ?? selected.cost ?? 0) || 0;
      const quantity = parseFloat(item.quantity) || 1;
      item.amount = parseFloat((quantity * item.unitPrice).toFixed(2));
    } else {
      item.description = "";
      item.unitPrice = 0;
      item.amount = 0;
    }

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsed = value;

    if (name === "gst") {
      const num = value === "" ? 0 : parseFloat(value);
      parsed = isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
      if (num > 100) toast.warning("GST cannot exceed 100%");
    }

    setFormData({ ...formData, [name]: parsed });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    let parsedValue = value;

    if (name === "quantity") {
      const num = value === "" ? 1 : parseFloat(value);
      parsedValue = isNaN(num) ? 1 : Math.max(1, num);
      if (num < 1) toast.warning("Quantity must be at least 1");
    }

    if (name === "unitPrice") {
      const num = value === "" ? 0 : parseFloat(value);
      parsedValue = isNaN(num) ? 0 : Math.max(0, num);
    }

    newItems[index][name] = parsedValue;

    const q = parseFloat(newItems[index].quantity) || 1;
    const p = parseFloat(newItems[index].unitPrice) || 0;
    newItems[index].amount = parseFloat((q * p).toFixed(2));

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.warning("At least one item is required.");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalCredit = totalAmount + (parseFloat(formData.gst) || 0);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      debitNoteNumber: "",
      date: "",
      originalPoNumber: "",
      originalInvoiceDate: "",
      supplierName: "",
      reasonForIssue: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
      gst: 0,
      remarks: "",
      authorisedSignatory: "",
    });
    setSelectedNote(null);
  };

  // Robust Cleanup Function for Modals
  const cleanupModals = () => {
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());

    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
    document.body.style.removeProperty("overflow");

    // Remove aria-hidden to prevent focus trap
    const modals = ["add-debit-note", "edit-debit-note", "delete-debit-note"];
    modals.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.removeAttribute("aria-hidden");
        el.classList.remove("show");
        el.style.display = "none";
      }
    });
  };

  // Close modal with cleanup
  const closeModal = (id) => {
    const modalEl = document.getElementById(id);

    // Explicitly blur to prevent focus trap
    if (document.activeElement && modalEl && modalEl.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    if (modalEl && window.bootstrap) {
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }

    // Force cleanup after transition
    setTimeout(cleanupModals, 400);
  };

  // Add Debit Note
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.warning(err));
      return;
    }


    const payload = {
      debitNoteNumber: formData.debitNoteNumber || `DN${(debitNotes.length + 1).toString().padStart(3, "0")}`,
      date: formData.date,
      originalPoNumber: formData.originalPoNumber.trim(),
      originalInvoiceDate: formData.originalInvoiceDate || null,
      supplierName: formData.supplierName,
      reasonForIssue: formData.reasonForIssue.trim(),
      items: formData.items.map((item) => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        amount: parseFloat(item.amount) || 0,
      })),
      gst: parseFloat(formData.gst) || 0,
      remarks: formData.remarks.trim(),
      authorisedSignatory: formData.authorisedSignatory.trim(),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
    };




    try {
      console.log("Payload sending to API:", payload);

      const response = await fetch(`${baseapi}/api/debit-note/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      console.log("post RESPONSE STATUS:", response.status);

      if (!response.ok) {
        const errText = await response.json();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      toast.success("Debit note added successfully!");
      await fetchDebitNotes();
      resetForm();
      closeModal("add-debit-note");
    } catch (err) {
      console.error("Add failed:", err);
      toast.error("Failed to add debit note. Please try again.");
    }
  };

  // Edit handler
  const handleEdit = (note) => {
    setSelectedNote(note);
    setFormData({
      debitNoteNumber: note.debitNoteNumber || "",
      date: formatDateForInput(note.date),
      originalPoNumber: note.originalPoNumber || "",
      originalInvoiceDate: formatDateForInput(note.originalInvoiceDate),
      supplierName: note.supplierName || "",
      reasonForIssue: note.reasonForIssue || "",
      items: Array.isArray(note.items)
        ? note.items.map((item) => ({
          description: item.description || "",
          quantity: Math.max(1, parseFloat(item.quantity) || 1),
          unitPrice: Math.max(0, parseFloat(item.unitPrice || item.unit_price || 0)),
          amount: parseFloat((item.amount || 0).toFixed(2)),
        }))
        : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
      gst: Math.max(0, Math.min(100, parseFloat(note.gst) || 0)),
      remarks: note.remarks || "",
      authorisedSignatory: note.authorisedSignatory || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.warning(err));
      return;
    }

    const payload = {
      debitNoteNumber: formData.debitNoteNumber,
      date: formData.date,
      originalPoNumber: formData.originalPoNumber.trim(),
      originalInvoiceDate: formData.originalInvoiceDate || null,
      supplierName: formData.supplierName,
      reasonForIssue: formData.reasonForIssue.trim(),
      items: formData.items.map((item) => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        amount: parseFloat(item.amount) || 0,
      })),
      gst: parseFloat(formData.gst) || 0,
      remarks: formData.remarks.trim(),
      authorisedSignatory: formData.authorisedSignatory.trim(),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
    };

    try {
      const response = await fetch(`${DEBIT_NOTES_API}/${selectedNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      toast.success("Debit note updated successfully!");
      await fetchDebitNotes();
      resetForm();
      closeModal("edit-debit-note");
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update debit note.");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`${DELETE_NOTES}/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      toast.success("Debit note deleted successfully!");
      await fetchDebitNotes();
      setDeleteId(null);
      closeModal("delete-debit-note");

    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete debit note.");
    }
  };


  // Options
  const supplierOptions = loadingSuppliers ? (
    <option disabled>Loading suppliers...</option>
  ) : errorSuppliers ? (
    <option disabled>Error loading suppliers</option>
  ) : (
    <>
      <option value="">Select Supplier</option>
      {suppliers.map((s) => (
        <option key={s.id ?? s.supplier} value={s.supplier ?? s.value ?? s.id}>
          {s.supplier ?? s.value ?? s.company ?? `Supplier ${s.id}`}
        </option>
      ))}
    </>
  );

  console.log(suppliers, "prem")

  const productOptions = loadingProducts ? (
    <option disabled>Loading products...</option>
  ) : errorProducts ? (
    <option disabled>Error loading products</option>
  ) : (
    <>
      <option value="">Select Product</option>
      {products.map((p) => {
        const uniqueValue = `${p.productName} - ${p.warehouseName}`;
        return (
          <option key={p.id} value={uniqueValue}>
            {uniqueValue} (Qty: {p.quantity})
          </option>
        );
      })}
    </>
  );

  console.log("Check the Product : ", products)

  const renderFormBody = () => (
    <div className="row g-3">
      {/* Row 1: Debit Note Number & Date */}
      <div className="col-md-6">
        <label className="form-label">Debit Note Number</label>
        <input
          type="text"
          name="debitNoteNumber"
          value={formData.debitNoteNumber}
          onChange={handleInputChange}
          className="form-control"
          placeholder="Auto-generated if empty"
        />
      </div>
      <div className="col-md-6">
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

      {/* Row 2: Original PO & Date */}
      <div className="col-md-6">
        <label className="form-label">Original PO Number</label>
        <input
          type="text"
          name="originalPoNumber"
          value={formData.originalPoNumber}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Original Invoice Date</label>
        <input
          type="date"
          name="originalInvoiceDate"
          value={formData.originalInvoiceDate}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>

      {/* Row 3: Supplier & Reason */}
      <div className="col-md-6">
        <label className="form-label">Supplier Name *</label>
        <select
          name="supplierName"
          value={formData.supplierName}
          onChange={handleInputChange}
          className="form-control"
          required
        >
          {supplierOptions}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label">Reason for Issue *</label>
        <input
          type="text"
          name="reasonForIssue"
          value={formData.reasonForIssue}
          onChange={handleInputChange}
          className="form-control"
          required
        />
      </div>

      {/* Full Width: Items Section */}
      <div className="col-12">
        <h6 className="mb-2">Items</h6>
        {formData.items.map((item, index) => (
          <div key={index} className="row g-2 mb-2 align-items-center">
            <div className="col-md-4">
              <select
                value={item.description}
                onChange={(e) => handleProductSelect(index, e.target.value)}
                className="form-control form-control-sm"
                required
              >
                {productOptions}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="quantity"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, e)}
                className="form-control form-control-sm"
                placeholder="Qty"
                min="1"
                step="1"
                required
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="unitPrice"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, e)}
                className="form-control form-control-sm"
                placeholder="Price"
                min="0"
                step="0.01"
                readOnly
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                value={parseFloat(item.amount).toFixed(2)}
                readOnly
                className="form-control form-control-sm bg-light"
              />
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-danger btn-sm w-100"
                onClick={() => removeItem(index)}
                disabled={formData.items.length === 1}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-link p-0 text-primary" onClick={addItem}>
          + Add Item
        </button>
      </div>

      {/* Row 4: Totals */}
      <div className="col-md-4">
        <label className="form-label">Total Amount</label>
        <input
          type="text"
          value={totalAmount.toFixed(2)}
          readOnly
          className="form-control form-control-sm bg-light"
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">GST (%)</label>
        <input
          type="number"
          name="gst"
          value={formData.gst}
          onChange={handleInputChange}
          className="form-control form-control-sm"
          min="0"
          max="100"
          step="0.01"
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Total Credit</label>
        <input
          type="text"
          value={totalCredit.toFixed(2)}
          readOnly
          className="form-control form-control-sm bg-light"
        />
      </div>

      {/* Row 5: Signatory & Remarks */}
      <div className="col-md-6">
        <label className="form-label">Authorised Signatory</label>
        <input
          type="text"
          name="authorisedSignatory"
          value={formData.authorisedSignatory}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleInputChange}
          className="form-control"
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="page-title">
              <h4>Debit Note</h4>
              <h6>Manage your debit notes</h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              <TableTopHead />
              <div className="page-btn">
                <Link to="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-debit-note">
                  + Add Debit Note
                </Link>
              </div>
            </div>
          </div>

          <div className="card mt-3 p-3">
            <div className="table-responsive">
              {loading ? (
                <p className="text-center">Loading debit notes...</p>
              ) : error ? (
                <p className="text-danger text-center">{error}</p>
              ) : debitNotes.length === 0 ? (
                <p className="text-center">No debit notes found.</p>
              ) : (
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>S.no</th>
                      <th>Debit Note #</th>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Total Amount</th>
                      <th>GST</th>
                      <th>Total Credit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debitNotes.map((note, idx) => (
                      <tr key={note.id}>
                        <td>{idx + 1}</td>
                        <td>{note.debitNoteNumber}</td>
                        <td>{note.date ? new Date(note.date).toLocaleDateString() : "-"}</td>
                        <td>{note.supplierName}</td>
                        <td>${(note.totalAmount || 0).toFixed(2)}</td>
                        <td>${(note.gst || 0).toFixed(2)}</td>
                        <td>${(note.totalCredit || 0).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-info me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-debit-note"
                            onClick={() => handleEdit(note)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            data-bs-toggle="modal"
                            data-bs-target="#delete-debit-note"
                            onClick={() => setDeleteId(note.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="add-debit-note">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Debit Note</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => closeModal("add-debit-note")}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">{renderFormBody()}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModal("add-debit-note")}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-debit-note">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Debit Note</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => closeModal("edit-debit-note")}
              ></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              {/* Reusing renderFormBody works if state is shared, but usually Edit uses its own state or shared state. 
                    DebitNote.jsx seems to use shared formData state for both Add/Edit based on previous read. 
                */}
              <div className="modal-body">{renderFormBody()}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModal("edit-debit-note")}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-debit-note">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Debit Note</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => closeModal("delete-debit-note")}
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this debit note?</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => closeModal("delete-debit-note")}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-debit-note">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Debit Note</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">{renderFormBody()}</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-debit-note">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this debit note?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DebitNote;
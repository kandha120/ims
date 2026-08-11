import { useState, useEffect } from "react";
import axios from "axios";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import DeleteModal from "../../components/delete-modal";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { toast } from "react-toastify";

import baseapi from "../../env/baseapi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";

const API_BASE = baseapi ? `${baseapi}/api` : "http://localhost:8200/api";

const PurchasesList = () => {
  const [listData, setListData] = useState([]);
  const [rows, setRows] = useState(10);

  // Form States
  const [supplierName, setSupplierName] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date());
  const [orderTax, setOrderTax] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [description, setDescription] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);

  const [item, setItem] = useState({
    productSku: "",
    quantity: 1,
    cost: 0,
    discount: 0,
    tax: 0,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);



  // ------------------------
  // FETCH PURCHASES FUNCTION
  // ------------------------
  const fetchPurchases = async () => {
    try {
      console.log("Fetching purchases...");

      const res = await axios.get(`${API_BASE}/purchases`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("Purchase API Response:", res.data);

      const rawList = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      const mappedList = rawList.map((item) => ({
        id: item.id,
        supplierName: item.supplierName,
        reference: item.reference,
        date: item.date,
        productSku: item.productSku,
        quantity: item.quantity,
        cost: item.cost,
        discount: item.discount,
        tax: item.tax,
        orderTax: item.orderTax,
        orderDiscount: item.orderDiscount,
        shippingStatus: item.shippingStatus,
        description: item.description,
        items: item.items || [],
        paid: item.paid,
        due: item.due,
        grandTotal: item.grandTotal,
      }));

      setListData(mappedList);
    } catch (err) {
      console.error("Purchase Fetch Error:", err);
      toast.error("Failed to load purchases");
    }
  };

  // ------------------------
  // LOAD PURCHASES + SUPPLIERS + PRODUCTS
  // ------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const [supRes, prodRes, stockRes] = await Promise.all([
          axios.get(`${API_BASE}/suppliers`, { withCredentials: true }),
          axios.get(`${API_BASE}/products`, { withCredentials: true }),
          axios.get(`${API_BASE}/stock/all`, { withCredentials: true })
        ]);

        setSuppliers(
          Array.isArray(supRes.data)
            ? supRes.data
            : supRes.data?.results || []
        );

        // Catalog Data
        const catalogList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || prodRes.data?.data || []);

        // Stock Data
        const stockList = Array.isArray(stockRes.data) ? stockRes.data : (stockRes.data?.products || stockRes.data?.data || []);

        // Merge Logic: Stock Entries + Catalog Entries (that don't have stock or are just base reference)
        // Actually for Purchase, we might want to prioritize Stock Entries to show existing warehouses.
        // If a product has NO stock entries, we show the Catalog entry (Default/Unallocated).

        const mergedList = [];
        const processedNames = new Set(); // Track processed catalog names to associate stock

        // Create a map of catalog items for easy lookup
        const catalogMap = new Map();
        catalogList.forEach(c => {
          const name = c.productName || c.product_name || c.name || c.product || c.title;
          if (name) catalogMap.set(name, c);
        });

        // 1. Add All Stock Entries (These represent specific warehouses)
        stockList.forEach(stockItem => {
          const catItem = catalogMap.get(stockItem.productName);
          mergedList.push({
            ...stockItem, // Keep stock ID and details
            productName: stockItem.productName,
            sku: stockItem.sku || (catItem ? catItem.sku || catItem.productSku : ""),
            warehouseName: stockItem.warehouse?.name || stockItem.warehouse || "Unknown Warehouse",
            // Inherit price/cost from catalog if missing in stock
            cost: stockItem.cost || (catItem ? catItem.cost || catItem.purchase_price : 0),
            price: stockItem.price || (catItem ? catItem.sale_price || catItem.price : 0),
            tax: stockItem.tax || (catItem ? catItem.tax : 0),
            discount: stockItem.discount || (catItem ? catItem.discount : 0),
            id: stockItem.id // Stock ID
          });
        });

        // 2. Add Catalog Items that were NOT in Stock List (meaning 0 stock or new products)
        // But wait, if we want to Add Purchase for a NEW warehouse, we currently can't via this dropdown 
        // unless we add a "New Warehouse" option or similar. 
        // For now, let's just ensure we capture everything that IS in the system.

        // If we strictly want to match User Request: "iPhone available in 2 warehouses... shown accordingly", 
        // then step 1 above covers it (both stock entries added).
        // What about items with 0 stock? Do they appear in stockList? 
        // If not, we should add them from Catalog.

        const stockProductNames = new Set(stockList.map(s => s.productName));

        catalogList.forEach(catItem => {
          const name = catItem.productName || catItem.product_name || catItem.name || catItem.product || catItem.title;
          if (name && !stockProductNames.has(name)) {
            // Add as generic/default warehouse item
            mergedList.push({
              ...catItem,
              productName: name,
              sku: catItem.sku || catItem.productSku,
              warehouseName: catItem.warehouse || "Unallocated",
              cost: catItem.cost || catItem.purchase_price || 0,
              price: catItem.sale_price || catItem.price || 0,
              // Generate a specialized ID to avoid collision if needed, or use cat ID
              id: `cat-${catItem.id}`
            });
          }
        });

        setProducts(mergedList);

      } catch (err) {
        console.error("Supplier/Product Load Error:", err);
      }

      fetchPurchases();
    };

    loadData();
  }, []);

  // ------------------------
  // OPEN EDIT MODAL
  // ------------------------
  const openEdit = (purchase) => {
    setEditId(purchase.id);
    setSupplierName(purchase.supplierName || "");
    setReference(purchase.reference || "");
    setDate(new Date(purchase.date));
    setOrderTax(purchase.orderTax || 0);
    setOrderDiscount(purchase.orderDiscount || 0);
    setPaidAmount(purchase.paid || 0);
    setStatus(purchase.shippingStatus || "PENDING");
    setDescription(purchase.description || "");

    setItem({
      productSku: purchase.productSku || "",
      quantity: purchase.quantity || 1,
      cost: purchase.cost || 0,
      discount: purchase.discount || 0,
      tax: purchase.tax || 0,
    });

    new bootstrap.Modal(document.getElementById("add-purchase")).show();
  };

  // Reset Form
  const resetForm = () => {
    setEditId(null);
    setSupplierName("");
    setReference("");
    setDate(new Date());
    setOrderTax(0);
    setOrderDiscount(0);
    setPaidAmount(0);
    setStatus("PENDING");
    setDescription("");
    setItem({ productSku: "", quantity: 1, cost: 0, discount: 0, tax: 0 });
  };

  // Helper to force remove backdrop
  const removeBackdrop = () => {
    document.body.classList.remove("modal-open");
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "0px";
  };

  // ADD / EDIT API SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate item
    if (!item || !item.productSku) {
      toast.error("Please add at least 1 item!");
      return;
    }

    const payload = {
      supplierName,
      reference,
      date: date?.toISOString()?.split("T")[0],
      orderTax: Number(orderTax),
      orderDiscount: Number(orderDiscount),
      shippingStatus: status,
      description,
      paid: Number(paidAmount),
      due: (Number(item.quantity) * Number(item.cost)) + Number(orderTax) - Number(orderDiscount) - Number(paidAmount),
      grandTotal: (Number(item.quantity) * Number(item.cost)) + Number(orderTax) - Number(orderDiscount),

      // Flatten item details for backend (single item per purchase)
      productSku: item.productSku,
      quantity: Number(item.quantity),
      cost: Number(item.cost),
      discount: Number(item.discount),
      tax: Number(item.tax),
      warehouseName: item.warehouseName
    };

    try {
      if (editId) {
        await axios.put(`${API_BASE}/purchases/${editId}`, payload, {
          withCredentials: "include",
        });
        toast.success("Purchase Updated!");
      } else {
        await axios.post(`${API_BASE}/purchases`, payload, {
          withCredentials: "include",
        });
        toast.success("Purchase Added!");
      }

      resetForm();
      fetchPurchases();

      // Close modal (standard way)
      const modalEl = document.getElementById("add-purchase");
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();

      // Force cleanup
      setTimeout(removeBackdrop, 200);

    } catch (err) {
      console.error(err);
      toast.error("Save Failed!");
    }
  };


  // ------------------------
  // DELETE
  // ------------------------
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/purchases/${deleteId}`, {
        withCredentials: true,
      });
      toast.success("Deleted Successfully!");
      setDeleteId(null);
      fetchPurchases();

      const deleteModal = bootstrap.Modal.getInstance(document.getElementById("delete-modal"));
      deleteModal?.hide();

      // Force cleanup
      setTimeout(removeBackdrop, 200);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Product Change → Auto Cost
  const handleProductChange = (val, option) => {

    setItem((prev) => ({
      ...prev,
      productSku: val,
      warehouseName: option ? option.warehouseName : "",
    }));
  };

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Orders List", 14, 22);

    const tableColumn = ["S.No", "Supplier", "Reference", "Date", "Status", "Grand Total", "Paid", "Due"];
    const tableRows = listData.map((item, index) => [
      index + 1,
      item.supplierName,
      item.reference,
      item.date ? new Date(item.date).toISOString().split('T')[0] : "-",
      item.shippingStatus,
      Number(item.grandTotal || 0).toFixed(2),
      Number(item.paid || 0).toFixed(2),
      Number(item.due || 0).toFixed(2),
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
      ["S.No", "Supplier", "Reference", "Date", "Status", "Grand Total", "Paid", "Due"],
      ...listData.map((item, index) => [
        index + 1,
        `"${item.supplierName || ""}"`,
        `"${item.reference || ""}"`,
        `"${item.date ? new Date(item.date).toISOString().split('T')[0] : "-"}"`,
        `"${item.shippingStatus || ""}"`,
        Number(item.grandTotal || 0).toFixed(2),
        Number(item.paid || 0).toFixed(2),
        Number(item.due || 0).toFixed(2),
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

  const handleDownloadRowPDF = (row) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Purchase Order", 14, 20);

    doc.setFontSize(10);
    doc.text(`Reference: ${row.reference || "N/A"}`, 14, 30);
    doc.text(`Date: ${row.date ? new Date(row.date).toLocaleDateString() : "N/A"}`, 14, 35);
    doc.text(`Supplier: ${row.supplierName || "N/A"}`, 14, 40);

    const tableColumn = ["Product SKU", "Qty", "Cost", "Total"];
    // If items are flattened or available
    const items = row.items && row.items.length > 0 ? row.items : [{
      productSku: row.productSku,
      quantity: row.quantity,
      cost: row.cost,
      total: Number(row.grandTotal || 0)
    }];

    const tableRows = items.map((item) => [
      item.productSku || "N/A",
      item.quantity || 0,
      Number(item.cost || 0).toFixed(2),
      Number(item.total || (item.quantity * item.cost) || 0).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Grand Total: ${(Number(row.grandTotal || row.total) || 0).toFixed(2)}`, 14, finalY);

    doc.save(`Purchase_${row.reference || "doc"}.pdf`);
  };

  const columns = [
    { header: "S.No", body: (_, { rowIndex }) => rowIndex + 1 },
    { header: "Supplier", field: "supplierName" },
    { header: "Reference", field: "reference" },
    {
      header: "Date",
      body: (r) =>
        r.date ? new Date(r.date).toISOString().split('T')[0] : "-",
    },
    {
      header: "Status",
      body: (r) => (
        <span
          className={`badge ${r.shippingStatus === "RECEIVED"
            ? "badge-success"
            : r.shippingStatus === "PENDING"
              ? "badge-warning"
              : "badge-danger"
            }`}
        >
          {r.shippingStatus}
        </span>
      ),
    },
    { header: "Tax", field: "orderTax" },
    { header: "Discount", field: "orderDiscount" },
    {
      header: "Grand Total",
      body: (r) => {
        // Try backend total first
        if (r.grandTotal || r.total) {
          return <span>₹{Number(r.grandTotal || r.total).toFixed(2)}</span>;
        }

        // Fallback: Check for flat items (quantity * cost)
        let subtotal = 0;
        if (r.quantity && r.cost) {
          subtotal = Number(r.quantity) * Number(r.cost);
        } else if (r.items && r.items.length > 0) {
          subtotal = r.items.reduce((acc, i) => acc + (i.total || (i.quantity * i.cost)), 0);
        }

        const total = subtotal + (r.orderTax || 0) + (r.freightCharges || 0) - (r.orderDiscount || 0);
        return <span>₹{total.toFixed(2)}</span>;
      }
    },
    {
      header: "Paid",
      body: (r) => <span>₹{(r.paid || 0).toFixed(2)}</span>
    },
    {
      header: "Due",
      body: (r) => <span>₹{(r.due || 0).toFixed(2)}</span>
    },
    {
      header: "Actions",
      body: (row) => (
        <div className="d-flex align-items-center gap-2">
          <button
            className="bg-transparent border-0 p-0 text-success hover-scale me-2"
            onClick={() => handleDownloadRowPDF(row)}
            title="Download PDF"
            style={{ display: "inline-flex" }}
          >
            <FiDownload size={20} />
          </button>
          <button
            className="bg-transparent border-0 p-0 text-warning hover-scale me-2"
            onClick={() => openEdit(row)}
            title="Edit"
            style={{ display: "inline-flex" }}
          >
            <FiEdit size={20} />
          </button>
          <button
            className="bg-transparent border-0 p-0 text-danger hover-scale"
            onClick={() => setDeleteId(row.id)}
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            title="Delete"
            style={{ display: "inline-flex" }}
          >
            <FiTrash2 size={20} />
          </button>
        </div>
      ),
    },
  ];

  const supplierOptions = suppliers.map((s) => ({
    label: s.supplierName || s.firstName + " " + s.lastName,
    value: s.supplierName || s.firstName + " " + s.lastName,
  }));

  // No De-duplication: Show ALL products (so same product in different warehouses is listed)
  const productOptions = products.map((p) => {
    const sku = p.sku || p.productSku;
    const warehouse = p.warehouseName || (p.warehouse ? p.warehouse.name : "Unknown Warehouse");

    return {
      label: `${p.productName || "Product"} (SKU: ${sku}) - ${warehouse}`,
      value: sku,
      warehouseName: warehouse // Store warehouse in option
    };
  });


  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-center justify-content-between transfer">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Purchase</h4>
                <h6>Manage your purchases</h6>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <TableTopHead
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onRefresh={fetchPurchases}
              />
              <div className="page-btn">
                <button
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add-purchase"
                  onClick={resetForm}
                >
                  Add Purchase
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <SearchFromApi
                callback={() => { }}
                rows={rows}
                setRows={setRows}
              />
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={listData}
                  rows={rows}
                  setRows={setRows}
                  totalRecords={listData.length}
                />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add/Edit Modal */}
      <div
        className="modal fade"
        id="add-purchase"
        tabIndex="-1"
        aria-labelledby="add-purchase-label"
      >
        <div className="modal-dialog purchase modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4 id="add-purchase-label">{editId ? "Edit Purchase" : "Add Purchase"}</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-4 mb-3">
                    <label>Supplier Name *</label>
                    <CommonSelect
                      options={[
                        { label: "Select", value: "" },
                        ...supplierOptions,
                      ]}
                      value={supplierName}
                      onChange={(o) => setSupplierName(o.value)}
                    />
                  </div>

                  <div className="col-lg-4 mb-3">
                    <label>Reference *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={reference}
                      onChange={(e) =>
                        setReference(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="col-lg-4 mb-3">
                    <label>Date</label>
                    <CommonDatePicker
                      value={date}
                      onChange={setDate}
                    />
                  </div>
                </div>

                <h5>Item Details</h5>
                <div className="row">
                  <div className="col-lg-3 mb-3">
                    <label>Product SKU</label>
                    <CommonSelect
                      options={[
                        { label: "Select", value: "" },
                        ...productOptions,
                      ]}
                      value={item.productSku}
                      onChange={(o) =>
                        handleProductChange(o.value, o)
                      }
                    />
                  </div>

                  <div className="col-lg-2 mb-3">
                    <label>Qty</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Allow manual erase
                        if (val === "") {
                          setItem({ ...item, quantity: "" });
                          return;
                        }

                        // Convert and enforce minimum
                        const num = Number(val);
                        setItem({ ...item, quantity: num < 1 ? 1 : num });
                      }}
                    />
                  </div>


                  <div className="col-lg-2 mb-3">
                    <label>Cost</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      value={item.cost}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Allow manual erase
                        if (val === "") {
                          setItem({ ...item, cost: "" });
                          return;
                        }

                        // Convert and enforce minimum
                        const num = Number(val);
                        setItem({ ...item, cost: num < 1 ? 1 : num });
                      }}
                    />
                  </div>

                  <div className="col-lg-2 mb-3">
                    <label>Discount</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-control"
                      value={item.discount}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Allow manual erase
                        if (val === "") {
                          setItem({ ...item, discount: "" });
                          return;
                        }

                        // Convert and enforce min = 0
                        const num = Number(val);
                        setItem({ ...item, discount: num < 0 ? 0 : num });
                      }}
                    />
                  </div>


                  <div className="col-lg-2 mb-3">
                    <label>Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-control"
                      value={item.tax}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Allow manual erase
                        if (val === "") {
                          setItem({ ...item, tax: "" });
                          return;
                        }

                        // Convert and enforce minimum = 1
                        const num = Number(val);
                        setItem({ ...item, tax: num < 1 ? 1 : num });
                      }}
                    />
                  </div>

                </div>

                <h5>Order Summary</h5>
                <div className="row">
                  <div className="col-lg-4 mb-3">
                    <label>Order Tax</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      value={orderTax}
                      onChange={(e) =>
                        setOrderTax(e.target.value)
                      }
                    />
                  </div>

                  <div className="col-lg-4 mb-3">
                    <label>Order Discount</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      value={orderDiscount}
                      onChange={(e) =>
                        setOrderDiscount(e.target.value)
                      }
                    />
                  </div>

                  <div className="col-lg-4 mb-3">
                    <label>Status</label>
                    <CommonSelect
                      options={[
                        {
                          label: "PENDING",
                          value: "PENDING",
                        },
                        {
                          label: "RECEIVED",
                          value: "RECEIVED",
                        },
                        {
                          label: "CANCELLED",
                          value: "CANCELLED",
                        },
                      ]}
                      value={status}
                      onChange={(o) => setStatus(o.value)}
                    />
                  </div>

                  <div className="col-lg-4 mb-3">
                    <label>Paid Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? "Update" : "Add"} Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      <div
        className="modal fade"
        id="delete-modal"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center py-4">
              <h5>Delete Purchase?</h5>
              <p>Are you sure?</p>
              <button
                type="button"
                className="btn btn-secondary me-3"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchasesList;

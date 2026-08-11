import React, { useState, useEffect } from "react";
import CommonFooter from "../../components/footer/commonFooter";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseapi from "../../env/baseapi";
import { FiEdit, FiTrash2, FiDownload } from "react-icons/fi"; // Icons da macha
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import TableTopHead from "../../components/table-top-head";

// APIs - FULL CORRECT
const GET_SALES_ORDERS = `${baseapi}/api/sales-order/all`;
const ADD_SALES_ORDER = `${baseapi}/api/sales-order/add`;
const UPDATE_SALES_ORDER = `${baseapi}/api/sales-order/update`;     // PUT
const DELETE_SALES_ORDER = `${baseapi}/api/sales-order/delete`;     // DELETE

// =============== ADD / EDIT MODAL (Refactored to Bootstrap - Matching Sales Return Style) ===============
const AddSalesOrder = ({ onSave, orderData }) => {
  const initialSoInfo = {
    soNo: "",
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    contactEmail: "",
    contactPhone: "",
    billingAddress: "",
    shippingAddress: "",
    customerGSTIN: "",
    salesperson: "",
    paymentTerms: "",
    expectedDelivery: "",
    deliveryCharges: 0,
    termsAndConditions: "",
    status: "PENDING",
  };

  const initialOrderDetails = [{
    sNo: 1,
    productName: "",
    warehouseName: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    discount: 0,
    tax: 0,
    total: 0,
  }];

  const [soInfo, setSoInfo] = useState(initialSoInfo);
  const [orderDetails, setOrderDetails] = useState(initialOrderDetails);

  const [stockData, setStockData] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Sync state with orderData
  useEffect(() => {
    if (orderData) {
      setSoInfo(orderData.soInfo);
      setOrderDetails(orderData.orderDetails);
    } else {
      setSoInfo(initialSoInfo);
      setOrderDetails(initialOrderDetails);
    }
  }, [orderData]);

  // Unique Products for Dropdown
  const uniqueProducts = [...new Set(products.map(p => p.productName || p.name))];

  // Fetch Stock Data
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`${baseapi}/api/stock/all`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setStockData(Array.isArray(data) ? data : data.data || []);
      } catch { console.error("Failed to load stock data"); }
    };
    fetchStock();
  }, []);

  // Fetch Products & Customers
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${baseapi}/api/products`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.products || data.data || []);
      } catch { toast.error("Failed to load products"); }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${baseapi}/api/customers`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : data.data || data.customers || []);
      } catch { toast.error("Failed to load customers"); }
    };
    fetchCustomers();
  }, []);

  const handleSoChange = (e) => setSoInfo({ ...soInfo, [e.target.name]: e.target.value });

  const handleCustomerSelect = (id) => {
    const cust = customers.find(c => (c.id || c.customer_id || c._id) == id);
    if (cust) {
      setSoInfo({
        ...soInfo,
        customerId: id,
        customerName: cust.customer_name || cust.name || cust.email || "Unknown",
        contactEmail: cust.email || "",
        contactPhone: cust.phone || "",
        billingAddress: cust.address || "",
        shippingAddress: cust.address || "",
        customerGSTIN: cust.gstin || "",
      });
    }
  };

  // Get Warehouses for selected product (Based on STOCK data)
  const getWarehousesForProduct = (prodName) => {
    // specific logic: filter stock records for this product
    return stockData.filter(s => s.productName === prodName && (parseFloat(s.quantity) > 0));
  };


  const handleItemChange = (index, field, value) => {
    const items = [...orderDetails];
    items[index][field] = value;

    if (field === "productName") {
      items[index][field] = value;
      items[index].warehouseName = "";
      items[index].availableQty = 0;
      items[index].unitPrice = 0;
      items[index].unit = "pcs";
      items[index].tax = 0;
    } else if (field === "warehouseName") {
      items[index][field] = value;

      // 1. Find Price/Tax from Product Catalog (since Stock API might not have price)
      const catalogProd = products.find(p => (p.productName || p.name) === items[index].productName);

      // 2. Find Quantity from Stock API (Source of Truth)
      const stockEntry = stockData.find(s => s.productName === items[index].productName && (s.warehouse || s.warehouseName) === value);

      if (catalogProd) {
        items[index].unitPrice = parseFloat(catalogProd.price || catalogProd.selling_price || 0) || 0;
        items[index].unit = catalogProd.unit || "pcs";
        items[index].tax = parseFloat(catalogProd.tax || catalogProd.gst || 0) || 0;
      }

      if (stockEntry) {
        items[index].availableQty = parseInt(stockEntry.quantity || 0);
      } else {
        items[index].availableQty = 0;
      }

    } else {
      items[index][field] = value;
    }

    const qty = parseFloat(items[index].quantity) || 0;
    const price = parseFloat(items[index].unitPrice) || 0;
    const disc = parseFloat(items[index].discount) || 0;
    const tax = parseFloat(items[index].tax) || 0;
    items[index].total = parseFloat(((qty * price - disc) * (1 + tax / 100)).toFixed(2));

    setOrderDetails(items);
  };

  const addItem = () => {
    setOrderDetails([...orderDetails, {
      sNo: orderDetails.length + 1,
      productName: "", warehouseName: "", quantity: 1, unit: "pcs", unitPrice: 0, discount: 0, tax: 0, total: 0
    }]);
  };

  const removeItem = (i) => {
    setOrderDetails(orderDetails.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, sNo: idx + 1 })));
  };

  const handleSave = () => {
    if (!soInfo.soNo || !soInfo.customerId || !soInfo.date || orderDetails.some(i => !i.productName)) {
      toast.error("Please fill all required fields!");
      return;
    }
    onSave({ soInfo, orderDetails });
  };

  return (
    <div className="modal fade" id="add-sales-order-modal">
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">{orderData ? "Edit Sales Order" : "Add Sales Order"}</h4>
            <button type="button" className="close" onClick={() => closeModal("add-sales-order-modal")}>
              <span>×</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="card border-0">
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">SO No <span className="text-danger">*</span></label>
                      <input name="soNo" value={soInfo.soNo} onChange={handleSoChange} className="form-control" placeholder="SO-001" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date <span className="text-danger">*</span></label>
                      <input type="date" name="date" value={soInfo.date} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Customer <span className="text-danger">*</span></label>
                      <select value={soInfo.customerId} onChange={(e) => handleCustomerSelect(e.target.value)} className="form-select">
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                          <option key={c.id || c.customer_id} value={c.id || c.customer_id}>
                            {c.customer_name || c.name || c.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input name="contactEmail" value={soInfo.contactEmail} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input name="contactPhone" value={soInfo.contactPhone} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Billing Address</label>
                      <input name="billingAddress" value={soInfo.billingAddress} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Shipping Address</label>
                      <input name="shippingAddress" value={soInfo.shippingAddress} onChange={handleSoChange} className="form-control" />
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">GSTIN</label>
                      <input name="customerGSTIN" value={soInfo.customerGSTIN} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Salesperson</label>
                      <input name="salesperson" value={soInfo.salesperson} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Payment Terms</label>
                      <input name="paymentTerms" value={soInfo.paymentTerms} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Expected Delivery</label>
                      <input type="date" name="expectedDelivery" value={soInfo.expectedDelivery} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Delivery Charges</label>
                      <input type="number" name="deliveryCharges" value={soInfo.deliveryCharges} onChange={handleSoChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select name="status" value={soInfo.status} onChange={handleSoChange} className="form-select">
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Terms & Conditions</label>
                      <textarea name="termsAndConditions" value={soInfo.termsAndConditions} onChange={handleSoChange} rows={3} className="form-control" />
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="table-responsive mb-3">
                  <table className="table datanew text-center">
                    <thead>
                      <tr>
                        {["S.No", "Product", "Warehouse", "Qty", "Unit", "Price", "Disc", "Tax%", "Total", "Action"].map(h => (
                          <th key={h} className="p-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((item, i) => (
                        <tr key={i}>
                          <td className="p-2">{item.sNo}</td>
                          <td className="p-2">
                            <select value={item.productName} onChange={(e) => handleItemChange(i, "productName", e.target.value)} className="form-select form-select-sm" style={{ minWidth: "150px" }}>
                              <option value="">Select Product</option>
                              {uniqueProducts.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select value={item.warehouseName} onChange={(e) => handleItemChange(i, "warehouseName", e.target.value)} className="form-select form-select-sm" disabled={!item.productName} style={{ minWidth: "150px" }}>
                              <option value="">Select Warehouse</option>
                              {getWarehousesForProduct(item.productName).map((p, i) => (
                                <option key={i} value={p.warehouse || p.warehouseName}>
                                  {p.warehouse || p.warehouseName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <input type="number" value={item.quantity} onChange={e => handleItemChange(i, "quantity", e.target.value)} className="form-control form-control-sm" style={{ width: "70px" }} min="1" />
                              {item.warehouseName && <small className="text-muted">/ {item.availableQty}</small>}
                            </div>
                          </td>
                          <td className="p-2"><input value={item.unit} onChange={e => handleItemChange(i, "unit", e.target.value)} className="form-control form-control-sm" style={{ width: "60px" }} /></td>
                          <td className="p-2"><input type="number" value={item.unitPrice} onChange={e => handleItemChange(i, "unitPrice", e.target.value)} className="form-control form-control-sm" style={{ width: "80px" }} step="0.01" /></td>
                          <td className="p-2"><input type="number" value={item.discount} onChange={e => handleItemChange(i, "discount", e.target.value)} className="form-control form-control-sm" style={{ width: "60px" }} /></td>
                          <td className="p-2"><input type="number" value={item.tax} onChange={e => handleItemChange(i, "tax", e.target.value)} className="form-control form-control-sm" style={{ width: "60px" }} /></td>
                          <td className="p-2 fw-bold">₹{item.total}</td>
                          <td className="p-2">
                            <button onClick={() => removeItem(i)} className="btn btn-sm btn-danger">
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={addItem} className="btn btn-primary btn-sm mb-3">
                  + Add Item
                </button>
              </div></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => closeModal("add-sales-order-modal")}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              {orderData ? "Update Order" : "Save Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============== MAIN PAGE WITH EDIT & DELETE ===============
const SalesOrder = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [editOrder, setEditOrder] = useState(null);

  const fetchSalesOrders = async () => {
    try {
      const res = await fetch(GET_SALES_ORDERS, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];

      const formatted = list.map(order => ({
        id: order.id || order._id,
        soInfo: {
          soNo: order.soNo || order.so_number || "N/A",
          date: order.date?.split("T")[0] || "",
          customerId: order.customer || order.customerName, // Backend only stores 'customer' string
          customerName: order.customer || order.customerName || "Unknown",
          contactEmail: order.email || "",
          contactPhone: order.phone || "",
          billingAddress: order.billingAddress || "",
          shippingAddress: order.shippingAddress || "",
          customerGSTIN: order.customerGstin || "",
          salesperson: order.salesperson || "",
          paymentTerms: order.paymentTerms || "",
          expectedDelivery: order.expectedDelivery?.split("T")[0] || "",
          deliveryCharges: order.deliveryCharges || 0,
          termsAndConditions: order.termsAndConditions || "",
          status: order.status || "PENDING",
        },
        orderDetails: (order.items || []).map((it, i) => ({
          sNo: i + 1,
          productName: it.productName || it.description || "Item",
          warehouseName: it.warehouseName || "", // Add warehouseName
          quantity: it.quantity || 1,
          unit: "pcs",
          unitPrice: it.unitPrice || 0,
          availableQty: 0,
          discount: 0,
          tax: 0,
          total: (it.total || ((it.quantity || 0) * (it.unitPrice || 0))).toFixed(2)
        }))
      }));
      setSalesOrders(formatted);
    } catch (err) {
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const handleSave = async (order) => {
    try {
      const payload = {
        soNo: order.soInfo.soNo,
        customer: order.soInfo.customerName,
        email: order.soInfo.contactEmail,
        phone: order.soInfo.contactPhone,
        billingAddress: order.soInfo.billingAddress,
        shippingAddress: order.soInfo.shippingAddress,
        customerGstin: order.soInfo.customerGSTIN,
        salesperson: order.soInfo.salesperson,
        paymentTerms: order.soInfo.paymentTerms,
        expectedDelivery: order.soInfo.expectedDelivery,
        deliveryCharges: parseFloat(order.soInfo.deliveryCharges) || 0,
        termsAndConditions: order.soInfo.termsAndConditions,
        status: order.soInfo.status,
        date: order.soInfo.date,
        items: order.orderDetails.map(it => ({
          productName: it.productName,
          warehouseName: it.warehouseName,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
        })),
      };

      const url = editOrder ? `${UPDATE_SALES_ORDER}/${editOrder.id}` : ADD_SALES_ORDER;
      const method = editOrder ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Operation failed");
      }

      toast.success(editOrder ? "Updated Successfully!" : "Added Successfully!");
      fetchSalesOrders();
      closeModal("add-sales-order-modal");
      setEditOrder(null);
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // DOWNLOAD PDF
  const handleDownloadPDF = (order) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Sales Order", 14, 22);

    doc.setFontSize(11);
    doc.text(`SO No: ${order.soInfo.soNo}`, 14, 32);
    doc.text(`Date: ${order.soInfo.date}`, 14, 38);
    doc.text(`Customer: ${order.soInfo.customerName}`, 14, 44);
    doc.text(`Status: ${order.soInfo.status}`, 14, 50);

    const tableColumn = ["S.No", "Product", "Qty", "Unit", "Price", "Discount", "Tax %", "Total"];
    const tableRows = [];

    order.orderDetails.forEach((item, index) => {
      const rowData = [
        index + 1,
        item.productName,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.discount,
        item.tax,
        item.total,
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      startY: 58,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save(`SalesOrder_${order.soInfo.soNo}.pdf`);
  };

  // DELETE FUNCTION
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this Sales Order permanently?")) return;

    try {
      const res = await fetch(`${DELETE_SALES_ORDER}/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted Successfully!");
      fetchSalesOrders();
    } catch {
      toast.error("Delete failed!");
    }
  };

  const handleEdit = (order) => {
    setEditOrder(order);
    openModal("add-sales-order-modal");
  };

  const handleAdd = () => {
    setEditOrder(null);
    openModal("add-sales-order-modal");
  };

  // === EXPORT HANDLERS (LIST) ===
  const handleExportListPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Orders List", 14, 22);

    const tableColumn = ["S.No", "S.O No", "Date", "Customer", "Total Qty", "Total", "Status"];
    const tableRows = salesOrders.map((order, index) => {
      const total = order.orderDetails.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
      const totalQty = order.orderDetails.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      return [
        index + 1,
        order.soInfo.soNo,
        order.soInfo.date,
        order.soInfo.customerName,
        totalQty,
        total.toFixed(2),
        order.soInfo.status,
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("SalesOrdersList.pdf");
  };

  const handleExportListExcel = () => {
    const csvContent = [
      ["S.No", "S.O No", "Date", "Customer", "Total Qty", "Total", "Status"],
      ...salesOrders.map((order, index) => {
        const total = order.orderDetails.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
        const totalQty = order.orderDetails.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
        return [
          index + 1,
          `"${order.soInfo.soNo || ""}"`,
          `"${order.soInfo.date || ""}"`,
          `"${order.soInfo.customerName || ""}"`,
          totalQty,
          total.toFixed(2),
          `"${order.soInfo.status || ""}"`,
        ];
      })
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "SalesOrdersList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-between items-center mb-6">
          <div className="page-title">
            <h4 className="text-2xl font-bold">Sales Orders</h4>
            <h6>Manage your sales orders efficiently</h6>
          </div>
          <div className="flex items-center gap-4">
            <TableTopHead
              onExportPDF={handleExportListPDF}
              onExportExcel={handleExportListExcel}
              onRefresh={fetchSalesOrders}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow"
              onClick={handleAdd}
            >
              + Add Sales Order
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table datatable w-full text-center">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">S.No</th>
                    <th className="p-4">S.O No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Total Qty</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500 text-lg">
                        No Sales Orders Found
                      </td>
                    </tr>
                  ) : (
                    salesOrders.map((order, i) => {
                      const total = order.orderDetails.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
                      const totalQty = order.orderDetails.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="p-4">{i + 1}</td>
                          <td className="p-4 font-medium">{order.soInfo.soNo}</td>
                          <td className="p-4">{order.soInfo.date || "-"}</td>
                          <td className="p-4">{order.soInfo.customerName?.split("@")[0] || "Unknown"}</td>
                          <td className="p-4">{totalQty}</td>
                          <td className="p-4 font-bold text-green-600">₹{total.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-4 py-2 rounded-full text-xs font-bold ${order.soInfo.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                              order.soInfo.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                              {order.soInfo.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-4">
                              <button
                                onClick={() => handleDownloadPDF(order)}
                                className="text-green-600 hover:text-green-800 transition transform hover:scale-110"
                                title="Download PDF"
                              >
                                <FiDownload size={20} />
                              </button>
                              <button
                                onClick={() => handleEdit(order)}
                                className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                                title="Edit"
                              >
                                <FiEdit size={20} />
                              </button>
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                                title="Delete"
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
          </div>
        </div>
      </div>

      <CommonFooter />

      <AddSalesOrder
        onSave={handleSave}
        orderData={editOrder}
      />
    </div>
  );
};

export default SalesOrder;
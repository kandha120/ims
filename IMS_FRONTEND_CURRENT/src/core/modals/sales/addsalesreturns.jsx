import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CommonDatePicker from "../../../components/date-picker/common-date-picker";
import CommonSelect from "../../../components/select/common-select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseapi from "../../../env/baseapi";

const AddSalesReturns = ({ customers: propCustomers = [], products: propProducts = [], onSuccess }) => {
  const [returnInfo, setReturnInfo] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    orderTax: 0,
    discount: 0,
    shipping: 0,
    shipping: 0,
    status: "Pending",
    paymentStatus: "Paid",
  });

  const [items, setItems] = useState([
    { sNo: 1, description: "", netUnitPrice: 0, cost: 0, stock: 0, quantity: 1, subtotal: 0, productId: "" },
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("Paid");

  // Local state for dropdown data
  // Local state for dropdown data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch Customers
  useEffect(() => {
    const loadCustomers = async () => {
      if (propCustomers.length > 0) {
        setCustomers(propCustomers);
        setLoadingCustomers(false);
        return;
      }

      try {
        setLoadingCustomers(true);
        const response = await fetch(`${baseapi}/api/customers`, {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch customers");

        const data = await response.json();
        const customerList = Array.isArray(data)
          ? data
          : data.customers || data.data || data.results || [];

        setCustomers(customerList);
      } catch (err) {
        console.error("Error fetching customers:", err);
        toast.error("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [propCustomers]);

  // Fetch Products
  useEffect(() => {
    const loadProducts = async () => {
      if (propProducts.length > 0) {
        setProducts(propProducts);
        setLoadingProducts(false);
        return;
      }

      try {
        setLoadingProducts(true);
        const response = await fetch(`${baseapi}/api/products`, {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        const productList = Array.isArray(data)
          ? data
          : data.products || data.data || data.results || [];

        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [propProducts]);

  // Customer Options (Always fresh & safe)
  const customerOptions = [
    { value: "", label: loadingCustomers ? "Loading customers..." : "Choose Customer" },
    ...customers
      .map((cust) => {
        const name = cust.customer_name || cust.name || cust.email || cust.customer || "Unknown";
        if (!name || name === "undefined") return null;
        return { value: name, label: name };
      })
      .filter(Boolean),
  ];

  // Product Options
  const productOptions = [
    { value: "", label: loadingProducts ? "Loading products..." : "Choose Product" },
    ...products
      .map((p) => {
        const name = p.product_name || p.product || p.name || p.title || p.productName || "Unknown Product";
        const stock = p.stock || p.quantity || 0;
        const id = p.id || p._id || p.product_id;
        const warehouse = p.warehouseName || p.warehouse || "Unknown Warehouse";
        if (!name || name === "undefined") return null;
        return { value: id, label: `${name} (${warehouse}) (Stock: ${stock})` };
      })
      .filter(Boolean),
  ];

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Received", label: "Received" },
  ];

  const paymentStatusOptions = [
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Partial", label: "Partial" },
  ];

  // Handle item change + auto-fill
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    if (field === "productId" && value) {
      const product = products.find(
        (p) => (p.id || p._id || p.product_id) === value
      );

      if (product) {
        updatedItems[index].description = product.product_name || product.productName || product.name || "";
        // Capture Warehouse Name for Stock Update
        updatedItems[index].warehouseName = product.warehouseName || product.warehouse || "";

        const safeStock = product.stock || product.quantity || 0;

        updatedItems[index].netUnitPrice = product.selling_price || product.price || product.unit_price || 0;
        updatedItems[index].cost = product.cost || product.purchase_price || 0;
        updatedItems[index].stock = safeStock;
        updatedItems[index].tax = product.tax || product.tax_rate || 0;
      }
    }



    // Recalculate subtotal
    const qty = parseFloat(updatedItems[index].quantity) || 0;
    const price = parseFloat(updatedItems[index].netUnitPrice) || 0;

    const subtotal = qty * price;
    updatedItems[index].subtotal = parseFloat(subtotal.toFixed(2));

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        sNo: items.length + 1,
        description: "",
        netUnitPrice: 0,
        cost: 0,
        stock: 0,
        quantity: 1,
        subtotal: 0,
        productId: "",
        warehouseName: "",
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sNo: i + 1 })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) return toast.error("Please select a customer");
    if (items.some((item) => !item.description)) return toast.error("Please select all products");

    // Calculate Grand Total for Payload
    const grandTotalVal =
      items.reduce((acc, item) => acc + (item.subtotal || 0), 0) +
      parseFloat(returnInfo.orderTax || 0) +
      parseFloat(returnInfo.shipping || 0) -
      parseFloat(returnInfo.discount || 0);

    const payload = {
      customerName: selectedCustomer,
      date: returnInfo.date,
      reference: returnInfo.reference,
      orderTax: parseFloat(returnInfo.orderTax || 0),
      discountTotal: parseFloat(returnInfo.discount || 0),
      shipping: parseFloat(returnInfo.shipping || 0),
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
      paid: 0,
      // grandTotal and due handled by backend
      items: items.map((item) => ({
        productName: item.description,
        warehouseName: item.warehouseName, // Send Warehouse Name
        netUnitPrice: parseFloat(item.netUnitPrice || 0),
        cost: parseFloat(item.cost || 0),
        stock: parseFloat(item.stock || 0),
        quantity: parseFloat(item.quantity || 0),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        lineTotal: parseFloat(item.subtotal || 0),
      })),
    };

    // Remove grandTotal and due from here if we want backend to control truth. 
    // But since backend NOW ignores grandTotal field (removed from entity), sending it won't hurt, just ignored.
    // However, we MUST remove 'grandTotal' from payload if the API strictly maps to entity and fails on unknown fields (Jackson 'FAIL_ON_UNKNOWN_PROPERTIES').
    // Let's remove it to be safe 
    delete payload.grandTotal;
    // We send paid=0. Backend calculates due = total - paid. So we don't need to send due.
    delete payload.due;

    try {
      const response = await fetch(`${baseapi}/api/sales-return/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Blur the focused element (button) to prevent aria-hidden focus issues
        if (document.activeElement) {
          document.activeElement.blur();
        }

        toast.success("Sales Return added successfully!");
        onSuccess?.(); // Refresh list

        // Reset form
        setSelectedCustomer("");
        setItems([{ sNo: 1, description: "", quantity: 1, netUnitPrice: 0, cost: 0, stock: 0, discount: 0, tax: 0, subtotal: 0, productId: "" }]);
        setReturnInfo({ ...returnInfo, reference: "", orderTax: 0, discount: 0, shipping: 0 });

        // Efficient Modal Closing & Cleanup using helper
        forceModalCleanup();
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network Error");
    }
  };

  // Helper for aggressive cleanup
  const forceModalCleanup = () => {
    // 1. Try standard Bootstrap close if possible
    document.querySelectorAll('.modal.show').forEach(modal => {
      if (window.jQuery) window.jQuery(modal).modal('hide');
      else {
        const instance = window.bootstrap?.Modal?.getInstance(modal);
        instance?.hide();
      }
    });

    // 2. Force cleanup with stronger overrides
    const resetScroll = () => {
      document.body.classList.remove("modal-open");
      document.body.style.setProperty("overflow", "auto", "important");
      document.body.style.setProperty("padding-right", "0px", "important");
      document.documentElement.style.setProperty("overflow", "auto", "important");

      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach(b => b.remove());

      document.querySelectorAll(".modal").forEach(m => {
        m.classList.remove("show");
        m.style.display = "none";
        m.setAttribute("aria-hidden", "true");
      });
    };

    // Execute immediately, then at 500ms and 1500ms to ensure it sticks
    resetScroll();
    setTimeout(resetScroll, 500);
    setTimeout(resetScroll, 1500);
  };

  const grandTotal =
    items.reduce((acc, item) => acc + (item.subtotal || 0), 0) +
    parseFloat(returnInfo.orderTax || 0) +
    parseFloat(returnInfo.shipping || 0) -
    parseFloat(returnInfo.discount || 0);

  return (
    <div>
      <div className="modal fade" id="add-sales-new" tabIndex="-1" aria-labelledby="addSalesReturnLabel" aria-hidden="true">
        <div className="modal-dialog add-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add Sales Return</h4>
              <button type="button" className="close" data-bs-dismiss="modal">
                <span>×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card border-0">
                <div className="card-body pb-0">

                  {/* Customer, Date, Reference */}
                  <div className="row">
                    <div className="col-lg-4 col-sm-6">
                      <div className="mb-3">
                        <label className="form-label">Customer Name <span className="text-danger">*</span></label>
                        <CommonSelect
                          options={customerOptions}
                          value={selectedCustomer}
                          onChange={(opt) => setSelectedCustomer(opt?.value || "")}
                          placeholder="Choose Customer"
                          isDisabled={loadingCustomers}
                          optionValue="value"
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-6">
                      <div className="mb-3">
                        <label className="form-label">Date <span className="text-danger">*</span></label>
                        <CommonDatePicker
                          value={new Date(returnInfo.date)}
                          onChange={(date) => setReturnInfo({ ...returnInfo, date: date.toISOString().split("T")[0] })}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-6">
                      <div className="mb-3">
                        <label className="form-label">Reference</label>
                        <input
                          type="text"
                          name="reference"
                          value={returnInfo.reference}
                          onChange={(e) => setReturnInfo({ ...returnInfo, reference: e.target.value })}
                          className="form-control"
                          placeholder="e.g. SR-2025-001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="table-responsive">
                    <table className="table datanew">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Net Unit Price(₹)</th>
                          <th>Cost(₹)</th>
                          <th>Stock</th>
                          <th>QTY</th>
                          <th>Subtotal (₹)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td>
                              <CommonSelect
                                options={productOptions}
                                value={item.productId}
                                onChange={(opt) => handleItemChange(i, "productId", opt?.value || "")}
                                placeholder="Choose Product"
                                isDisabled={loadingProducts}
                                optionValue="value"
                              />
                            </td>
                            <td><input type="number" step="0.01" className="form-control" style={{ minWidth: "100px" }} value={item.netUnitPrice} onChange={(e) => handleItemChange(i, "netUnitPrice", e.target.value)} /></td>
                            <td><input type="number" step="0.01" className="form-control" style={{ minWidth: "100px" }} value={item.cost} onChange={(e) => handleItemChange(i, "cost", e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ minWidth: "100px" }} value={item.stock} onChange={(e) => handleItemChange(i, "stock", e.target.value)} /></td>
                            <td><input type="number" min="1" className="form-control" style={{ minWidth: "80px" }} value={item.quantity} onChange={(e) => handleItemChange(i, "quantity", e.target.value)} /></td>
                            <td className="text-end fw-bold">₹{item.subtotal.toFixed(2)}</td>
                            <td>
                              {items.length > 1 && (
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>
                                  <i className="feather icon-trash-2"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" className="btn btn-primary btn-sm mb-3" onClick={addItem}>
                      + Add Item
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="row justify-content-end">
                    <div className="col-lg-4">
                      <ul className="list-group">
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Order Tax</span>
                          <strong>₹{parseFloat(returnInfo.orderTax || 0).toFixed(2)}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Discount</span>
                          <strong>₹{parseFloat(returnInfo.discount || 0).toFixed(2)}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Shipping</span>
                          <strong>₹{parseFloat(returnInfo.shipping || 0).toFixed(2)}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between text-primary fw-bold">
                          <span>Grand Total</span>
                          <strong>₹{grandTotal.toFixed(2)}</strong>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-lg-2 col-sm-6 mb-3">
                      <label className="form-label">Order Tax</label>
                      <input
                        name="orderTax"
                        type="number"
                        step="0.01"
                        placeholder="Order Tax"
                        className="form-control"
                        value={returnInfo.orderTax}
                        onChange={(e) => setReturnInfo({ ...returnInfo, orderTax: e.target.value })}
                      />
                    </div>
                    <div className="col-lg-2 col-sm-6 mb-3">
                      <label className="form-label">Discount</label>
                      <input
                        name="discount"
                        type="number"
                        step="0.01"
                        placeholder="Discount"
                        className="form-control"
                        value={returnInfo.discount}
                        onChange={(e) => setReturnInfo({ ...returnInfo, discount: e.target.value })}
                      />
                    </div>
                    <div className="col-lg-2 col-sm-6 mb-3">
                      <label className="form-label">Shipping</label>
                      <input
                        name="shipping"
                        type="number"
                        step="0.01"
                        placeholder="Shipping"
                        className="form-control"
                        value={returnInfo.shipping}
                        onChange={(e) => setReturnInfo({ ...returnInfo, shipping: e.target.value })}
                      />
                    </div>
                    <div className="col-lg-3 col-sm-6 mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        options={statusOptions}
                        value={selectedStatus}
                        onChange={(opt) => setSelectedStatus(opt?.value || "Pending")}
                        optionValue="value"
                      />
                    </div>
                    <div className="col-lg-3 col-sm-6 mb-3">
                      <label className="form-label">Payment Status</label>
                      <CommonSelect
                        options={paymentStatusOptions}
                        value={selectedPaymentStatus}
                        onChange={(opt) => setSelectedPaymentStatus(opt?.value || "Paid")}
                        optionValue="value"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Return</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSalesReturns;
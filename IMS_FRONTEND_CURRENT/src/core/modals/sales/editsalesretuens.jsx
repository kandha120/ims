import { useState, useEffect } from "react";
import CommonDatePicker from "../../../components/date-picker/common-date-picker";
import CommonSelect from "../../../components/select/common-select";
import baseapi from "../../../env/baseapi";
import { toast } from "react-toastify";

const EditSalesReturns = ({ returnData, onSuccess }) => {
  const [formData, setFormData] = useState(null);

  // This will run every time modal opens with new data
  useEffect(() => {
    if (returnData) {
      setFormData({
        id: returnData.id,
        customer: returnData.customerName || "",
        date: returnData.date ? new Date(returnData.date) : new Date(),
        reference: returnData.reference || "",
        orderTax: returnData.orderTax || 0,
        discount: returnData.discount || 0,
        shipping: returnData.shipping || 0,
        status: returnData.status || "Pending",
        paid: returnData.paid || 0,
        paymentStatus: (returnData.paid >= returnData.grandTotal && returnData.grandTotal > 0) ? "Paid" : "Unpaid", // Infer initial status
        items: returnData.items || [],
      });
    }
  }, [returnData]);

  const handleUpdate = async () => {
    if (!formData?.id) return;

    // Calculate Grand Total (for local logic)
    const subtotal = formData.items.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
    const grandTotal =
      subtotal +
      parseFloat(formData.orderTax || 0) +
      parseFloat(formData.shipping || 0) -
      parseFloat(formData.discount || 0);

    // Determine paid amount based on paymentStatus
    let paidAmount = 0;
    if (formData.paymentStatus === "Paid") {
      paidAmount = grandTotal;
    } else if (formData.paymentStatus === "Partial") {
      paidAmount = parseFloat(formData.paid || 0);
    }
    // If Unpaid, paidAmount is 0

    try {
      const res = await fetch(`${baseapi}/api/sales-return/update/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customerName: formData.customer,
          date: formData.date.toISOString().split("T")[0],
          reference: formData.reference,
          orderTax: parseFloat(formData.orderTax || 0),
          discountTotal: parseFloat(formData.discount || 0),
          shipping: parseFloat(formData.shipping || 0),
          status: formData.status,
          paid: paidAmount,
          // grandTotal and due are calculated/handled by backend now
          items: formData.items.map(item => ({
            productName: item.description || item.productName,
            netUnitPrice: item.netUnitPrice,
            cost: item.cost,
            stock: item.stock,
            quantity: item.quantity,
            discount: item.discount,
            tax: item.tax,
            lineTotal: item.subtotal
          }))
        }),
      });

      if (res.ok) {
        toast.success("Updated successfully!");
        onSuccess?.();

        // Efficient Modal Closing & Cleanup using helper
        forceModalCleanup();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Network error");
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

  // Show loading until real data comes
  if (!formData) {
    return (
      <div className="modal fade" id="edit-sales-new">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary" />
              <p className="mt-3">Loading sales return details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal fade" id="edit-sales-new">
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h4>Edit Sales Return - RET-{formData.id}</h4>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label>Customer</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label>Date</label>
                <CommonDatePicker
                  value={formData.date}
                  onChange={(d) => setFormData({ ...formData, date: d })}
                />
              </div>
              <div className="col-md-4">
                <label>Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
            </div>

            <hr />

            <h5>Returned Items ({formData.items.length})</h5>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.description || item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{parseFloat(item.netUnitPrice || item.net_unit_price || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row mt-3">
              <div className="col-md-3">
                <label>Order Tax</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.orderTax}
                  onChange={(e) => setFormData({ ...formData, orderTax: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label>Discount</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label>Shipping</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.shipping}
                  onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label>Return Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>
            </div>

            {/* Payment Status Toggle */}
            <div className="row mt-3 bg-light p-2 rounded">
              <div className="col-md-6">
                <label className="fw-bold">Payment Status</label>
                <select
                  className="form-select"
                  value={formData.paymentStatus || "Unpaid"}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid (Full)</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
              {formData.paymentStatus === "Partial" && (
                <div className="col-md-6">
                  <label>Paid Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.paid || 0}
                    onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
                  />
                </div>
              )}
            </div>

          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdate}>
              Update Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSalesReturns;
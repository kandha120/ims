import { useState, useEffect } from "react";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import AddSalesReturns from "../../core/modals/sales/addsalesreturns";
import EditSalesReturns from "../../core/modals/sales/editsalesretuens";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { toast } from "react-toastify";
import baseapi from "../../env/baseapi";

// Import images correctly
import productImg from "../../assets/img/products/pos-product-07.svg";
import userImg from "../../assets/img/users/user-27.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableTopHead from "../../components/table-top-head";

const SalesReturn = () => {
  const [salesReturns, setSalesReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Safe Date Helper
  const safeDate = (date) => {
    if (!date) return "N/A";
    if (Array.isArray(date)) return date.join("-");
    return String(date).split("T")[0];
  };

  // Central fetch function for sales returns (reusable)
  const fetchSalesReturns = async () => {
    try {
      const response = await fetch(`${baseapi}/api/sales-return/all`, {
        credentials: "include"
      });
      const data = await response.json();

      console.log("API Response for Sales Returns:", data);

      const salesData = Array.isArray(data) ? data : data.sales_returns;

      const formattedReturns = (salesData || []).map((ret) => {
        // Safe Date Handling
        let dateStr = "N/A";
        if (Array.isArray(ret.date)) {
          dateStr = ret.date.join("-");
        } else if (ret.date) {
          dateStr = String(ret.date).split("T")[0];
        }

        // Map Items safely
        const items = (ret.items || []).map((item, index) => ({
          sNo: index + 1,
          description: item.productName || item.description || "Unknown Product",
          netUnitPrice: parseFloat(item.unitPrice || item.net_unit_price || 0),
          cost: parseFloat(item.cost || 0),
          stock: item.stock || 0,
          quantity: parseFloat(item.quantity || 0),
          discount: parseFloat(item.discount || 0),
          tax: parseFloat(item.tax || 0),
          subtotal: parseFloat(item.lineTotal || item.subtotal || 0),
        }));

        // Calculate Totals if missing
        const calcSubtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
        const orderTax = parseFloat(ret.orderTax || ret.order_tax || 0);
        const shipping = parseFloat(ret.shipping || 0);
        const discount = parseFloat(ret.discountTotal || ret.discount || 0);
        const calcTotal = calcSubtotal + orderTax + shipping - discount;
        const totalValue = parseFloat(ret.grandTotal || ret.totalAmount || ret.total || calcTotal || 0);

        return {
          id: ret.id,
          product: items.length > 0 ? items[0].description : (ret.product || "N/A"),
          total: totalValue,
          paid: parseFloat(ret.paid || 0),
          due: Math.max(0, totalValue - parseFloat(ret.paid || 0)),
          customerName: ret.customerName || ret.customer || "Unknown Customer",
          date: safeDate(ret.date),
          reference: ret.reference || "N/A",
          orderTax: orderTax,
          discount: discount,
          shipping: shipping,
          status: ret.status || "Pending",
          paymentStatus: ret.paymentStatus || "Paid",
          items: items,
        };
      });

      setSalesReturns(formattedReturns);
      console.log("Formatted Sales Returns:", formattedReturns);
    } catch (error) {
      console.error("Error fetching sales returns:", error);
    }
  };

  // Fetch sales data
  const fetchSales = async () => {
    try {
      const response = await fetch(`${baseapi}/api/sales-order/all`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch sales");
      const data = await response.json();
      console.log("Sales Data:", data);
      const salesList = Array.isArray(data) ? data : data.sales || data.data || [];
      setSales(salesList);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales");
    }
  };

  // Fetch Products via Stock to ensure correct Warehouse/Quantity
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`${baseapi}/api/products`, { credentials: "include" }),
          fetch(`${baseapi}/api/stock/all`, { credentials: "include" })
        ]);

        if (!pRes.ok || !sRes.ok) throw new Error("Failed to fetch product data");

        const pData = await pRes.json();
        const sData = await sRes.json();

        // Catalog Data (for Price, Description)
        const catalogList = Array.isArray(pData) ? pData : (pData.products || pData.data || []);
        // Stock Data (for Warehouse, Quantity)
        const stockList = Array.isArray(sData) ? sData : (sData.products || sData.data || []);

        console.log("Stock List:", stockList);
        console.log("Catalog List:", catalogList);

        // Map Catalog for fast lookup
        const catalogMap = new Map(catalogList.map(c => [c.productName, c]));

        // Merge: Use Stock as the primary source + Enrich with Catalog
        const mergedList = stockList.map(stockItem => {
          const catalogItem = catalogMap.get(stockItem.productName);
          return {
            id: stockItem.id, // Use Stock ID!
            productName: stockItem.productName,
            warehouseName: stockItem.warehouse, // Correct Warehouse
            quantity: stockItem.quantity,       // Correct Quantity
            price: catalogItem?.price || stockItem.price || 0,
            description: catalogItem?.description || "",
            sku: catalogItem?.sku || stockItem.sku || "",
            tax: catalogItem?.tax || 0,
            discount: catalogItem?.discount || 0
          };
        });

        setProducts(mergedList);
      } catch (err) {
        console.error("Error fetching merged products:", err);
        toast.error("Failed to load product stock data");
      }
    };
    fetchProducts();
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSalesReturns();
    fetchSales();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${baseapi}/api/customers`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        console.log("Customers Data:", data);
        const customerList = Array.isArray(data) ? data : data.data || data.customers || [];
        setCustomers(customerList);
      } catch { toast.error("Failed to load customers"); }
    };
    fetchCustomers();
  }, []);

  // Delete handler
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${baseapi}/api/sales-return/delete/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setSalesReturns(salesReturns.filter((ret) => ret.id !== id));

        // Force cleanup using helper
        forceModalCleanup();

        toast.success("Sales return deleted successfully!");
      } else {
        console.error("Error deleting sales return:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting sales return:", error);
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

      // Reset any manual overrides on modals
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

  // Edit handler
  const handleEdit = (ret) => {
    setSelectedReturn(ret);
  };

  // Checkbox handlers
  const handleCheckboxChange = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = salesReturns.map((ret) => ret.id);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Return List", 14, 22);

    const tableColumn = ["S.No", "Product", "Date", "Customer", "Status", "Total", "Paid", "Due", "Pay Status"];
    const tableRows = salesReturns.map((ret, index) => [
      index + 1,
      ret.product,
      ret.date,
      ret.customerName,
      ret.status,
      ret.total.toFixed(2),
      ret.paid.toFixed(2),
      ret.due.toFixed(2),
      ret.paymentStatus,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("SalesReturns.pdf");
  };

  const handleDownloadRowPDF = (ret) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Sales Return Details", 14, 20);

    doc.setFontSize(12);
    doc.text(`Return ID: ${ret.id || "N/A"}`, 14, 30);
    doc.text(`Product: ${ret.product || "N/A"}`, 14, 40);
    doc.text(`Date: ${ret.date || "N/A"}`, 14, 50);
    doc.text(`Customer: ${ret.customerName || "N/A"}`, 14, 60);
    doc.text(`Status: ${ret.status || "N/A"}`, 14, 70);
    doc.text(`Payment Status: ${ret.paymentStatus || "N/A"}`, 14, 80);

    // Items table
    const tableColumn = ["S.No", "Description", "Qty", "Unit Price", "Subtotal"];
    const tableRows = (ret.items || []).map((item, index) => [
      index + 1,
      item.description || "N/A",
      item.quantity || 0,
      Number(item.netUnitPrice || 0).toFixed(2),
      Number(item.subtotal || 0).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: ${Number(ret.total || 0).toFixed(2)}`, 14, finalY);
    doc.text(`Paid: ${Number(ret.paid || 0).toFixed(2)}`, 14, finalY + 10);
    doc.text(`Due: ${Number(ret.due || 0).toFixed(2)}`, 14, finalY + 20);

    doc.save(`SalesReturn_${ret.id}.pdf`);
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "Product", "Date", "Customer", "Status", "Total", "Paid", "Due", "Pay Status"],
      ...salesReturns.map((ret, index) => [
        index + 1,
        `"${ret.product || ""}"`,
        `"${ret.date || ""}"`,
        `"${ret.customerName || ""}"`,
        `"${ret.status || ""}"`,
        ret.total.toFixed(2),
        ret.paid.toFixed(2),
        ret.due.toFixed(2),
        `"${ret.paymentStatus || ""}"`,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "SalesReturns.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="page-header d-flex align-items-center justify-content-between">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Sales Return</h4>
              <h6>Manage your returns</h6>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchSalesReturns}
            />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-sales-new"
              >
                Add Sales Return
              </Link>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card employee-table">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set"></div>
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              {/* Filters */}
              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Customer {customers.length > 0 ? `(${customers.length})` : ''}
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {customers.length > 0 ? (
                    customers.map((cust, index) => (
                      <li key={cust.id || cust.customer_id || cust._id || index}>
                        <Link to="#" className="dropdown-item rounded-1">
                          {cust.customer_name || cust.name || cust.email || cust.customerName || 'Unknown Customer'}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li><Link to="#" className="dropdown-item rounded-1 text-muted">Loading customers...</Link></li>
                  )}
                </ul>
              </div>

              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Product {products.length > 0 ? `(${products.length})` : ''}
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {products.length > 0 ? (
                    products.map((prod, index) => (
                      <li key={prod.id || prod.product_id || prod._id || index}>
                        <Link to="#" className="dropdown-item rounded-1">
                          {prod.productName || prod.name || 'Unknown Product'}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li><Link to="#" className="dropdown-item rounded-1 text-muted">Loading products...</Link></li>
                  )}
                </ul>
              </div>

              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li><Link to="#" className="dropdown-item rounded-1">Completed</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Pending</Link></li>
                </ul>
              </div>

              <div className="dropdown me-2">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Payment Status
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li><Link to="#" className="dropdown-item rounded-1">Paid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Unpaid</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Overdue</Link></li>
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

          <div className="card-body">
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <label className="checkboxs">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectedItems.length === salesReturns.length && salesReturns.length > 0}
                          onChange={handleSelectAll}
                        />
                        <span className="checkmarks" />
                      </label>
                    </th>
                    <th>S.No</th>
                    <th>Product</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                    <th className="no-sort" />
                  </tr>
                </thead>
                <tbody>
                  {/* Sales Data - Mapped to existing columns */}
                  {sales.length > 0 && (
                    sales.map((sale, index) => (
                      <tr key={`sale-${sale.id || index}`}>
                        <td>
                          <label className="checkboxs">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(`sale-${sale.id || index}`)}
                              onChange={() => handleCheckboxChange(`sale-${sale.id || index}`)}
                            />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>SALE-{sale.id || index + 1}</td>
                        <td>{sale.product || sale.product_name || 'N/A'}</td>
                        <td>{safeDate(sale.date)}</td>
                        <td><a href="#">{sale.customer_name || sale.customer || 'N/A'}</a></td>
                        <td>
                          <span className={`badge badge-success shadow-none`}>
                            {sale.status || 'Completed'}
                          </span>
                        </td>
                        <td>₹{parseFloat(sale.total || 0).toFixed(2)}</td>
                        <td>₹{parseFloat(sale.paid || 0).toFixed(2)}</td>
                        <td>₹{parseFloat(sale.due || 0).toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge badge-soft-${(sale.due || 0) === 0 ? "success" : "danger"
                              } badge-xs shadow-none`}
                          >
                            {(sale.due || 0) === 0 ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td>
                          <div className="edit-delete-action d-flex align-items-center">
                            {/* No edit/delete for sales, just view icon or empty */}
                            <a className="me-2 p-2 d-flex align-items-center border rounded" href="#" title="View Sale">
                              <i data-feather="eye" className="feather-eye" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Sales Returns Data */}
                  {salesReturns.length === 0 && sales.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center py-4">
                        No Sales Returns or Sales yet
                      </td>
                    </tr>
                  )}

                  {salesReturns.map((ret) => {
                    return (
                      <tr key={ret.id}>
                        <td>
                          <label className="checkboxs">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(ret.id)}
                              onChange={() => handleCheckboxChange(ret.id)}
                            />
                            <span className="checkmarks" />
                          </label>
                        </td>

                        <td>RET-{ret.id}</td>
                        <td>{ret.product}</td>
                        <td>{ret.date}</td>
                        <td><a href="#">{ret.customerName}</a></td>
                        <td>
                          <span
                            className={`badge ${ret.status === "Received"
                              ? "badge-success"
                              : "badge-cyan"
                              } shadow-none`}
                          >
                            {ret.status}
                          </span>
                        </td>
                        <td>₹{ret.total.toFixed(2)}</td>
                        <td>₹{ret.paid.toFixed(2)}</td>
                        <td>₹{ret.due.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge badge-soft-${ret.paymentStatus === "Paid" ? "success" :
                              ret.paymentStatus === "Partial" ? "warning" : "danger"
                              } badge-xs shadow-none`}
                          >
                            {ret.paymentStatus || "Unpaid"}
                          </span>
                        </td>
                        <td>
                          <div className="edit-delete-action d-flex align-items-center">
                            <a
                              className="me-2 p-2 d-flex align-items-center border rounded cursor-pointer"
                              href="javascript:void(0)"     // <-- Idhu hero da machaa!
                              data-bs-toggle="modal"
                              data-bs-target="#edit-sales-new"
                              onClick={(e) => {
                                e.preventDefault();         // <-- Page refresh block pannum
                                handleEdit(ret);            // <-- State set aagum
                              }}
                            >
                              <i data-feather="edit" className="feather-edit" />
                            </a>
                            <a
                              className="p-2 d-flex align-items-center border rounded"
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete"
                              onClick={() => setSelectedReturn(ret)}
                            >
                              <i
                                data-feather="trash-2"
                                className="feather-trash-2"
                              />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2025 © iatsolutionsPOS. All Right Reserved</p>
        <p>
          Designed & Developed By{" "}
          <Link to="#" className="text-primary">
            iatsolutions
          </Link>
        </p>
      </div>

      {/* Modals */}
      <AddSalesReturns products={products} customers={customers} onSuccess={fetchSalesReturns} />
      <EditSalesReturns returnData={selectedReturn} products={products} customers={customers} />

      {/* Delete Modal */}
      <div className="modal fade" id="delete">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Deletion</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this sales return?</p>
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
                onClick={() => handleDelete(selectedReturn?.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturn;
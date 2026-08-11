import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import DeleteModal from "../../components/delete-modal";
import TableTopHead from "../../components/table-top-head";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SearchFromApi from "../../components/data-table/search";
import { ToastContainer, toast } from "react-toastify";
import CommonFooter from "../../components/footer/commonFooter";
import * as bootstrap from "bootstrap";
import baseapi from "../../env/baseapi";

const LowStock = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("low"); // "low" | "out"

  // Fetch products and stock
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Catalog (SKU, Price, Category info)
        const productsRes = await fetch(`${baseapi}/api/products`, { credentials: "include" });
        const productsData = await productsRes.json();
        const catalogList = Array.isArray(productsData) ? productsData : (productsData.data || productsData.products || []);

        // Map Catalog by ProductName for easy lookup
        const catalogMap = new Map();
        catalogList.forEach(p => {
          const name = p.productName || p.product_name || p.name || p.product || p.title;
          if (name) catalogMap.set(name, p);
        });

        // 2. Fetch Inventory (Actual Stock Quantity per Warehouse)
        const stockRes = await fetch(`${baseapi}/api/stock/all`, { credentials: "include" });
        const stockData = await stockRes.json();
        const stockList = Array.isArray(stockData) ? stockData : [];

        // 3. Merge: Iterate CATALOG to ensure we capture products with 0 stock (not in AddStock)
        const merged = [];

        catalogList.forEach(catItem => {
          const catName = catItem.productName || catItem.product_name || catItem.name || catItem.product || catItem.title;
          if (!catName) return;

          // Find all stock entries for this product
          const stockEntries = stockList.filter(s => s.productName === catName);

          if (stockEntries.length > 0) {
            // Product exists in one or more warehouses
            stockEntries.forEach(stockItem => {
              merged.push({
                id: stockItem.id,
                productName: catName,
                warehouse: stockItem.warehouse || "Unknown",
                sku: catItem.sku || catItem.productSku || "-",
                category: catItem.categoryName || (catItem.category ? catItem.category.name : null) || catItem.category || "-",
                price: Number(catItem.sale_price || catItem.price || 0),
                quantity: Number(stockItem.quantity || 0),
                quantityAlert: Number(stockItem.quantityAlert || catItem.alertQuantity || catItem.quantityAlert || 0),
              });
            });
          } else {
            // Product exists but NOT in any warehouse (effectively 0 stock)
            // We show it as "N/A" warehouse with 0 quantity
            merged.push({
              id: `cat-${catItem.id}`, // specific ID format
              productName: catName,
              warehouse: "N/A",
              sku: catItem.sku || catItem.productSku || "-",
              category: catItem.categoryName || (catItem.category ? catItem.category.name : null) || catItem.category || "-",
              price: Number(catItem.sale_price || catItem.price || 0),
              quantity: 0, // Default to 0 if not in AddStock
              quantityAlert: Number(catItem.alertQuantity || catItem.quantityAlert || 0),
            });
          }
        });

        console.log("🔥 Final Merged Stock Data:", merged.slice(0, 5));
        setAllProducts(merged);

      } catch (err) {
        toast.error("Failed to load stock data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search filter
  const filteredProducts = useMemo(() => {
    return allProducts.filter(
      (e) =>
        e.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery]);

  // Out of stock products
  const outOfStockProducts = useMemo(() => {
    return filteredProducts.filter((p) => p.quantity === 0);
  }, [filteredProducts]);

  // Low stock tab shows products where quantity <= quantityAlert
  const sortedProducts = useMemo(() => {
    return filteredProducts
      .filter(p => p.quantity <= p.quantityAlert && p.quantity > 0) // Low but not 0 (0 is Out of Stock) or include 0? Usually Low Stock includes Out of Stock, but here we have separate tabs. Let's include 0 or separate?
      // User request: "only products with low stock".
      // Usually Low Stock includes everything <= alert.
      // If "Out of Stock" tab exists, "Low stock" might effectively be "All that needs attention".
      // Let's filter <= quantityAlert.
      .filter(p => p.quantity <= p.quantityAlert)
      .sort((a, b) => a.quantity - b.quantity); // Ascending makes sense for low stock (most critical first)
  }, [filteredProducts]);

  const dataToDisplay = activeTab === "low" ? sortedProducts : outOfStockProducts;

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rows;
    return dataToDisplay.slice(start, start + rows).map((item, idx) => ({
      ...item,
      sno: start + idx + 1,
    }));
  }, [dataToDisplay, currentPage, rows]);

  const handleSearch = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };



  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Product List", 14, 22);

    const tableColumn = ["S.No", "SKU", "Warehouse", "Product", "Category", "Price", "Qty"];
    const tableRows = dataToDisplay.map((item, index) => [
      index + 1,
      item.sku,
      item.warehouse,
      item.productName,
      item.category,
      item.price.toFixed(2),
      item.quantity,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("StockProducts.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "SKU", "Warehouse", "Product", "Category", "Price", "Qty"],
      ...dataToDisplay.map((item, index) => [
        index + 1,
        `"${item.sku || ""}"`,
        `"${item.warehouse || ""}"`,
        `"${item.productName || ""}"`,
        `"${item.category || ""}"`,
        item.price.toFixed(2),
        item.quantity,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "StockProducts.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns
  const columns = [
    {
      header: (
        <label className="checkboxs">
          <input type="checkbox" />
          <span className="checkmarks" />
        </label>
      ),
      body: () => (
        <label className="checkboxs">
          <input type="checkbox" />
          <span className="checkmarks" />
        </label>
      ),
      field: "checkbox",
    },
    { header: "S.No", field: "sno", sortable: false },
    { header: "SKU", field: "sku", sortable: true },
    { header: "Warehouse", field: "warehouse", sortable: true },
    {
      header: "Product",
      field: "productName",
      body: (row) => (
        <Link className="text-primary fw-bold" to="#">
          {row.productName}
        </Link>
      ),
    },
    { header: "Category", field: "category" },
    {
      header: "Price",
      field: "price",
      body: (row) => <span>₹ {row.price.toFixed(2)}</span>,
    },
    {
      header: "Qty",
      field: "quantity",
      body: (row) => (
        <span
          className={`badge ${row.quantity === 0
            ? "bg-dark"
            : row.quantity <= 10
              ? "bg-danger"
              : "bg-success"
            }`}
        >
          {row.quantity}
        </span>
      ),
    },
  ];

  return (
    <>
      <style jsx>{`
        .nav-tabs .nav-link.active {
          background: #2196f3;
          color: #fff;
        }
        .table-row-hover:hover {
          background: #f8f9fa !important;
          transform: translateY(-2px) scale(1.01);
        }
      `}</style>

      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex justify-content-between align-items-center">
            <div>
              <h4>Stock Products</h4>
              <h6>Check low & out-of-stock products</h6>
            </div>

            <div className="d-flex align-items-center gap-2">
              <TableTopHead
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onRefresh={() => { }}
              />
              <SearchFromApi callback={handleSearch} rows={rows} setRows={setRows} />
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "low" ? "active" : ""}`}
                onClick={() => setActiveTab("low")}
              >
                Low Stock
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "out" ? "active" : ""}`}
                onClick={() => setActiveTab("out")}
              >
                Out of Stock
              </button>
            </li>
          </ul>

          <div className="card table-list-card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">Loading da machi...</div>
              ) : paginatedData.length === 0 ? (
                <div className="text-center text-muted py-4">No products found!</div>
              ) : (
                <PrimeDataTable
                  column={columns}
                  data={paginatedData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={dataToDisplay.length}
                  rowClassName="table-row-hover"
                />
              )}
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>

      <DeleteModal />
      <ToastContainer />
    </>
  );
};

export default LowStock;

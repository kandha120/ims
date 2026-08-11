import React, { useState, useEffect, useRef } from "react";
import { FiDownload } from "react-icons/fi";
import { Link } from "react-router-dom";
import Brand from "../../core/modals/inventory/brand";
import { all_routes } from "../../routes/all_routes";
import PrimeDataTable from "../../components/data-table";
import { user01 } from "../../utils/imagepath";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import { ToastContainer, toast } from "react-toastify";
import AddProduct from "./addproduct";
import * as bootstrap from "bootstrap";
import baseapi from "../../env/baseapi";

import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProductList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editProductId, setEditProductId] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const deleteModalRef = useRef(null);
  const route = all_routes;

  const searchQueryRef = useRef("");

  // Load data from API
  useEffect(() => {
    searchQueryRef.current = searchQuery;
    fetchProducts(currentPage, rows, searchQuery);
  }, [currentPage, rows, searchQuery]);

  const fetchProducts = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setError("");

    try {
      // Fetch Catalog (to ensure we see all products, even unstocked ones)
      const productsRes = await fetch(`${baseapi}/api/products`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const productsData = await productsRes.json();
      const catalogList = Array.isArray(productsData) ? productsData : (productsData.data || productsData.products || []);

      // Fetch Inventory (AddStock)
      const stockRes = await fetch(`${baseapi}/api/stock/all`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const stockData = await stockRes.json();
      const stockList = Array.isArray(stockData) ? stockData : (stockData.products || stockData.data || []);

      // Merge Logic
      const mergedList = [];
      const processedNames = new Set();

      catalogList.forEach(catItem => {
        const catName = catItem.productName || catItem.product_name || catItem.name || catItem.product || catItem.title;
        if (!catName) return;

        // Prevent duplicate rows for the same product name (since Key is Name)
        if (processedNames.has(catName)) return;
        processedNames.add(catName);

        // Find stock entries for this product
        const stockEntries = stockList.filter(s => s.productName === catName);

        if (stockEntries.length > 0) {
          // List each stock entry separately (shows specific warehouse)
          stockEntries.forEach(stockItem => {
            mergedList.push({
              id: stockItem.id, // Use Stock ID for stock entries
              productName: catName,
              warehouse: stockItem.warehouse?.name || stockItem.warehouse,
              quantity: stockItem.quantity || 0,
              responsiblePerson: stockItem.responsiblePerson || "-",
              sku: catItem.sku || stockItem.sku || catItem.productSku,
              category: catItem.categoryName || (catItem.category ? catItem.category.name : null) || catItem.category || stockItem.category,
              price: catItem.sale_price || catItem.price || stockItem.price
            });
          });
        } else {
          // Product exists in Catalog but NOT in Stock -> Show as Unstocked
          mergedList.push({
            id: `cat-${catItem.id}`, // Unique ID for key
            productName: catName,
            warehouse: "Unallocated",
            quantity: 0,
            responsiblePerson: "-",
            sku: catItem.sku || catItem.productSku,
            category: catItem.categoryName || (catItem.category ? catItem.category.name : null) || catItem.category,
            price: catItem.sale_price || catItem.price
          });
        }
      });

      // Client-side filtering
      let finalData = mergedList;
      if (search) {
        const lowerSearch = search.toLowerCase();
        finalData = finalData.filter(item =>
          (item.productName && item.productName.toLowerCase().includes(lowerSearch)) ||
          (item.warehouse && item.warehouse.toLowerCase().includes(lowerSearch)) ||
          (item.responsiblePerson && item.responsiblePerson.toLowerCase().includes(lowerSearch)) ||
          (item.sku && item.sku.toLowerCase().includes(lowerSearch))
        );
      }

      setProducts(finalData);
      setTotalRecords(finalData.length);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setProducts([]);
      setTotalRecords(0);
      toast.error(`Error fetching products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleEditClick = (productId) => {
    setEditProductId(productId);
    openModal("edit-product-modal");
  };

  const handleDeleteClick = (productId) => {
    setDeleteProductId(productId);
    openModal("delete-modal");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;

    try {
      let response;
      const idStr = String(deleteProductId);

      if (idStr.startsWith("cat-")) {
        // It's a Catalog Product (Unstocked). Delete from Product API.
        const realId = idStr.replace("cat-", "");
        response = await fetch(`${baseapi}/api/products/${realId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
      } else {
        // It's a Stock Entry. Delete from Stock API.
        response = await fetch(`${baseapi}/api/stock/delete/${deleteProductId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
      }

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      toast.success("Stock deleted successfully!");

      // Refresh the list
      fetchProducts(currentPage, rows, searchQueryRef.current || "");

      // Hide modal
      closeModal("delete-modal");

      setDeleteProductId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete failed: " + (error.message || "Unknown error"));
    }
  };

  const handleCloseEdit = () => {
    setEditProductId(null);
  };

  const handleDownloadRowPDF = (product) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Stock Details", 14, 20);

    doc.setFontSize(12);
    doc.text(`Product Name: ${product.productName || "N/A"}`, 14, 30);
    doc.text(`Warehouse: ${product.warehouse || "N/A"}`, 14, 40);
    doc.text(`Quantity: ${product.quantity || 0}`, 14, 50);
    doc.text(`Responsible Person: ${product.responsiblePerson || "N/A"}`, 14, 60);

    doc.save(`Stock_${product.id}.pdf`);
  };

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
      key: "checked",
    },
    {
      header: "S.No",
      key: "serial",
      sortable: false,
      body: (rowData, { rowIndex }) => {
        return <span>{(currentPage - 1) * rows + rowIndex + 1}</span>;
      },
    },
    {
      header: "Product",
      field: "productName",
      key: "productName",
      sortable: true,
      body: (data) => (
        <div className="d-flex align-items-center">
          <Link to="#">{data.productName || "N/A"}</Link>
        </div>
      ),
    },
    {
      header: "Warehouse",
      field: "warehouse",
      key: "warehouse",
      sortable: true,
      body: (data) => <span>{data.warehouse || "N/A"}</span>,
    },
    {
      header: "Quantity",
      field: "quantity",
      key: "quantity",
      sortable: true,
    },
    {
      header: "Responsible Person",
      field: "responsiblePerson",
      key: "responsiblePerson",
      sortable: true,
    },
    {
      header: "Actions",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded btn-white"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDownloadRowPDF(row);
            }}
            title="Download PDF"
          >
            <FiDownload className="text-success" size={16} />
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded btn-delete-hover"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDeleteClick(row.id);
            }}
          >
            <i className="feather icon-trash-2"></i>
          </Link>
        </div>
      ),
    },
  ];

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Product List", 14, 22);

    const tableColumn = ["S.No", "SKU", "Product", "Warehouse", "Category", "Price"];
    const tableRows = products.map((item, index) => [
      index + 1,
      item.sku,
      item.productName,
      item.warehouse?.name || item.warehouse || "N/A",
      item.category,
      item.price,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("ProductList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["S.No", "SKU", "Product", "Warehouse", "Category", "Price"],
      ...products.map((item, index) => [
        index + 1,
        `"${item.sku || ""}"`,
        `"${item.productName || ""}"`,
        `"${item.warehouse?.name || item.warehouse || ""}"`,
        `"${item.category || ""}"`,
        item.price,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "ProductList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <ToastContainer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .table-row-hover:hover {
            background-color: #f8f9fa !important;
            transform: translateY(-2px) scale(1.005);
            box-shadow: 0 6px 16px rgba(0,0,0,0.08) !important;
            position: relative;
            z-index: 1;
          }
          .btn-edit-hover:hover {
            background-color: #e3f2fd !important;
            border-color: #2196f3 !important;
            color: #1976d2 !important;
          }
          .btn-delete-hover:hover {
            background-color: #ffebee !important;
            border-color: #f44336 !important;
            color: #d32f2f !important;
          }
        `,
        }}
      />

      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Product List</h4>
                <h6>Manage your products</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={() => fetchProducts(currentPage, rows, searchQuery)}
            />
            <div className="page-btn">
              <Link to={route.addproduct} className="btn btn-primary">
                <i className="ti ti-circle-plus me-1"></i>
                Add New Product
              </Link>
            </div>
            <div className="page-btn import">
              <Link
                to="#"
                className="btn btn-secondary color"
                onClick={() => openModal("view-notes")}
              >
                <i className="feather icon-download feather me-2" />
                Import Product
              </Link>
            </div>
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
                    Created By
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Prem Kumar</Link></li>
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Category
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Computers</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Electronics</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Shoe</Link></li>
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Brand
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Lenovo</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Beats</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Nike</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Apple</Link></li>
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
              {error && (
                <div className="alert alert-warning">
                  <strong>API Error:</strong> {error}
                  <br />
                  <small>Check console for details.</small>
                </div>
              )}
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <div className="table-responsive">
                  <PrimeDataTable
                    column={columns}
                    data={Array.isArray(products) ? products : []}
                    rows={rows}
                    setRows={setRows}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalRecords={totalRecords || 0}
                    rowClassName="table-row-hover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <Brand />
      </div>

      {/* Edit Product Modal */}
      <div
        className="modal fade"
        id="edit-product-modal"
        tabIndex="-1"
        aria-labelledby="editProductLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editProductLabel">Edit Product</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {editProductId && (
                <AddProduct
                  editId={editProductId}
                  onClose={() => {
                    closeModal("edit-product-modal");
                    setEditProductId(null);
                  }}
                  onSave={() => fetchProducts(currentPage, rows, searchQuery)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Delete Modal */}
      <div className="modal fade" id="delete-modal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Product</h5>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this product?
            </div>
            <div className="modal-footer gap-2">
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
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

export default ProductList;
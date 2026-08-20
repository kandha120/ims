import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import CommonFooter from "../../components/footer/commonFooter";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import { ToastContainer, toast } from "react-toastify";
import AddProduct from "./addproduct";
import * as bootstrap from "bootstrap";
import baseapi from "../../env/baseapi";

const ExpiredProduct = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // all or expired

  // -----------------------------------------------------------------
  // FETCH PRODUCTS
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseapi}/api/products`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) throw new Error("API failed");
        const result = await response.json();
        const list = result.data || result.products || (Array.isArray(result) ? result : []);
        const products = list.map((p) => ({
          id: p._id || p.id,
          productName: p.productName || p.product_name || "No Name",
          category: p.category?.name || p.category || "-",
          sku: p.sku || "-",
          price: Number(p.price) || 0,
          quantity: Number(p.quantity) || 0,
          manufacturedDate: p.manufacturedDate || "N/A",
          expiryOn: p.expiryOn || "N/A",
        }));

        setAllProducts(products);
      } catch (err) {
        toast.error("Could not load products da machi");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // -----------------------------------------------------------------
  // FILTER EXPIRED
  // -----------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allProducts
      .filter((p) => {
        if (activeFilter === "expired") {
          if (!p.expiryOn || p.expiryOn === "NULL") return false;
          const exp = new Date(p.expiryOn);
          return !isNaN(exp.getTime()) && exp <= today;
        }
        return true; // "all" filter
      })
      .filter((p) => {
        if (!searchQuery) return true;
        return (
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.productName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [allProducts, searchQuery, activeFilter]);

  // -----------------------------------------------------------------
  // PAGINATION + S.No
  // -----------------------------------------------------------------
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rows;
    return filteredProducts.slice(start, start + rows).map((item, idx) => ({
      ...item,
      sno: start + idx + 1,
    }));
  }, [filteredProducts, currentPage, rows]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
  const handleRemoveExpired = async (product) => {
  const confirmed = window.confirm(
    `Are you sure you want to remove "${product.productName}" from expired stock?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${baseapi}/api/products/${product.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to remove product");
    }

    setAllProducts((prev) =>
      prev.filter((item) => item.id !== product.id)
    );

    toast.success(`${product.productName} removed successfully`);
  } catch (error) {
    console.error("Remove expired product error:", error);
    toast.error(`Failed to remove ${product.productName}`);
  }
};
  // -----------------------------------------------------------------
  // TABLE COLUMNS
  // -----------------------------------------------------------------
  const columns = [
    { header: "S.No", field: "sno" },
    { header: "SKU", field: "sku" },
    {
      header: "Product",
      field: "productName",
      body: (row) => <Link className="text-primary fw-bold" to="#">{row.productName}</Link>,
    },
    { header: "Category", field: "category" },
    { header: "Manufactured Date", field: "manufacturedDate" },
    { header: "Expired Date", field: "expiryOn" },
    {
      header: "Qty",
      field: "quantity",
      body: (row) => (
        <span className={`badge ${row.quantity === 0 ? "bg-dark" : row.quantity <= 10 ? "bg-danger" : "bg-success"
          }`}>
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Price",
      field: "price",
      body: (row) => <span>₹ {row.price.toFixed(2)}</span>,
    },
    {
      header: "Action",
      field: "action",
      body: (row) => (
      <button
       type="button"
       className="btn btn-sm btn-danger"
       onClick={() => handleRemoveExpired(row)}
       >
      <i className="ti ti-trash me-1"></i>
      Remove
      </button> 
      ),
    },
  ];
  
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex justify-content-between align-items-center">
            <div>
              <h4>Expired Products</h4>
              <h6>Check and manage expired stock</h6>
            </div>
            <SearchFromApi callback={handleSearch} rows={rows} setRows={setRows} />
          </div>

          <div className="mb-3">
            <button className={`btn btn-outline-primary me-2 ${activeFilter === "all" ? "active" : ""}`} onClick={() => setActiveFilter("all")}>All</button>
            <button className={`btn btn-outline-danger ${activeFilter === "expired" ? "active" : ""}`} onClick={() => setActiveFilter("expired")}>Expired</button>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">Loading da machi...</div>
              ) : (
                <PrimeDataTable
                  column={columns}
                  data={paginatedData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredProducts.length}
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

export default ExpiredProduct;

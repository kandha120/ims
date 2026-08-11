import React, { useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  inventoryreportdata,
  currentStockData,
  stockMovementData,
  stockLedgerData,
  stockValuationData,
  lowStockData,
  outOfStockData,
  expiryData,
  movementSpeedData,
  deadStockData,
  warehouseWiseData,
  inventoryAdjustmentData,
} from "../../core/json/inventoryreportdata";
import { all_routes } from "../../routes/all_routes";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";

import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";

const InventoryReport = () => {
  const route = all_routes;
  const data = inventoryreportdata;
  const [listData, _setListData] = useState(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, _setTotalRecords] = useState(5);
  const [rows, setRows] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedReport, setSelectedReport] = useState("currentStock");

  const Category = [
    { value: "electronics", label: "Electronics" },
    { value: "fashion", label: "Fashion" },
    { value: "grocery", label: "Grocery" }
  ];

  const ProductName = [
    { value: "product1", label: "Product 1" },
    { value: "product2", label: "Product 2" },
    { value: "product3", label: "Product 3" }
  ];

  const units = [
    { value: "PC", label: "PC" },
    { value: "BX", label: "BX" }
  ];
  const columns = [
    {
      header: "Product Name",
      field: "productName",
      body: (text) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="img" src={text.img} />
          </Link>
          <Link to="#">{text.productName}</Link>
        </span>
      ),
      sorter: (a, b) => a.productName.length - b.productName.length
    },
    {
      header: "SKU",
      field: "sku",
      sorter: (a, b) => a.sku.length - b.sku.length
    },
    {
      header: "Category",
      field: "category",
      sorter: (a, b) => a.category.length - b.category.length
    },
    {
      header: "Brand",
      field: "brand",
      sorter: (a, b) => a.brand.length - b.brand.length
    },
    {
      header: "Unit",
      field: "unit",
      sorter: (a, b) => a.unit.length - b.unit.length
    },
    {
      header: "Instock Qty",
      field: "instockQty",
      sorter: (a, b) => a.instockQty.length - b.instockQty.length
    }
  ];

  const reportOptions = [
    { label: "Current Stock", value: "currentStock" },
    { label: "Stock Movement", value: "stockMovement" },
    { label: "Stock Ledger", value: "stockLedger" },
    { label: "Stock Valuation", value: "stockValuation" },
    { label: "Low Stock", value: "lowStock" },
    { label: "Out of Stock", value: "outOfStock" },
    { label: "Expiry", value: "expiry" },
    { label: "Movement Speed", value: "movementSpeed" },
    { label: "Dead Stock", value: "deadStock" },
    { label: "Warehouse-wise", value: "warehouseWise" },
    { label: "Adjustments", value: "adjustments" },
  ];

  const reportDataMap = {
    currentStock: currentStockData,
    stockMovement: stockMovementData,
    stockLedger: stockLedgerData,
    stockValuation: stockValuationData,
    lowStock: lowStockData,
    outOfStock: outOfStockData,
    expiry: expiryData,
    movementSpeed: movementSpeedData,
    deadStock: deadStockData,
    warehouseWise: warehouseWiseData,
    adjustments: inventoryAdjustmentData,
  };

  const reportColumnsMap = {
    currentStock: [
      { header: "Warehouse", field: "warehouse" },
      { header: "Product", field: "product" },
      { header: "SKU", field: "sku" },
      { header: "Qty On Hand", field: "qtyOnHand" },
      { header: "Unit Cost", field: "unitCost" },
      { header: "Value", field: "value" },
    ],
    stockMovement: [
      { header: "Date", field: "date" },
      { header: "Product", field: "product" },
      { header: "Type", field: "type" },
      { header: "Qty", field: "qty" },
      { header: "Reference", field: "reference" },
    ],
    stockLedger: [
      { header: "Product", field: "product" },
      { header: "Date", field: "date" },
      { header: "Balance", field: "balance" },
      { header: "In", field: "in" },
      { header: "Out", field: "out" },
    ],
    stockValuation: [
      { header: "Product", field: "product" },
      { header: "Method", field: "method" },
      { header: "Qty", field: "qty" },
      { header: "Value", field: "value" },
    ],
    lowStock: [
      { header: "Product", field: "product" },
      { header: "SKU", field: "sku" },
      { header: "Qty On Hand", field: "qtyOnHand" },
      { header: "Reorder Level", field: "reorderLevel" },
    ],
    outOfStock: [
      { header: "Product", field: "product" },
      { header: "SKU", field: "sku" },
      { header: "Qty On Hand", field: "qtyOnHand" },
    ],
    expiry: [
      { header: "Product", field: "product" },
      { header: "SKU", field: "sku" },
      { header: "Expire Date", field: "expireDate" },
      { header: "Qty", field: "qty" },
    ],
    movementSpeed: [
      { header: "Product", field: "product" },
      { header: "SKU", field: "sku" },
      { header: "Avg Monthly Sales", field: "avgMonthlySales" },
      { header: "Days Cover", field: "daysCover" },
    ],
    deadStock: [
      { header: "Product", field: "product" },
      { header: "SKU", field: "sku" },
      { header: "Qty", field: "qty" },
      { header: "Last Sold Date", field: "lastSoldDate" },
    ],
    warehouseWise: [
      { header: "Warehouse", field: "warehouse" },
      { header: "Product", field: "product" },
      { header: "Qty On Hand", field: "qtyOnHand" },
    ],
    adjustments: [
      { header: "Adjust No", field: "adjustNo" },
      { header: "Date", field: "date" },
      { header: "Product", field: "product" },
      { header: "Qty Before", field: "qtyBefore" },
      { header: "Qty After", field: "qtyAfter" },
      { header: "Reason", field: "reason" },
    ],
  };

  const selectedData = reportDataMap[selectedReport] || [];
  const selectedColumns = reportColumnsMap[selectedReport] || [];

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = reportOptions.find((item) => item.value === selectedReport)?.label || "Inventory Report";
    const headers = selectedColumns.map((col) => col.header);
    const rows = selectedData.map((row) => selectedColumns.map((col) => String(row[col.field] ?? "")));
    doc.text(title, 14, 22);
    autoTable(doc, { startY: 30, head: [headers], body: rows });
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = selectedColumns.map((col) => col.header).join(",");
    const rows = selectedData.map((row) => selectedColumns.map((col) => `"${String(row[col.field] ?? "")}"`).join(",")).join("\n");
    const csv = [headers, rows].filter(Boolean).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(reportOptions.find((item) => item.value === selectedReport)?.label || "inventory").replace(/\s+/g, "_")}.csv`;
    link.click();
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="table-tab">
            <ul className="nav nav-pills">
              <li className="nav-item">
                <Link className="nav-link active" to={route.inventoryreport}>
                  Inventory Report
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={route.stockhistory}>
                  Stock History
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={route.soldstock}>
                  Sold Stock
                </Link>
              </li>
            </ul>
          </div>

          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Inventory</h4>
                <h6>View Reports of Inventory</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <div className="card border-0">
            <div className="card-body pb-1">
              <form>
                <div className="row align-items-end">
                  <div className="col-lg-10">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Choose Date</label>
                          <div className="input-icon-start position-relative">
                            <CommonDateRangePicker />
                            <span className="input-icon-left">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <CommonSelect
                            className="w-100"
                            options={Category}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.value)}
                            placeholder="Choose"
                            filter={false} />
                          
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Products</label>
                          <CommonSelect
                            className="w-100"
                            options={ProductName}
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.value)}
                            placeholder="Choose"
                            filter={false} />
                          
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Units</label>
                          <CommonSelect
                            className="w-100"
                            options={units}
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.value)}
                            placeholder="Choose"
                            filter={false} />
                          
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="mb-3">
                      <button className="btn btn-primary w-100" type="submit">
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div className="d-flex flex-wrap gap-2">
                  {reportOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`btn btn-sm ${selectedReport === option.value ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setSelectedReport(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleExportPDF}>Export PDF</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleExportExcel}>Export Excel</button>
                </div>
              </div>
              <div className="table-responsive">
                <PrimeDataTable
                  column={selectedReport === "currentStock" ? columns : selectedColumns}
                  data={selectedReport === "currentStock" ? listData : selectedData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={selectedReport === "currentStock" ? totalRecords : selectedData.length} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      <CommonFooter />
    </>);

};

export default InventoryReport;
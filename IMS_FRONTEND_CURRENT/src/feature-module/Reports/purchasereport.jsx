import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { purchasereportdata, purchaseSummaryData, purchaseDetailData, supplierWiseData, productWiseData, purchaseReturnData, supplierOutstandingData, gstPurchaseData } from "../../core/json/purchasereportdata";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";

const PurchaseReport = () => {
  const data = purchasereportdata;
  const [listData, _setListData] = useState(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, _setTotalRecords] = useState(5);
  const [rows, setRows] = useState(10);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reportType, setReportType] = useState("productList");

  const ProductName = purchasereportdata.map((item) => ({
    label: item.productName,
    value: item.productName
  }));
  const Store = [
    { label: "Electro Mart", value: "1" },
    { label: "Quantum Gadgets", value: "2" },
    { label: "Prime Bazaar", value: "3" },
    { label: "Gadget World", value: "4" },
    { label: "Volt Vault", value: "5" }
  ];

  const columns = [
    {
      header: "Product Name",
      field: "productName",
      body: (text) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="" src={text.img} />
          </Link>
          <Link to="#">{text.productName}</Link>
        </span>
      ),
      sorter: (a, b) => a.productName.length - b.productName.length
    },
    {
      header: "Product Amount",
      field: "productAmount",
      sorter: (a, b) => a.productAmount.length - b.productAmount.length
    },
    {
      header: "Product Qty",
      field: "productQty",
      sorter: (a, b) => a.productQty.length - b.productQty.length
    },
    {
      header: "Instock Qty",
      field: "instockQty",
      sorter: (a, b) => a.instockQty.length - b.instockQty.length
    }
  ];

  const reportOptions = [
    { label: "Product List", value: "productList" },
    { label: "Purchase Summary", value: "summary" },
    { label: "Purchase Detail", value: "detail" },
    { label: "Supplier-wise Purchases", value: "supplier" },
    { label: "Product-wise Purchases", value: "product" },
    { label: "Purchase Returns", value: "returns" },
    { label: "Supplier Outstanding", value: "outstanding" },
    { label: "GST Purchase Report", value: "gst" }
  ];

  const getActiveData = () => {
    switch (reportType) {
      case "summary":
        return purchaseSummaryData;
      case "detail":
        return purchaseDetailData;
      case "supplier":
        return supplierWiseData;
      case "product":
        return productWiseData;
      case "returns":
        return purchaseReturnData;
      case "outstanding":
        return supplierOutstandingData;
      case "gst":
        return gstPurchaseData;
      default:
        return purchasereportdata;
    }
  };

  const getColumnsFromData = (arr) => {
    if (!arr || arr.length === 0) return [];
    const keys = Object.keys(arr[0]);
    return keys.map((k) => ({ header: k.replace(/([A-Z])/g, " $1"), field: k }));
  };

  const visibleProductData = selectedProduct
    ? data.filter((item) => item.productName === selectedProduct)
    : data;

  const exportToCSV = (rows, filename = "report.csv") => {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(",")].concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToPDF = async (rows, title = "Report") => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF();
      const keys = rows.length ? Object.keys(rows[0]) : [];
      const head = [keys.map(k => k.replace(/([A-Z])/g, ' $1'))];
      const body = rows.map(r => keys.map(k => r[k] ?? ""));
      doc.text(title, 14, 16);
      // @ts-ignore
      doc.autoTable({ startY: 20, head, body });
      doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Purchase report</h4>
              <h6>Manage your Purchase report</h6>
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
                    <div className="col-md-4">
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
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Store</label>
                        <CommonSelect
                          className="w-100"
                          options={Store}
                          value={selectedStore}
                          onChange={(e) => setSelectedStore(e.value)}
                          placeholder="Choose"
                          filter={false} />
                      </div>
                    </div>
                    <div className="col-md-4">
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
        <div className="card table-list-card hide-search">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div>
              <h4>Customer Report</h4>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <li>
                <Link to="#" data-bs-toggle="tooltip" data-bs-placement="top" title="Print">
                  <i className="ti ti-printer" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div className="d-flex flex-wrap gap-2">
                {reportOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`btn btn-sm ${reportType === option.value ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setReportType(option.value)}
                  >
                    {option.label}
                  </button>
                  
                ))}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => exportToPDF(getActiveData(), reportOptions.find(r=>r.value===reportType)?.label || 'Report')}>
                  Export PDF
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => exportToCSV(getActiveData(), (reportOptions.find(r=>r.value===reportType)?.label || 'report') + '.csv')}>
                  Export Excel
                </button>
              </div>
            </div>

            <div className="table-responsive">
              {reportType === 'productList' ? (
                <PrimeDataTable
                  column={columns}
                  data={visibleProductData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={visibleProductData.length} />
              ) : (
                <PrimeDataTable
                  column={getColumnsFromData(getActiveData())}
                  data={getActiveData()}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={(getActiveData() || []).length} />
              )}
            </div>
          </div>
        </div>
        {/* /product list */}
      </div>
      <CommonFooter />
    </div>
  );
};

export default PurchaseReport;

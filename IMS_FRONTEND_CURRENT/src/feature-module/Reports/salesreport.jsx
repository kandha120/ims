import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import CollapesIcon from "../../components/tooltip-content/collapes";
import TableTopHead from "../../components/table-top-head";
import {
  salesSummaryData,
  invoiceDetailData,
  productWiseSalesData,
  customerWiseSalesData,
  salesReturnData,
  outstandingBalanceData,
  gstSalesData,
} from "../../core/json/salesreportdata";

const SalesReport = () => {
  const [selectedTab, setSelectedTab] = useState("summary");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState(null);

  const reportTabs = [
    { key: "summary", label: "Summary" },
    { key: "invoice", label: "Invoice Details" },
    { key: "product", label: "Product Sales" },
    { key: "customer", label: "Customer Sales" },
    { key: "returns", label: "Sales Returns" },
    { key: "outstanding", label: "Outstanding Balances" },
    { key: "gst", label: "GST Sales" },
  ];

  const storeOptions = [
    { label: "All Stores", value: "All" },
    { label: "Electro Mart", value: "Electro Mart" },
    { label: "Quantum Gadgets", value: "Quantum Gadgets" },
    { label: "Prime Bazaar", value: "Prime Bazaar" },
    { label: "Gadget World", value: "Gadget World" },
    { label: "Volt Vault", value: "Volt Vault" },
  ];

  const customerOptions = [
    { label: "All Customers", value: "All" },
    { label: "Carl Evans", value: "Carl Evans" },
    { label: "Minerva Rameriz", value: "Minerva Rameriz" },
    { label: "Robert Lamon", value: "Robert Lamon" },
    { label: "Patricia Lewis", value: "Patricia Lewis" },
  ];

  const salespersonOptions = [
    { label: "All Salespersons", value: "All" },
    { label: "Carl Evans", value: "Carl Evans" },
    { label: "Minerva Rameriz", value: "Minerva Rameriz" },
    { label: "Robert Lamon", value: "Robert Lamon" },
  ];

  const reportDataMap = {
    summary: salesSummaryData,
    invoice: invoiceDetailData,
    product: productWiseSalesData,
    customer: customerWiseSalesData,
    returns: salesReturnData,
    outstanding: outstandingBalanceData,
    gst: gstSalesData,
  };

  const columnsMap = {
    summary: [
      { header: "Period", field: "period" },
      { header: "Store", field: "store" },
      { header: "Salesperson", field: "salesperson" },
      { header: "Total Sales", field: "totalSales" },
      { header: "Total Paid", field: "totalPaid" },
      { header: "Total Due", field: "totalDue" },
      { header: "Orders", field: "totalOrders" },
      { header: "Customers", field: "customerCount" },
      { header: "Products", field: "productCount" },
    ],
    invoice: [
      { header: "Invoice #", field: "invoiceNo", body: (row) => <Link to="#">{row.invoiceNo}</Link> },
      { header: "Customer", field: "customer" },
      { header: "Date", field: "date" },
      { header: "Store", field: "store" },
      { header: "Amount", field: "amount" },
      { header: "Tax", field: "tax" },
      { header: "Discount", field: "discount" },
      { header: "Total Due", field: "amountDue" },
      { header: "Status", field: "status" },
    ],
    product: [
      { header: "Product Name", field: "productName", body: (row) => <Link to="#">{row.productName}</Link> },
      { header: "SKU", field: "sku" },
      { header: "Category", field: "category" },
      { header: "Warehouse", field: "warehouse" },
      { header: "Sold Qty", field: "soldQty" },
      { header: "Sold Amount", field: "soldAmount" },
      { header: "Instock Qty", field: "instockQty" },
    ],
    customer: [
      { header: "Customer", field: "customer" },
      { header: "Orders", field: "totalOrders" },
      { header: "Total Amount", field: "totalAmount" },
      { header: "Paid", field: "paid" },
      { header: "Due", field: "due" },
      { header: "Last Order", field: "lastOrderDate" },
      { header: "Salesperson", field: "salesperson" },
    ],
    returns: [
      { header: "Return #", field: "returnNo" },
      { header: "Invoice #", field: "invoiceNo" },
      { header: "Customer", field: "customer" },
      { header: "Date", field: "date" },
      { header: "Amount", field: "total" },
      { header: "Paid", field: "paid" },
      { header: "Due", field: "due" },
      { header: "Reason", field: "reason" },
      { header: "Status", field: "status" },
    ],
    outstanding: [
      { header: "Customer", field: "customer" },
      { header: "Orders", field: "totalOrders" },
      { header: "Amount Due", field: "outstandingBalance" },
      { header: "Last Payment", field: "lastPaymentDate" },
      { header: "Due Days", field: "dueDays" },
    ],
    gst: [
      { header: "Invoice #", field: "invoiceNo" },
      { header: "Customer", field: "customer" },
      { header: "Date", field: "date" },
      { header: "Tax Rate", field: "taxRate" },
      { header: "Taxable Amount", field: "taxableAmount" },
      { header: "Tax Amount", field: "taxAmount" },
      { header: "Total Amount", field: "totalAmount" },
      { header: "GST State", field: "gstState" },
    ],
  };

  const selectedData = reportDataMap[selectedTab] || [];
  const selectedColumns = columnsMap[selectedTab] || [];

  const parseNumber = (value) => {
    if (value == null) return 0;
    const normalized = String(value).replace(/[^0-9.-]+/g, "");
    return Number.isFinite(Number(normalized)) ? Number(normalized) : 0;
  };

  const filteredData = useMemo(() => {
    return selectedData.filter((row) => {
      const storeMatch =
        !selectedStore ||
        selectedStore === "All" ||
        row.store === selectedStore ||
        row.warehouse === selectedStore;
      const customerMatch =
        !selectedCustomer ||
        selectedCustomer === "All" ||
        row.customer === selectedCustomer ||
        row.customerName === selectedCustomer;
      const salespersonMatch =
        !selectedSalesperson ||
        selectedSalesperson === "All" ||
        row.salesperson === selectedSalesperson;
      return storeMatch && customerMatch && salespersonMatch;
    });
  }, [selectedData, selectedStore, selectedCustomer, selectedSalesperson]);

  const summaryValues = useMemo(() => {
    const totalSales = filteredData.reduce(
      (sum, row) => sum + parseNumber(row.total || row.soldAmount || row.amount || row.totalAmount || row.totalSales),
      0,
    );
    const totalPaid = filteredData.reduce(
      (sum, row) => sum + parseNumber(row.paid),
      0,
    );
    const totalDue = filteredData.reduce(
      (sum, row) => sum + parseNumber(row.due || row.amountDue),
      0,
    );
    return {
      totalSales,
      totalPaid,
      totalDue,
      rows: filteredData.length,
    };
  }, [filteredData]);

  const handleGenerateReport = (event) => {
    event.preventDefault();
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSelectedStore(null);
    setSelectedCustomer(null);
    setSelectedSalesperson(null);
    setCurrentPage(1);
    setRows(10);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = `${reportTabs.find((tab) => tab.key === selectedTab)?.label || "Report"}`;
    const headers = selectedColumns.map((col) => (typeof col.header === "string" ? col.header : ""));
    const fields = selectedColumns.map((col) => col.field).filter(Boolean);

    const rowsForExport = filteredData.map((row) =>
      fields.map((field) => String(row[field] ?? "")),
    );

    doc.text(title, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: rowsForExport,
    });
    doc.save(`${selectedTab}-report.pdf`);
  };

  const handleExportExcel = () => {
    const headers = selectedColumns.map((col) => (typeof col.header === "string" ? col.header : ""));
    const fields = selectedColumns.map((col) => col.field).filter(Boolean);
    const csvContent = [headers, ...filteredData.map((row) => fields.map((field) => `"${String(row[field] ?? "").replace(/"/g, '""')}"`))]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedTab}-report.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeTabLabel = reportTabs.find((tab) => tab.key === selectedTab)?.label || "Sales Report";

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Sales Reporting</h4>
              <h6>Summary, invoice, product, customer, returns, outstanding and GST reports</h6>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={handleRefresh}
            />
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body pb-2">
            <form onSubmit={handleGenerateReport}>
              <div className="row g-3">
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
                    <label className="form-label">Store</label>
                    <CommonSelect
                      className="w-100"
                      options={storeOptions}
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.value)}
                      placeholder="Choose"
                      filter={false}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Customer</label>
                    <CommonSelect
                      className="w-100"
                      options={customerOptions}
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.value)}
                      placeholder="Choose"
                      filter={false}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label">Salesperson</label>
                    <CommonSelect
                      className="w-100"
                      options={salespersonOptions}
                      value={selectedSalesperson}
                      onChange={(e) => setSelectedSalesperson(e.value)}
                      placeholder="Choose"
                      filter={false}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 text-end">
                  <button className="btn btn-primary">Generate Report</button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mb-4">
          <ul className="nav nav-pills report-tabs">
            {reportTabs.map((tab) => (
              <li className="nav-item" key={tab.key}>
                <button
                  type="button"
                  className={`nav-link ${selectedTab === tab.key ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTab(tab.key);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-success sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-success text-white">
                  <i className="ti ti-align-box-bottom-left-filled fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Records</p>
                  <div>
                    <h3>{summaryValues.rows}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-info sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-info text-white">
                  <i className="ti ti-align-box-bottom-left-filled fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Sales</p>
                  <div>
                    <h3>{summaryValues.totalSales.toLocaleString()}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-orange sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-orange text-white">
                  <i className="ti ti-moneybag fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Paid</p>
                  <div>
                    <h3>{summaryValues.totalPaid.toLocaleString()}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-danger sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-danger text-white">
                  <i className="ti ti-alert-circle-filled fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Due</p>
                  <div>
                    <h3>{summaryValues.totalDue.toLocaleString()}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div>
              <h4>{activeTabLabel}</h4>
              <p className="mb-0">Showing {filteredData.length} records for {activeTabLabel}</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <CollapesIcon />
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <PrimeDataTable
                column={selectedColumns}
                data={filteredData}
                rows={rows}
                setRows={setRows}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={filteredData.length}
              />
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default SalesReport;

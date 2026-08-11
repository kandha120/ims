import { storeListData } from "../../core/json/store-list";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";
import { Link } from "react-router";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";
const StoreList = () => {
  const [listData, _setListData] = useState(storeListData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, _setTotalRecords] = useState(5);
  const [rows, setRows] = useState(10);
  const [_searchQuery, setSearchQuery] = useState(undefined);
  const [showPassword, setShowPassword] = useState(false);


  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Store List", 14, 22);

    const tableColumn = ["Store", "User Name", "Email", "Phone", "Status"];
    const tableRows = listData.map((item) => [
      item.store,
      item.username,
      item.email,
      item.phone,
      item.status,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("StoreList.pdf");
  };

  const handleDownloadRowPDF = (store) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Store Details", 14, 20);

    doc.setFontSize(12);
    doc.text(`Store Name: ${store.store || "N/A"}`, 14, 30);
    doc.text(`User Name: ${store.username || "N/A"}`, 14, 40);
    doc.text(`Email: ${store.email || "N/A"}`, 14, 50);
    doc.text(`Phone: ${store.phone || "N/A"}`, 14, 60);
    doc.text(`Status: ${store.status || "N/A"}`, 14, 70);

    doc.save(`Store_${store.store || "details"}.pdf`);
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Store", "User Name", "Email", "Phone", "Status"],
      ...listData.map((item) => [
        `"${item.store || ""}"`,
        `"${item.username || ""}"`,
        `"${item.email || ""}"`,
        `"${item.phone || ""}"`,
        item.status,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "StoreList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header:
        <label className="checkboxs">
          <input type="checkbox" id="select-all" />
          <span className="checkmarks" />
        </label>,

      body: () =>
        <label className="checkboxs">
          <input type="checkbox" />
          <span className="checkmarks" />
        </label>,

      sortable: false,
      key: "checked"
    },
    { header: "Store", field: "store", key: "store" },
    { header: "User Name", field: "username", key: "username" },
    { header: "Email", field: "email", key: "email" },
    { header: "Phone", field: "phone", key: "phone" },
    {
      header: "Status",
      field: "status",
      key: "status",
      body: (data) =>
        <span className="badge badge-success d-inline-flex align-items-center badge-xs">
          <i className="ti ti-point-filled me-1"></i>
          {data.status}
        </span>

    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row) =>
        <div className="d-flex align-items-center gap-2">
          <Link
            className="text-success hover-scale me-2"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDownloadRowPDF(row);
            }}
            title="Download PDF"
          >
            <FiDownload size={20} />
          </Link>
          <Link
            className="text-primary hover-scale me-2"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-store"
            title="Edit"
          >
            <FiEdit size={20} />
          </Link>
          <Link
            className="text-danger hover-scale"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            title="Delete"
          >
            <FiTrash2 size={20} />
          </Link>
        </div>

    }];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Stores</h4>
                <h6>Manage your Store</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={() => { }}
            />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-store">

                <i className="ti ti-circle-plus me-1" />
                Add Store
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows} />

              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">

                    Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Inactive
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={listData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords} />

              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>
      {/* Add Store */}
      <div className="modal fade" id="add-store">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Store</h4>
              </div>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close">

                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form action="store-list.html">
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Store Name <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    User Name <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="input-blocks mb-3">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="pass-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control pass-input" />

                    <span
                      className={`fas toggle-password ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }} />

                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input type="email" className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div className="mb-0">
                  <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                    <span className="status-label ">Status</span>
                    <input
                      type="checkbox"
                      id="user2"
                      className="check"
                      defaultChecked />

                    <label htmlFor="user2" className="checktoggle" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-secondary"
                  data-bs-dismiss="modal">

                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Store
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Store */}
      {/* Edit Store */}
      <div className="modal fade" id="edit-store">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Store</h4>
              </div>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close">

                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form action="store-list.html">
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Store Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="Electro Mart" />

                </div>
                <div className="mb-3">
                  <label className="form-label">
                    User Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="johnsmith" />

                </div>
                <div className="input-blocks mb-3">
                  <label className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="pass-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control pass-input" />

                    <span
                      className={`fas toggle-password ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }} />

                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    defaultValue="electromart@example.com" />

                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={+12498345785} />

                </div>
                <div className="mb-0">
                  <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                    <span className="status-label ">Status</span>
                    <input
                      type="checkbox"
                      id="user1"
                      className="check"
                      defaultChecked />

                    <label htmlFor="user1" className="checktoggle" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-secondary"
                  data-bs-dismiss="modal">

                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Store */}
      <DeleteModal />
    </>);

};

export default StoreList;
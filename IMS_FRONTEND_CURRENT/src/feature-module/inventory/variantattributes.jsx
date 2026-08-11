import React, { useState } from "react";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";














const VariantAttributes = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, _setTotalRecords] = useState(5);
  const [rows, setRows] = useState(10);
  const dataSource = useSelector(
    (state) => state.rootReducer.variantattributes_data
  );


  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Variant Attribute List", 14, 22);

    const tableColumn = ["Variant", "Values", "Created On", "Status"];
    const tableRows = dataSource.map((item) => [
      item.variant,
      item.values,
      item.createdon,
      item.status,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("VariantAttributeList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Variant", "Values", "Created On", "Status"],
      ...dataSource.map((item) => [
        `"${item.variant || ""}"`,
        `"${item.values || ""}"`,
        `"${item.createdon || ""}"`,
        item.status,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "VariantAttributeList.csv");
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
    {
      field: "variant",
      header: "Variant",
      key: "variant",
      sortable: true
    },
    {
      field: "values",
      header: "Values",
      key: "values",
      sortable: true
    },
    {
      field: "createdon",
      header: "Created On",
      key: "createdon",
      sortable: true
    },
    {
      field: "status",
      header: "Status",
      key: "status",
      sortable: true,
      body: (rowData) =>
        <span className="badge table-badge bg-success fw-medium fs-10">
          {rowData.status}
        </span>

    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (_row) =>
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            onClick={() => openModal("edit-units")}>

            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            onClick={() => openModal("delete-modal")}>

            <i className="feather icon-trash-2"></i>
          </Link>
        </div>

    }];

  const [_searchQuery, setSearchQuery] = useState(undefined);


  const handleSearch = (value) => {
    setSearchQuery(value);
  };
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Variant Attributes</h4>
                <h6>Manage your variant attributes</h6>
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
                onClick={() => openModal("add-units")}>

                <i className="ti ti-circle-plus me-1"></i> Add Variant
              </Link>
            </div>
          </div>
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows} />

              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
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
            <div className="card-body">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={dataSource}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords} />

              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Unit */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Variant</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    onClick={() => closeModal("add-units")}
                    aria-label="Close">

                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-bodys">
                  <form>
                    <div className="mb-3">
                      <label className="form-label">
                        Variant<span className="text-danger ms-1">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Values<span className="text-danger ms-1">*</span>
                      </label>
                      {/* <ReactTagsInput /> */}
                      <span className="tag-text mt-2 d-flex">
                        Enter value separated by comma
                      </span>
                    </div>
                    <div className="mb-0 mt-4">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="user2"
                          className="check"
                          defaultChecked />

                        <label htmlFor="user2" className="checktoggle" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    onClick={() => closeModal("add-units")}>

                    Cancel
                  </button>
                  <Link
                    to="#"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={() => closeModal("add-units")}>

                    Add Variant
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Unit */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit Variant </h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    onClick={() => closeModal("edit-units")}
                    aria-label="Close">

                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="mb-3">
                      <label className="form-label">
                        Variant<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Size" />

                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Values<span className="text-danger ms-1">*</span>
                      </label>
                      {/* <ReactTagsInput /> */}
                      <span className="tag-text mt-2 d-flex">
                        Enter value separated by comma
                      </span>
                    </div>
                    <div className="mb-0 mt-3">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="user3"
                          className="check"
                          defaultChecked />

                        <label htmlFor="user3" className="checktoggle" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    onClick={() => closeModal("edit-units")}>

                    Cancel
                  </button>
                  <Link
                    to="#"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={() => closeModal("edit-units")}>

                    Save Changes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal />
    </>);

};

export default VariantAttributes;
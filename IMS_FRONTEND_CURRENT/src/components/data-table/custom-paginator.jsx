import { Paginator } from "primereact/paginator";
import React from "react";

const CustomPaginator = ({
  currentPage,
  totalPages,
  rows,
  totalRecords,
  onPageChange,
  setRows
}) => {
  const handlePaginatorChange = (event) => {
    onPageChange(event.page + 1);
  };

  const handleSelectChange = (value) => {
    setRows(Number(value));
  };

  return (
    <>
      {totalPages ? (
        <>
          <div className="parent-class-datatable row align-items-center gy-2 px-3">
            {/* Left side - Row per page */}
            <div className="col-12 col-md-6 d-flex justify-content-start justify-content-md-start">
              <div
                className="dataTables_length"
                id="DataTables_Table_0_length"
              >
                <label className="d-flex align-items-center flex-wrap mb-0">
                  <span className="me-2">Row Per Page</span>
                  <select
                    name="DataTables_Table_0_length"
                    aria-controls="DataTables_Table_0"
                    className="form-select form-select-sm w-auto"
                    value={rows}
                    onChange={(e) => handleSelectChange(e.target.value)}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="ms-2">Entries</span>
                </label>
              </div>
            </div>

            {/* Right side - Paginator */}
            <div className="col-12 col-md-6 d-flex justify-content-end">
              <div
                className="dataTables_paginate paging_simple_numbers"
                id="DataTables_Table_0_paginate"
              >
                <Paginator
                  first={(currentPage - 1) * rows}
                  rows={rows}
                  totalRecords={totalRecords}
                  onPageChange={handlePaginatorChange}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default CustomPaginator;

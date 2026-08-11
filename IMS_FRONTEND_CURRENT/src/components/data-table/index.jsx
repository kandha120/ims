import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import CustomPaginator from "./custom-paginator";
import { Skeleton } from "primereact/skeleton";
// import { noRecord } from "../../utils/imagepath";
























const PrimeDataTable = ({
  column,
  data = [],
  totalRecords,
  currentPage = 1,
  setCurrentPage,
  rows = 10,
  setRows,
  sortable = true,
  footer = null,
  loading = false,
  isPaginationEnabled = true,
  selectionMode,
  selection,
  onSelectionChange,
  expandedRows,
  onRowToggle,
  rowExpansionTemplate
}) => {
  const skeletonRows = Array(rows).fill({});
  const totalPages = Math.ceil(totalRecords / rows);

  // Calculate paginated data
  const startIndex = (currentPage - 1) * rows;
  const endIndex = startIndex + rows;
  const paginatedData = loading ? skeletonRows : data.slice(startIndex, endIndex);

  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const customEmptyMessage = () =>
    <div className="no-record-found">
      {/* <img src={noRecord} alt="no-record"></img> */}
      <h4>No records found.</h4>
      <p>No records to show here...</p>
    </div>;


  // Prepare DataTable props based on selection mode
  const getDataTableProps = () => {
    const baseProps = {
      value: paginatedData,
      className: "table custom-table datatable",
      totalRecords: totalRecords,
      paginator: false,
      emptyMessage: customEmptyMessage,
      footer: footer,
      dataKey: "id",
      expandedRows,
      onRowToggle,
      rowExpansionTemplate
    };

    if (selectionMode && ['multiple', 'checkbox'].includes(selectionMode)) {
      return {
        ...baseProps,
        selectionMode: selectionMode,
        selection: selection,
        onSelectionChange: onSelectionChange
      };
    } else if (selectionMode && ['single', 'radiobutton'].includes(selectionMode)) {
      return {
        ...baseProps,
        selectionMode: selectionMode,
        selection: selection,
        onSelectionChange: onSelectionChange
      };
    } else {
      return baseProps;
    }
  };

  return (
    <>
      <DataTable {...getDataTableProps()}>
        {column?.map((col, index) =>
          <Column
            header={col.header}
            key={col.field || index}
            field={col.field}
            body={(rowData, options) => {
              return loading ?
                <Skeleton
                  width="100%"
                  height="2rem"
                  className="skeleton-glow" /> :

                col.body ?
                  col.body(rowData, options) :

                  rowData[col.field];

            }}
            sortable={sortable === false ? false : col.sortable !== false}
            sortField={col.sortField ? col.sortField : col.field}
            style={col.style}
            className={col.className ? col.className : ""} />

        )}
      </DataTable>
      {isPaginationEnabled &&
        <CustomPaginator
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          rows={rows}
          setRows={setRows} />

      }
    </>);

};

export default PrimeDataTable;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import { toast } from "react-toastify";
import baseapi from "../../env/baseapi";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// CSRF Token Helper
const getCSRFToken = () => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, 9) === 'csrftoken=') {
        cookieValue = decodeURIComponent(cookie.substring(9));
        break;
      }
    }
  }
  return cookieValue;
};

const Warehouse = () => {
  const [listData, setListData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Form States (used for both Add & Edit)
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedContactPerson, setSelectedContactPerson] = useState("");
  const [deleteWarehouseId, setDeleteWarehouseId] = useState(null);
  const [email, setEmail] = useState("");


  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);


  const API_URL = `${baseapi}/api/warehouses`;

  // const cityOptions = [
  //   { label: "Select", value: "" },
  //   { label: "Los Angles", value: "los-angles" },
  //   { label: "New York City", value: "new-york-city" },
  //   { label: "Houston", value: "houston" },
  // ];

  const stateOptions = [
    { label: "Select", value: "" },
    { label: "California", value: "california" },
    { label: "New York", value: "new-york" },
    { label: "Texas", value: "texas" },
  ];

  const countryOptions = [
    { label: "Select", value: "" },
    { label: "United States", value: "united-states" },
    { label: "Canada", value: "canada" },
    { label: "Germany", value: "germany" },
  ];

  const contactPersonOptions = [
    { label: "Select", value: "" },
    { label: "Steven", value: "steven" },
    { label: "Gravely", value: "gravely" },
  ];

  // Fetch Warehouses
  const fetchWarehouses = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setListData(data);
      setTotalRecords(data.length);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load warehouses");
    }
  };

  // Products State for Expansion
  const [allProducts, setAllProducts] = useState([]);
  const [expandedRows, setExpandedRows] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${baseapi}/api/products`, { credentials: "include" });
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.products || data.data || []);
      setAllProducts(list);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  // Row Expansion Template
  const rowExpansionTemplate = (data) => {
    // Filter products belonging to this warehouse (by name)
    const filtered = allProducts.filter(
      (p) => (p.warehouse?.name === data.name) || (p.warehouse?.id === data.id)
    );

    return (
      <div className="p-3 bg-light">
        <h6 className="mb-2">Products in {data.name}</h6>
        {filtered.length > 0 ? (
          <div className="table-responsive" style={{ maxHeight: "300px", overflow: "auto" }}>
            <table className="table table-sm table-bordered bg-white">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, idx) => (
                  <tr key={idx}>
                    <td>{product.productName || product.product_name || product.name || "Unnamed Product"}</td>
                    <td>{product.category || "N/A"}</td>
                    <td>₹{Number(product.price || 0).toFixed(2)}</td>
                    <td>{product.quantity || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0">No products found for this warehouse.</p>
        )}
      </div>
    );
  };

  const toggleRow = (row) => {
    const _expandedRows = { ...expandedRows };
    if (_expandedRows[row.id]) {
      delete _expandedRows[row.id];
    } else {
      _expandedRows[row.id] = true;
    }
    setExpandedRows(_expandedRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      name: e.target.warehouse.value,
      contactPerson: selectedContactPerson,
      email: e.target.email.value,
      phone: e.target.phone.value,
      address: e.target.address.value,
      city: selectedCity,
      state: selectedState,
      country: selectedCountry,
      postalCode: e.target.postalCode.value,
      status: e.target.status.checked ? "Active" : "Inactive",
    };

    try {
      const url = isEditMode ? `${API_URL}/${editingWarehouse.id}` : API_URL;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || "Operation failed");
      }

      toast.success(isEditMode ? "Warehouse updated successfully!" : "Warehouse added successfully!");

      e.target.reset();
      setSelectedCity("");
      setSelectedState("");
      setSelectedCountry("");
      setSelectedContactPerson("");
      setIsEditMode(false);
      setEditingWarehouse(null);

      // Close modal properly
      closeModal("add-warehouse");

      await fetchWarehouses();
    } catch (error) {
      toast.error("Failed: " + error.message);
    }
  };

  const openEditModal = (warehouse) => {
    setIsEditMode(true);
    setEditingWarehouse(warehouse);
    setSelectedCity(warehouse.city || "");
    setSelectedState(warehouse.state || "");
    setSelectedCountry(warehouse.country || "");
    setSelectedContactPerson(warehouse.contactPerson || "");
    setEmail(warehouse.email || "");

    // Open modal
    openModal("add-warehouse");
  };

  // Delete Warehouse
  const handleDeleteWarehouse = async () => {
    if (!deleteWarehouseId) return;

    try {
      const response = await fetch(`${API_URL}/${deleteWarehouseId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCSRFToken(),
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Warehouse deleted successfully!");
      setDeleteWarehouseId(null);
      closeModal("delete-modal");
      await fetchWarehouses();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Warehouse List", 14, 22);

    const tableColumn = ["Warehouse", "Contact Person", "Phone", "Email", "Status"];
    const tableRows = listData.map((item) => [
      item.name || "[No Name]",
      item.contactPerson || "[No Contact]",
      item.phone,
      item.email,
      item.status,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("WarehouseList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Warehouse", "Contact Person", "Phone", "Email", "Status"],
      ...listData.map((item) => [
        `"${item.name || ""}"`,
        `"${item.contactPerson || ""}"`,
        `"${item.phone || ""}"`,
        `"${item.email || ""}"`,
        item.status,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "WarehouseList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: "S.No.",
      body: (rowData, { rowIndex }) => rowIndex + 1,
      sortable: false,
      key: "sno",
      style: { width: "60px" },
    },
    {
      header: "Warehouse",
      key: "warehouse",
      body: (row) => row.name || "[No Name]",
    },
    {
      header: "Contact Person",
      key: "contactPerson",
      body: (data) => (
        <div className="d-flex align-items-center">
          <div className="ms-2">
            <p className="mb-0">
              <Link to="#" className="text-default">
                {data.contactPerson || "[No Contact]"}
              </Link>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      field: "phone",
      key: "phone",
    },
    {
      header: "Email",
      key: "email",
      body: (row) => (
        <a href={`mailto:${row.email}`} className="text-default text-decoration-underline">
          {row.email || "[No Email]"}
        </a>
      ),
    },
    {
      header: "Status",
      field: "status",
      key: "status",
      body: (data) => (
        <span className="badge badge-success d-inline-flex align-items-center badge-xs">
          <i className="ti ti-point-filled me-1"></i>
          {data.status || "Unknown"}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      sortable: false,
      style: { width: "120px", textAlign: "center" },
      body: (row) => (
        <div className="edit-delete-action d-flex justify-content-center gap-2">
          {/* Dropdown / Expand Icon */}
          <button
            className="p-2 border-0 bg-transparent"
            onClick={() => toggleRow(row)}
            title="View Products"
          >
            <i className={`feather icon-chevron-${expandedRows?.[row.id] ? "up" : "down"} fs-18 text-info`}></i>
          </button>

          <button
            className="p-2 border-0 bg-transparent"
            onClick={() => openEditModal(row)}
            title="Edit Warehouse"
          >
            <i className="feather icon-edit fs-18 text-primary"></i>
          </button>
          <button
            className="p-2 border-0 bg-transparent"
            onClick={() => {
              setDeleteWarehouseId(row.id);
              openModal("delete-modal");
            }}
            title="Delete Warehouse"
          >
            <i className="feather icon-trash-2 fs-18 text-danger"></i>
          </button>
        </div>
      ),
    }

  ];

  const handleSearch = (value) => setSearchQuery(value);

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Warehouses</h4>
                <h6>Manage your warehouses</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchWarehouses}
            />
            <div className="page-btn">
              {/* Fixed: Add button now works */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setIsEditMode(false);
                  setEditingWarehouse(null);
                  setSelectedCity("");
                  setSelectedState("");
                  setSelectedCountry("");
                  setSelectedContactPerson("");
                  setEmail("");
                  openModal("add-warehouse");
                }}
              >
                <i className="ti ti-circle-plus me-1" />
                Add Warehouse
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi callback={handleSearch} rows={rows} setRows={setRows} />
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown">
                  <Link to="#" className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    Status
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1">Active</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1">Inactive</Link></li>
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
                  totalRecords={totalRecords}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add / Edit Warehouse Modal */}
      <div className="modal fade" id="add-warehouse">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>{isEditMode ? "Edit Warehouse" : "Add Warehouse"}</h4>
              </div>
              <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Warehouse <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Warehouse"
                        name="warehouse"
                        defaultValue={isEditMode ? editingWarehouse?.name : ""}
                        required
                      />
                    </div>
                  </div>

                  {/* Fixed: Contact Person dropdown back */}
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Contact Person <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Contact Person"
                        value={selectedContactPerson}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z ]*$/.test(value)) {
                            setSelectedContactPerson(value);
                          }
                        }}
                      />
                    </div>
                  </div>


                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Email <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          let value = e.target.value;

                          // Remove spaces
                          value = value.replace(/\s/g, "");

                          // Allow only email valid characters
                          value = value.replace(/[^A-Za-z0-9@._-]/g, "");

                          setEmail(value);
                        }}
                        onBlur={() => {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (email && !emailRegex.test(email)) {
                            toast.error("Invalid email format");
                          }
                        }}
                        required
                      />

                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Phone <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Phone"
                        name="phone"
                        required
                        defaultValue={isEditMode ? editingWarehouse?.phone : ""}
                        pattern="^[0-9]{10}$"
                        maxLength="10"
                        onInvalid={(e) => e.target.setCustomValidity("Phone number must be 10 digit only")}
                        onInput={(e) => {
                          e.target.setCustomValidity("");
                          e.target.value = e.target.value.replace(/\D/g, "");

                        }}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Address <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Address"
                        name="address"
                        defaultValue={isEditMode ? editingWarehouse?.address : ""}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">City <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the City"
                        value={selectedCity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z ]*$/.test(value)) {
                            setSelectedCity(value);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">State <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the State"
                        value={selectedState}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z ]*$/.test(value)) {
                            setSelectedState(value);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Country <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Country"
                        value={selectedCountry}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z ]*$/.test(value)) {
                            setSelectedCountry(value);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Fixed: postalCode name */}
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Postal Code <span className="text-danger">*</span>
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Code"
                        name="postalCode"
                        defaultValue={isEditMode ? editingWarehouse?.postalCode : ""}
                        maxLength={6}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, ""); // Allow only numbers
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="users5"
                          name="status"
                          className="check"
                          defaultChecked={isEditMode ? editingWarehouse?.status === "Active" : true}
                        />
                        <label htmlFor="users5" className="checktoggle mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? "Update Warehouse" : "Add Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="content p-5 px-3 text-center">
              <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                <i className="ti ti-trash fs-24 text-danger" />
              </span>
              <h4>Are you sure you want to delete this warehouse?</h4>
              <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                <button type="button" className="btn me-2 btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteWarehouse}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Warehouse;
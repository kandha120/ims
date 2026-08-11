import { user41 } from "../../utils/imagepath";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import TableTopHead from "../../components/table-top-head";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import baseapi from "../../env/baseapi";

const Customers = () => {
  const [listData, setListData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);

  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    gstin: "",
    companyName: "",
    status: true,
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    gstin: "",
    companyName: "",
    status: true,
  });

  const fileInputRef = useRef(null);
  const editFileRef = useRef(null);

  const API_URL = `${baseapi}/api/customers`;

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setListData(data);
      setTotalRecords(data.length);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load customers");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fill edit form
  useEffect(() => {
    if (editCustomer) {
      setEditForm({
        firstName: editCustomer.firstName || "",
        lastName: editCustomer.lastName || "",
        email: editCustomer.email || "",
        phone: editCustomer.phone || "",
        address: editCustomer.address || "",
        city: editCustomer.city || "",
        state: editCustomer.state || "",
        country: editCustomer.country || "",
        postalCode: editCustomer.postalCode || "",
        gstin: editCustomer.gstin || "",
        companyName: editCustomer.companyName || "",
        status: editCustomer.status === "Active",
      });
    }
  }, [editCustomer]);

  // Validation Handler
  const handleInputChange = (e, type) => {
    const { name, value } = e.target;
    let newValue = value;

    // First/Last Name: Only letters
    if (name === "firstName" || name === "lastName") {
      if (!/^[a-zA-Z]*$/.test(value)) return;
    }

    // Phone: Only numbers, max 10 digits
    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    // Address: Max 60 chars, letters and numbers. 
    if (name === "address") {
      if (value.length > 60) return;
    }

    // City, State, Country: Letters and space only
    if (["city", "state", "country"].includes(name)) {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    // Postal Code: 6 digits, display 3 3
    if (name === "postalCode") {
      const digits = value.replace(/\D/g, "");
      if (digits.length > 6) return;

      if (digits.length > 3) {
        newValue = `${digits.slice(0, 3)} ${digits.slice(3)}`;
      } else {
        newValue = digits;
      }
    }

    if (type === "add") {
      setAddForm((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  // ADD CUSTOMER
  const handleAddCustomer = async (e) => {
    e.preventDefault();

    const newCustomer = {
      ...addForm,
      status: addForm.status ? "Active" : "Inactive",
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || "Failed to add");
      }

      toast.success("Customer added successfully!");
      setAddForm({
        firstName: "", lastName: "", email: "", phone: "",
        address: "", city: "", state: "", country: "",
        postalCode: "", gstin: "", status: true
      });
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (fileInputRef.current) fileInputRef.current.value = "";

      closeModal("add-customer");

      fetchCustomers();
    } catch (error) {
      toast.error(error.message || "Failed to add customer");
    }
  };

  // EDIT CUSTOMER
  const handleEditCustomer = async (e) => {
    e.preventDefault();

    if (!editCustomer?.id) {
      toast.error("Customer ID missing");
      return;
    }

    const updatedData = {
      ...editForm,
      status: editForm.status ? "Active" : "Inactive",
    };

    try {
      const response = await fetch(`${API_URL}/${editCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || "Failed to update");
      }

      toast.success("Customer updated successfully!");

      toast.success("Customer updated successfully!");

      closeModal("edit-customer");

      setEditCustomer(null);
      setEditForm({
        firstName: "", lastName: "", email: "", phone: "",
        address: "", city: "", state: "", country: "",
        postalCode: "", gstin: "", status: true
      });
      if (editFileRef.current) editFileRef.current.value = "";

      fetchCustomers();
    } catch (error) {
      toast.error(error.message || "Failed to update");
    }
  };

  // DELETE CUSTOMER
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const confirmDelete = () => {
    if (selectedCustomer?.id) {
      handleDelete(selectedCustomer.id);
      setSelectedCustomer(null);
      handleDelete(selectedCustomer.id);
      setSelectedCustomer(null);
      closeModal("delete-modal");
    }
  };

  const columns = [
    {
      header: "S.No.",
      body: (_, { rowIndex }) => rowIndex + 1,
      sortable: false,
      style: { width: "60px" },
    },
    {
      header: "Customer",
      body: (row) => (
        <div className="d-flex align-items-center">
          <Link to="#">
            {row.firstName} {row.lastName}
          </Link>
        </div>
      ),
    },
    { header: "Company", field: "companyName" },
    { header: "Email", field: "email" },
    { header: "Phone", field: "phone" },
    { header: "Country", field: "country" },
    {
      header: "Status",
      body: (row) => (
        <span className={`d-inline-flex align-items-center p-1 pe-2 rounded-1 text-white bg-${row.status === "Active" ? "success" : "danger"} fs-10`}>
          <i className="ti ti-point-filled me-1 fs-11"></i>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      body: (row) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link className="me-2 p-2 border rounded" to="#">
            <i className="feather icon-eye"></i>
          </Link>
          <Link
            className="me-2 p-2 border rounded"
            to="#"
            onClick={() => {
              setEditCustomer(row);
              openModal("edit-customer");
            }}
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 border rounded"
            to="#"
            onClick={() => {
              setSelectedCustomer(row);
              openModal("delete-modal");
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
    doc.text("Customer List", 14, 22);

    const tableColumn = ["First Name", "Last Name", "Email", "Phone", "Country", "Status"];
    const tableRows = listData.map((item) => [
      item.firstName,
      item.lastName,
      item.email,
      item.phone,
      item.country,
      item.status,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    doc.save("CustomerList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["First Name", "Last Name", "Email", "Phone", "Country", "Status"],
      ...listData.map((item) => [
        `"${item.firstName || ""}"`,
        `"${item.lastName || ""}"`,
        `"${item.email || ""}"`,
        `"${item.phone || ""}"`,
        `"${item.country || ""}"`,
        item.status,
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "CustomerList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Customers</h4>
                <h6>Manage your customers</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchCustomers}
            />
            <div className="page-btn">
              <Link to="#" className="btn btn-primary text-white" onClick={() => openModal("add-customer")}>
                <i className="ti ti-circle-plus me-1" /> Add Customer
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi callback={() => { }} rows={rows} setRows={setRows} />
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
                />
              </div>
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0 text-gray-9">2025 © iatsolution. All Rights Reserved</p>
          <p>Designed &amp; Developed by <Link to="#" className="text-primary">iatsolutions</Link></p>
        </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="add-customer">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Add Customer</h4>
              <button type="button" className="close" onClick={() => closeModal("add-customer")}><span>×</span></button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="modal-body">
                <div className="profile-pic-upload">
                  <div className="profile-pic">
                    <span><i className="feather icon-plus-circle plus-down-add" /> Add Image</span>
                  </div>
                  <div className="mb-3 d-flex flex-column align-items-center">
                    <div className="image-upload mb-0">
                      <input type="file" ref={fileInputRef} accept="image/jpeg,image/png" />
                      <div className="image-uploads"><h4>Upload Image</h4></div>
                    </div>
                    <small className="text-muted d-block text-center">
                      JPEG, PNG up to 2 MB<br />
                      <span className="text-danger">(Image upload not sent yet)</span>
                    </small>
                  </div>
                </div>

                <div className="row">
                  <div className="col-lg-6 mb-3">
                    <label>First Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="firstName" value={addForm.firstName} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>Last Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="lastName" value={addForm.lastName} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Company Name</label>
                    <input type="text" className="form-control" name="companyName" value={addForm.companyName} onChange={(e) => handleInputChange(e, "add")} />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" name="email" value={addForm.email} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Phone <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="phone" value={addForm.phone} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Address <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="address" value={addForm.address} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>City <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="city" value={addForm.city} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>State <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="state" value={addForm.state} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>Country <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="country" value={addForm.country} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>Postal Code <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="postalCode" value={addForm.postalCode} onChange={(e) => handleInputChange(e, "add")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>GSTIN</label>
                    <input type="text" className="form-control" name="gstin" value={addForm.gstin} onChange={(e) => handleInputChange(e, "add")} />
                  </div>
                  <div className="col-lg-12">
                    <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                      <span className="status-label">Status</span>
                      <input type="checkbox" id="user1" name="status" className="check" checked={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.checked })} />
                      <label htmlFor="user1" className="checktoggle"></label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => closeModal("add-customer")}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="edit-customer">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Edit Customer</h4>
              <button type="button" className="close" onClick={() => closeModal("edit-customer")}><span>×</span></button>
            </div>
            <form onSubmit={handleEditCustomer}>
              <div className="modal-body">
                <div className="profile-pic-upload image-field">
                  <div className="profile-pic p-2">
                    <img src={editCustomer?.avatar || user41} alt="user" className="object-fit-cover h-100 rounded-1" />
                  </div>
                  <div className="mb-3">
                    <div className="image-upload mb-0">
                      <input type="file" ref={editFileRef} accept="image/jpeg,image/png" />
                      <div className="image-uploads"><h4>Change Image</h4></div>
                    </div>
                    <p className="mt-2">JPEG, PNG up to 2 MB (Not sent yet)</p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-lg-6 mb-3">
                    <label>First Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="firstName" value={editForm.firstName}
                      onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>Last Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="lastName" value={editForm.lastName}
                      onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Company Name</label>
                    <input type="text" className="form-control" name="companyName" value={editForm.companyName}
                      onChange={(e) => handleInputChange(e, "edit")} />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Email <span className="text-danger">*</span></label>
                    <input type="email" className="form-control" name="email" value={editForm.email}
                      onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Phone <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="phone" value={editForm.phone}
                      onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label>Address <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="address" value={editForm.address}
                      onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>City <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="city" value={editForm.city} onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>State <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="state" value={editForm.state} onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>Country <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="country" value={editForm.country} onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>Postal Code <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="postalCode" value={editForm.postalCode}
                      onChange={(e) => handleInputChange(e, "edit")} required />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label>GSTIN</label>
                    <input type="text" className="form-control" name="gstin" value={editForm.gstin}
                      onChange={(e) => handleInputChange(e, "edit")} />
                  </div>
                  <div className="col-lg-12">
                    <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                      <span className="status-label">Status</span>
                      <input type="checkbox" id="user2" className="check" checked={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.checked })} />
                      <label htmlFor="user2" className="checktoggle"></label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => closeModal("edit-customer")}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Customer</h5>
              <button type="button" className="btn-close" onClick={() => closeModal("delete-modal")}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</strong>?</p>
            </div>
            <div className="modal-footer gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => closeModal("delete-modal")}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Customers;
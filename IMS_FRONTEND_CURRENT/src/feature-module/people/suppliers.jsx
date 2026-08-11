import { useState, useEffect } from "react";
import { openModal, closeModal } from "../../utils/modal-cleanup";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { editSupplier } from "../../utils/imagepath";
import { Link } from "react-router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import baseapi from "../../env/baseapi";

const API_URL = `${baseapi}/api/suppliers`; // base url

const Suppliers = () => {
  const [listData, setListData] = useState([]);
  const [rows, setRows] = useState(10);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [gstin, setGstin] = useState("");
  const [status, setStatus] = useState(true);

  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);





  const cityOptions = [
    { label: "Select", value: "" },
    { label: "Los Angles", value: "los-angles" },
    { label: "New York City", value: "new-york-city" },
    { label: "Houston", value: "houston" },
  ];

  const stateOptions = [
    { label: "Select", value: "" },
    { label: "California", value: "california" },
    { label: "New York", value: "new-york" },
    { label: "Texas", value: "texas" },
  ];

  // const countryOptions = [
  //   { label: "Select", value: "" },
  //   { label: "United States", value: "united-states" },
  //   { label: "Canada", value: "canada" },
  //   { label: "Germany", value: "germany" },
  // ];

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: {},
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setListData(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error("Failed to load suppliers");
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Open Edit
  const openEdit = (supplier) => {
    setEditId(supplier.id);
    setFirstName(supplier.firstName || "");
    setLastName(supplier.lastName || "");
    setCompanyName(supplier.companyName || "");
    setEmail(supplier.email || "");
    setPhone(supplier.phone || "");
    setAddress(supplier.address || "");
    setCity(supplier.city || "");
    setState(supplier.state || "");
    setCountry(supplier.country || "");
    setPostalCode(supplier.postalCode || "");
    setGstin(supplier.gstin || "");
    setStatus(supplier.status === "Active");

    openModal("add-supplier");
  };

  console.log(country, "prem")

  // Reset
  const resetForm = () => {
    setEditId(null);
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setPostalCode("");
    setGstin("");
    setStatus(true);
  };

  // POST (Add)
  const addSupplier = async (payload) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text(); // Get server error message
        console.log("POST Error Response:", errorText);
        let errorMessage = "Add failed";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (e) {
          // If not JSON, use the status text or keep default
        }
        throw new Error(errorMessage);
      }

      toast.success("Added Successfully!");
      resetForm();
      fetchSuppliers();
      closeModal("add-supplier");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Add failed");
    }
  };


  // PUT (Update)
  const updateSupplier = async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("PUT Failed");

      toast.success("Updated Successfully!");
      resetForm();
      fetchSuppliers();
      closeModal("add-supplier");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      firstName,
      lastName,
      companyName,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      gstin,
      status: status ? "Active" : "Inactive",
    };

    console.log("prem ", payload);

    if (editId) {
      updateSupplier(editId, payload);
    } else {
      addSupplier(payload);
    }
  };

  // Delete
  const confirmDelete = async () => {
    try {
      await fetch(`${API_URL}/${deleteId}`, {
        method: "DELETE",
        headers: {},
        credentials: "include",
      });

      toast.success("Deleted!");
      setDeleteId(null);
      fetchSuppliers();
      closeModal("delete-modal");
    } catch (err) {
      toast.error("Delete failed");
    }
  };


  // === EXPORT HANDLERS ===
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Supplier List", 14, 22);

    const tableColumn = ["Name", "Email", "Phone", "Country", "Status"];
    const tableRows = listData.map((item) => [
      `${item.firstName} ${item.lastName}`,
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

    doc.save("SupplierList.pdf");
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Country", "Status"],
      ...listData.map((item) => [
        `"${item.firstName || ""} ${item.lastName || ""}"`,
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
    link.setAttribute("download", "SupplierList.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { header: "S.No.", body: (_, { rowIndex }) => rowIndex + 1 },
    {
      header: "Supplier",
      body: (d) => (
        <div className="d-flex align-items-center">
          <div className="ms-2">
            <p className="text-gray-9 mb-0">
              <Link to="#">{d.firstName} {d.lastName}</Link>
            </p>
          </div>
        </div>
      ),
    },
    { header: "Company", field: "companyName" },
    { header: "Email", field: "email" },
    { header: "Phone", field: "phone" },
    { header: "Country", field: "country" },
    {
      header: "Status",
      body: (d) => (
        <span className={`badge ${d.status === "Active" ? "badge-success" : "badge-danger"} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1"></i>
          {d.status || "Inactive"}
        </span>
      ),
    },
    {
      header: "Action",
      body: (row) => (
        <div className="edit-delete-action">
          <Link className="me-2 p-2" to="#"><i className="feather icon-eye"></i></Link>
          <button type="button" className="me-2 p-2 border-0 bg-transparent" onClick={() => openEdit(row)}>
            <i className="feather icon-edit"></i>
          </button>
          <button type="button" className="p-2 border-0 bg-transparent"
            onClick={() => {
              setDeleteId(row.id);
              openModal("delete-modal");
            }}
          >
            <i className="feather icon-trash-2"></i>
          </button>
        </div>
      ),
    },
  ];


  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Suppliers</h4>
                <h6>Manage your suppliers</h6>
              </div>
            </div>
            <TableTopHead
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onRefresh={fetchSuppliers}
            />
            <div className="page-btn">
              <button className="btn btn-primary" onClick={() => { resetForm(); openModal("add-supplier"); }}>
                Add Supplier
              </button>
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
                  totalRecords={listData.length}
                />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add/Edit Modal */}
      <div className="modal fade" id="add-supplier">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editId ? "Edit Supplier" : "Add Supplier"}</h4>
              <button type="button" className="btn-close" onClick={() => closeModal("add-supplier")}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>First Name *</label>
                      <input type="text" className="form-control"
                        value={firstName}
                        onChange={(e) => {
                          const value = e.target.value;
                          const cleaned = value.replace(/[^A-Za-z\s]/g, "");
                          setFirstName(cleaned);
                        }}
                        required /></div></div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>Last Name *</label>
                      <input type="text" className="form-control" value={lastName}
                        onChange={(e) => {
                          const value1 = e.target.value;
                          const cleaned = value1.replace(/[^A-Za-z\s]/g, "");
                          setLastName(cleaned);
                        }}
                        required />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label>Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label>Email *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Email"
                        value={email}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\s/g, "");
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
                    </div></div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label>Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Phone number"
                        value={phone}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^0-9]/g, "");
                          if (value.length > 10) {
                            value = value.substring(0, 10);
                          }

                          setPhone(value);
                        }}
                        required
                      />

                    </div></div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label>Address *</label>
                      <input type="text" className="form-control" value={address}
                        onChange={e => setAddress(e.target.value)}
                        required />
                    </div></div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>City *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the City"
                        value={city}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z ]*$/.test(value)) {
                            setCity(value);
                          }
                        }}
                      />
                    </div></div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>GSTIN</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter GSTIN"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                      />
                    </div></div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>State *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the State"
                        value={state}
                        onChange={(e) => {
                          const value1 = e.target.value;
                          if (/^[A-Za-z ]*$/.test(value1)) {
                            setState(value1)
                          }
                        }} />
                    </div></div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>Country *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter the Country"
                        value={country}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[A-Za-z\s]*$/.test(value)) {
                            setCountry(value);
                          }
                        }}
                      />

                    </div></div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label>Postal Code *</label>
                      <input type="text" className="form-control"
                        placeholder="Enter the Postal Code"
                        value={postalCode}
                        maxLength={6}
                        onInput={(e) => {
                          const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                          setPostalCode(onlyNumbers);
                        }}
                        required />
                    </div></div>
                  <div className="col-md-12">
                    <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                      <span className="status-label">Status</span>
                      <input id="status-toggle" type="checkbox" className="check" checked={status} onChange={e => setStatus(e.target.checked)} />
                      <label htmlFor="status-toggle" className="checktoggle mb-0" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => closeModal("add-supplier")}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? "Update" : "Add"} Supplier</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center py-4">
              <h5>Delete Supplier?</h5>
              <p>Are you sure?</p>
              <button type="button" className="btn btn-secondary me-3" onClick={() => closeModal("delete-modal")}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Suppliers;


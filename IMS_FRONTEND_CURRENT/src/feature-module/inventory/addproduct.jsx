import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import Addunits from "../../core/modals/inventory/addunits";
import AddCategory from "../../core/modals/inventory/addcategory";
import AddBrand from "../../core/modals/addbrand";
import CounterThree from "../../components/counter/counterThree";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import AddVariant from "../../core/modals/inventory/addvariant";
import AddVarientNew from "../../core/modals/inventory/addVarientNew";
import CommonChipsInput from "../../components/chip";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import CommonSelect from "../../components/select/common-select";
import DeleteModal from "../../components/delete-modal";
import { Editor } from "primereact/editor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseapi from "../../env/baseapi";
const customStyles = `
  .add-product-form {
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px;
  }
  .accordion-item {
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .accordion-header {
    padding: 15px;
  }
  .accordion-body {
    padding: 20px;
  }
  .form-label {
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
  }
  .form-control, .input-tags, .variant-select {
    border-radius: 4px;
    border: 1px solid #ced4da;
    padding: 10px;
    font-size: 14px;
  }
  .add-newplus {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .add-newplus a {
    color: #007bff;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .single-pill-product .nav-pills {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }
  .footer {
    padding: 15px 20px;
    font-size: 14px;
  }
  @media (max-width: 768px) {
    .add-product-form {
      padding: 15px;
    }
    .col-sm-6, .col-lg-4 {
      margin-bottom: 15px;
    }
    .single-pill-product .nav-pills {
      flex-direction: column;
      align-items: flex-start;
    }
  }
  @media (max-width: 576px) {
    .page-title h4 {
      font-size: 20px;
    }
    .page-title h6 {
      font-size: 14px;
    }
    .btn {
      font-size: 14px;
      padding: 8px 12px;
    }
    .form-label {
      font-size: 14px;
    }
    .form-control, .input-tags, .variant-select {
      font-size: 12px;
    }
    .accordion-header {
      padding: 10px;
    }
    .accordion-body {
      padding: 15px;
    }
  }
`;
const AddProduct = ({ editId = null, onClose = null, onSave = () => { } }) => {
  const route = all_routes;
  const [isEditMode, setIsEditMode] = useState(!!editId);
  const [loadingProduct, setLoadingProduct] = useState(!!editId);
  const [tags, setTags] = useState(["Red", "Black"]);
  const [product, setProduct] = useState(false);
  const [product2, setProduct2] = useState(true);
  const [date1, setDate1] = useState(new Date());
  const [date2, setDate2] = useState(new Date());
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedBarcodeSymbol, setSelectedBarcodeSymbol] = useState(null);
  const [selectedSellingType, setSelectedSellingType] = useState(null);
  const [selectedTaxType, setSelectedTaxType] = useState(null);
  const [selectedDiscountType, setSelectedDiscountType] = useState(null);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [text, setText] = useState("");
  const [productType, setProductType] = useState("single");
  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [hsnSac, setHsnSac] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [quantityAlert, setQuantityAlert] = useState("");
  const [expiryPeriodMonths, setExpiryPeriodMonths] = useState("");
  const [preferenceSupply, setPreferenceSupply] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");
  const [slugCounter, setSlugCounter] = useState(1);
  const [hasExpiry, setHasExpiry] = useState(false);

  const calculateExpiryDate = (mfgDate, months) => {
    if (!mfgDate || months === "" || months === null || isNaN(months) || parseInt(months, 10) <= 0) {
      return null;
    }
    const d = new Date(mfgDate);
    if (isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + parseInt(months, 10));
    return d;
  };
  const [variants, setVariants] = useState([
    { variation: "color", variantValue: "red", sku: 1234, quantity: 0, price: 50000 },
    { variation: "color", variantValue: "black", sku: 2345, quantity: 0, price: 50000 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [cat, setCat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading2, setLoading2] = useState(true);
  const [error2, setError2] = useState(null);
  const [warehouse, setWarehouse] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [errors, setErrors] = useState({});
  const store = [
    { value: "choose", label: "Choose" },
    { value: "thomas", label: "Thomas" },
    { value: "rasmussen", label: "Rasmussen" },
    { value: "fredJohn", label: "Fred John" },
  ];


  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch(`${baseapi}/api/units`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch units");
        const data = await response.json();
        const activeUnits = (data || []).filter(u => u.status === "active" || u.status === "Active");
        setUnitsList(activeUnits);
      } catch (err) {
        console.error("Failed to load units", err);
      }
    };
    fetchUnits();
  }, []);

  const categoryOptions = [
    { value: "", label: "Choose Category" },
    ...cat.map((c) => ({
      value: c.id,
      label: c.category,
    })),
  ];

  const unitOptions = [
    { value: "", label: "Choose Unit" },
    ...unitsList.map((u) => ({
      value: u.unit,
      label: u.unit,
    })),
  ];

  const warehouseOptions = [
    { value: "", label: "Choose" },
    ...warehouse.map((w) => ({ value: w.id, label: w.name })),
  ];
  const warrenty = [
    { value: "", label: "Choose" },
    { value: "No Warranty", label: "No Warranty" },
    { value: "Replacement Warranty", label: "Replacement Warranty" },
    { value: "On-Site Warranty", label: "On-Site Warranty" },
    { value: "Accidental Protection Plan", label: "Accidental Protection Plan" },
  ];
  const formatDateToYYYYMMDD = (date) => {
    if (!(date instanceof Date)) {
      console.warn("Invalid date provided:", date);
      return "";
    }
    return date.toISOString().split("T")[0];
  };
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${baseapi}/api/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch categories");
        const result = await response.json();
        const categoriesList = result.data || result || [];
        const mappedCategories = categoriesList.map((item) => ({
          id: item.id,
          category: item.name || "Unnamed Category",
        }));
        setCat(mappedCategories);
      } catch (err) {
        console.error("Category fetch error:", err);
        setError(err.message);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseapi}/api/warehouses`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        const warehouseData = Array.isArray(result)
          ? result
          : result.warehouses || [];
        setWarehouse(warehouseData);
        console.log("Fetched warehouses:", warehouseData);
      } catch (err) {
        setError2(err.message);
        setWarehouse([]);
      } finally {
        setLoading2(false);
      }
    };
    fetchData();
  }, []);

  const [suppliers, setSuppliers] = useState([]);
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(`${baseapi}/api/suppliers`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch suppliers");
        const data = await response.json();
        setSuppliers(data || []);
      } catch (err) {
        console.error("Failed to load suppliers", err);
      }
    };
    fetchSuppliers();
  }, []);
  useEffect(() => {
    if (editId && !loading && cat.length > 0 && warehouse.length > 0) {
      const fetchProduct = async () => {
        setLoadingProduct(true);
        try {
          const response = await fetch(`${baseapi}/api/warehouse/products/${editId}`, {
            credentials: "include"
          });
          if (!response.ok) throw new Error(`Failed to fetch product (${response.status})`);
          const productData = await response.json();
          setProductName(productData.productName || "");
          setSku(productData.sku || "");
          setHsnSac(productData.hsnSac || "");
          setPrice(productData.price || "");
          setCost(productData.cost || "");
          setTaxAmount(productData.taxAmount || "");
          setQuantityAlert(productData.quantityAlert != null ? productData.quantityAlert : "");
          setExpiryPeriodMonths(productData.expiryPeriodMonths != null ? productData.expiryPeriodMonths : "");
          setManufacturer(productData.manufacturer || "");
          setPreferenceSupply(productData.preferenceSupply || "");
          setDescription(productData.description || "");
          setSelectedUnit(productData.units || "");
          setDate1(productData.manufacturedDate ? new Date(productData.manufacturedDate) : new Date());
          const expiryDate = productData.expiryOn ? new Date(productData.expiryOn) : null;
          setHasExpiry(!!expiryDate);
          if (expiryDate) setDate2(expiryDate);
          // Category
          const foundCategory = cat.find(c => c.id === productData.category || c.id === productData.categoryId) ||
            cat.find(c => c.category === productData.category);
          setSelectedCategory(foundCategory ? foundCategory.id : null);
          // Warehouse
          const warehouseObj = productData.warehouse;
          if (warehouseObj) {
            setSelectedWarehouse(warehouseObj.id);
          }
          // Warranty
          setSelectedWarranty(productData.warranty || "");
        } catch (err) {
          console.error("Fetch product error:", err);
          toast.error("Failed to load product details");
        } finally {
          setLoadingProduct(false);
        }
      };
      fetchProduct();
    }
  }, [editId, loading, cat, warehouse]);
  const getLabel = (selected, options) => {
    if (!selected) return "";
    if (selected.target) {
      console.warn("Event object detected in selected value, using empty string");
      return "";
    }
    if (typeof selected === "string" || typeof selected === "number") {
      const option = options.find((opt) => opt.value === selected);
      return option ? option.label : selected;
    }
    return selected?.label || "";
  };
  const handleSelectChange = (setter) => (e) => {
    setter(e.value);
  };

  // Clean validation
  const isInvalidSelect = (sel) => {
    return !sel || sel === "" || sel === "choose";
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const missing = [];

    if (!productName) { newErrors.productName = "Product Name is required"; missing.push("Product Name"); }
    if (!sku) { newErrors.sku = "SKU is required"; missing.push("SKU"); }
    if (!hsnSac) { newErrors.hsnSac = "HSN/SAC is required"; missing.push("HSN/SAC"); }
    if (isInvalidSelect(selectedCategory)) { newErrors.category = "Category is required"; missing.push("Category"); }
    if (!selectedUnit) { newErrors.units = "Units is required"; missing.push("Units"); }
    if (!price) { newErrors.price = "Price is required"; missing.push("Price"); }
    if (!cost) { newErrors.cost = "Cost is required"; missing.push("Cost"); }
    if (!taxAmount) { newErrors.taxAmount = "Tax Amount is required"; missing.push("Tax Amount"); }
    if (quantityAlert === "" || quantityAlert === null || isNaN(quantityAlert)) { newErrors.quantityAlert = "Low Stock Threshold is required"; missing.push("Low Stock Threshold"); }

    if (hasExpiry) {
      if (!expiryPeriodMonths || parseInt(expiryPeriodMonths, 10) <= 0) {
        newErrors.expiryPeriodMonths = "Expiry Period (in months) is required";
        missing.push("Expiry Period (in months)");
      }
      if (!date2) { newErrors.expiryDate = "Expiry Date is required"; missing.push("Expiry Date"); }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(`Please fill the following required fields: ${missing.join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    const selectedCategoryObj = cat.find(
      (c) => c.id === selectedCategory
    );

    const payload = {
      productName,
      sku,
      hsnSac,
      category: selectedCategoryObj?.category,
      units: selectedUnit,
      description: description || "",
      quantity: 0,
      price: parseFloat(price),
      cost: parseFloat(cost) || 0,
      taxAmount: parseFloat(taxAmount) || 0,
      quantityAlert: parseInt(quantityAlert, 10) || 0,
      expiryPeriodMonths: hasExpiry ? (parseInt(expiryPeriodMonths, 10) || null) : null,
      warranty: selectedWarranty,
      manufacturer,
      preferenceSupply,
      manufacturedDate: date1 ? date1.toISOString().split("T")[0] : null,
      expiryOn: hasExpiry ? date2.toISOString().split("T")[0] : null
    };

    try {
      const warehouseIdToUse = selectedWarehouse || (warehouse.length > 0 ? warehouse[0].id : "");

      if (!warehouseIdToUse) {
        toast.error("No default warehouse found. Please create a warehouse first in the Inventory settings.");
        setIsSubmitting(false);
        return;
      }

      const url = isEditMode
        ? `${baseapi}/api/warehouse/products/${editId}`
        : `${baseapi}/api/warehouse/products`;

      const response = await fetch(`${url}?warehouseId=${warehouseIdToUse}`, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save product");
      }

      toast.success(`Product ${isEditMode ? "updated" : "added"} successfully!`);
      onSave(); // Refreshes parent list

      if (onClose) onClose();
      if (!isEditMode) resetForm();
      setSubmitSuccess(true);

    } catch (err) {
      console.error("Submit error details:", err);
      toast.error("Failed to save product: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setProductName("");
    setSku("");
    setHsnSac("");
    setSelectedWarehouse(null);
    setSelectedCategory(null);
    setSelectedUnit("");
    setPrice("");
    setCost("");
    setTaxAmount("");
    setQuantityAlert("");
    setExpiryPeriodMonths("");
    setSelectedWarranty(null);
    setManufacturer("");
    setPreferenceSupply("");
    setDate1(new Date());
    setDate2(new Date());
    setHasExpiry(false);
    setDescription("");
    setSelectedStore(null);
    setSelectedSubCategory(null);
    setSelectedBrand(null);
    setSelectedBarcodeSymbol(null);
    setSelectedSellingType(null);
    setSelectedTaxType(null);
    setSelectedDiscountType(null);
    setDiscountValue("");
    setItemCode("");
  };
  if (loading || loading2 || loadingProduct) {
    return <div>Loading...</div>;
  }
  if (error || error2) {
    return <div>Error loading data: {error || error2}</div>;
  }
  return (
    <>
      <style>{customStyles}</style>
      <div className={isEditMode ? "" : "page-wrapper"}>
        <div className={isEditMode ? "" : "content"}>
          {!isEditMode && (
            <div className="page-header d-flex justify-content-between align-items-start flex-wrap mx-5 ">
              <div className="page-title">
                <h4>Create Product</h4>
                <h6>Add a new product to your inventory</h6>
              </div>
              <ul className="table-top-head d-flex list-unstyled mb-0">
                <li>
                  <RefreshIcon />
                </li>
                <li>
                  <CollapesIcon />
                </li>
                <li>
                  <Link
                    to={route.productlist}
                    className="btn btn-secondary d-flex align-items-center"
                  >
                    <i className="feather icon-arrow-left me-2" />
                    Back to Product
                  </Link>
                </li>
              </ul>
            </div>
          )}
          <form className="add-product-form" onSubmit={handleSubmit}>
            <div className="add-product">
              <div className="accordions-items-seperate" id="accordionSpacingExample">
                {/* === PRODUCT INFORMATION === */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingSpacingOne">
                    <div
                      className="accordion-button collapsed bg-white"
                      data-bs-toggle="collapse"
                      data-bs-target="#SpacingOne"
                      aria-expanded="true"
                      aria-controls="SpacingOne"
                    >
                      <h5 className="d-flex align-items-center">
                        <i className="feather icon-info text-primary me-2" />
                        Product Information
                      </h5>
                    </div>
                  </h2>
                  <div
                    id="SpacingOne"
                    className="accordion-collapse collapse show"
                    aria-labelledby="headingSpacingOne"
                  >
                    <div className="accordion-body">
                      <div className="row">
                        {/* Warehouse Field Hidden as per user request */}
                        {/* <div className="col-lg-6 col-12 mb-3">
                           <label className="form-label">
                             Warehouse <span className="text-danger">*</span>
                           </label>
                           <CommonSelect
                             className={`w-100 ${errors.warehouse ? "is-invalid" : ""}`}
                             options={warehouseOptions}
                             value={selectedWarehouse}
                             onChange={handleSelectChange(setSelectedWarehouse)}
                             placeholder="Choose Warehouse"
                           />
                           {errors.warehouse && <div className="text-danger fs-12">{errors.warehouse}</div>}
                         </div> */}

                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Product Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.productName ? "is-invalid" : ""}`}
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Enter product name"
                          />
                          {errors.productName && <div className="text-danger fs-12">{errors.productName}</div>}
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            SKU <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.sku ? "is-invalid" : ""}`}
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="Enter SKU"
                          />
                          {errors.sku && <div className="text-danger fs-12">{errors.sku}</div>}
                        </div>
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            HSN/SAC <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.hsnSac ? "is-invalid" : ""}`}
                            value={hsnSac}
                            onChange={(e) => setHsnSac(e.target.value)}
                            placeholder="Enter HSN/SAC"
                          />
                          {errors.hsnSac && <div className="text-danger fs-12">{errors.hsnSac}</div>}
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Category <span className="text-danger">*</span>
                          </label>
                          <CommonSelect
                            className={`w-100 ${errors.category ? "is-invalid" : ""}`}
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={handleSelectChange(setSelectedCategory)}
                            placeholder="Choose Category"
                            filter={false}
                          />
                          {errors.category && <div className="text-danger fs-12">{errors.category}</div>}
                        </div>
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Units <span className="text-danger">*</span>
                          </label>
                          <CommonSelect
                            className={`w-100 ${errors.units ? "is-invalid" : ""}`}
                            options={unitOptions}
                            value={selectedUnit}
                            onChange={handleSelectChange(setSelectedUnit)}
                            placeholder="Choose Unit"
                            filter={false}
                          />
                          {errors.units && <div className="text-danger fs-12">{errors.units}</div>}
                        </div>
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label">Description</label>
                        <Editor
                          value={description}
                          onTextChange={(e) => setDescription(e.htmlValue)}
                          style={{ height: "200px" }}
                        />
                        <p className="fs-14 mt-1">Maximum 60 Words</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* === PRICING & STOCKS === */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingSpacingTwo">
                    <div
                      className="accordion-button collapsed bg-white"
                      data-bs-toggle="collapse"
                      data-bs-target="#SpacingTwo"
                      aria-expanded="true"
                      aria-controls="SpacingTwo"
                    >
                      <h5 className="d-flex align-items-center">
                        <i className="feather icon-life-buoy text-primary me-2" />
                        Pricing & Stocks
                      </h5>
                    </div>
                  </h2>
                  <div
                    id="SpacingTwo"
                    className="accordion-collapse collapse show"
                    aria-labelledby="headingSpacingTwo"
                  >
                    <div className="accordion-body">
                      <div className="row">
                        {/* Quantity Field Removed */}
                        <div className="col-lg-4 col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Price <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.price ? "is-invalid" : ""}`}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="Enter price"
                          />
                          {errors.price && <div className="text-danger fs-12">{errors.price}</div>}
                        </div>
                        <div className="col-lg-4 col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Cost <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.cost ? "is-invalid" : ""}`}
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="Enter cost"
                          />
                          {errors.cost && <div className="text-danger fs-12">{errors.cost}</div>}
                        </div>
                        <div className="col-lg-4 col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Tax Amount <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.taxAmount ? "is-invalid" : ""}`}
                            value={taxAmount}
                            onChange={(e) => setTaxAmount(e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="Enter tax amount"
                          />
                          {errors.taxAmount && <div className="text-danger fs-12">{errors.taxAmount}</div>}
                        </div>
                        <div className="col-lg-4 col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Low Stock Threshold <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className={`form-control ${errors.quantityAlert ? "is-invalid" : ""}`}
                            value={quantityAlert}
                            onChange={(e) => setQuantityAlert(e.target.value)}
                            min="0"
                            placeholder="Enter low stock threshold"
                          />
                          {errors.quantityAlert && <div className="text-danger fs-12">{errors.quantityAlert}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* === CUSTOM FIELDS === */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingSpacingFour">
                    <div
                      className="accordion-button collapsed bg-white"
                      data-bs-toggle="collapse"
                      data-bs-target="#SpacingFour"
                      aria-expanded="true"
                      aria-controls="SpacingFour"
                    >
                      <h5 className="d-flex align-items-center">
                        <i className="feather icon-list text-primary me-2" />
                        Custom Fields
                      </h5>
                    </div>
                  </h2>
                  <div
                    id="SpacingFour"
                    className="accordion-collapse collapse show"
                    aria-labelledby="headingSpacingFour"
                  >
                    <div className="accordion-body">
                      <div className="row">
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Warranty
                          </label>
                          <CommonSelect
                            className={`w-100 ${errors.warranty ? "is-invalid" : ""}`}
                            options={warrenty}
                            value={selectedWarranty}
                            onChange={handleSelectChange(setSelectedWarranty)}
                            placeholder="Choose"
                            filter={false}
                          />
                          {errors.warranty && <div className="text-danger fs-12">{errors.warranty}</div>}
                        </div>
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Manufacturer
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.manufacturer ? "is-invalid" : ""}`}
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                            placeholder="Enter manufacturer"
                          />
                          {errors.manufacturer && <div className="text-danger fs-12">{errors.manufacturer}</div>}
                        </div>
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Preference Supply
                          </label>
                          <CommonSelect
                            className={`w-100 ${errors.preferenceSupply ? "is-invalid" : ""}`}
                            options={[
                              { value: "", label: "Choose Supplier" },
                              ...suppliers.map((s) => ({
                                value: `${s.firstName} ${s.lastName || ""}`.trim(),
                                label: `${s.firstName} ${s.lastName || ""}`.trim()
                              })),
                            ]}
                            value={preferenceSupply}
                            onChange={handleSelectChange(setPreferenceSupply)}
                            placeholder="Choose Supplier"
                            filter
                          />
                          {errors.preferenceSupply && <div className="text-danger fs-12">{errors.preferenceSupply}</div>}
                        </div>
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Manufactured Date
                          </label>
                          <div className="input-groupicon calender-input">
                            <i className="feather icon-calendar info-img" />
                            <CommonDatePicker
                              value={date1}
                              onChange={(date) => {
                                if (date && date.target) return;
                                setDate1(date);
                                if (hasExpiry && expiryPeriodMonths && date) {
                                  const computed = calculateExpiryDate(date, expiryPeriodMonths);
                                  if (computed) setDate2(computed);
                                }
                              }}
                              className="w-100"
                            />
                          </div>
                        </div>
                        <div className="col-lg-6 col-12 mb-3">
                          <label className="form-label">
                            Does this product have expiry date? <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="hasExpiry"
                                id="hasExpiryYes"
                                checked={hasExpiry === true}
                                onChange={() => setHasExpiry(true)}
                              />
                              <label className="form-check-label" htmlFor="hasExpiryYes">
                                Yes
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="hasExpiry"
                                id="hasExpiryNo"
                                checked={hasExpiry === false}
                                onChange={() => setHasExpiry(false)}
                              />
                              <label className="form-check-label" htmlFor="hasExpiryNo">
                                No
                              </label>
                            </div>
                          </div>
                        </div>
                        {hasExpiry && (
                          <>
                            <div className="col-lg-6 col-12 mb-3">
                              <label className="form-label">
                                Expiry Period (in Months) <span className="text-danger">*</span>
                              </label>
                              <input
                                type="number"
                                className={`form-control ${errors.expiryPeriodMonths ? "is-invalid" : ""}`}
                                value={expiryPeriodMonths}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setExpiryPeriodMonths(val);
                                  if (date1 && val && parseInt(val, 10) > 0) {
                                    const computed = calculateExpiryDate(date1, val);
                                    if (computed) setDate2(computed);
                                  }
                                }}
                                min="1"
                                placeholder="Enter expiry period in months (e.g. 6, 12, 24)"
                              />
                              {errors.expiryPeriodMonths && <div className="text-danger fs-12">{errors.expiryPeriodMonths}</div>}
                            </div>
                            <div className="col-lg-6 col-12 mb-3">
                              <label className="form-label">
                                Calculated Expiry Date <span className="text-danger">*</span>
                              </label>
                              <div className="input-groupicon calender-input">
                                <i className="feather icon-calendar info-img" />
                                <CommonDatePicker
                                  value={date2}
                                  onChange={(date) => {
                                    if (date && date.target) return;
                                    setDate2(date);
                                  }}
                                  className={`w-100 ${errors.expiryDate ? "is-invalid" : ""}`}
                                />
                              </div>
                              {errors.expiryDate && <div className="text-danger fs-12">{errors.expiryDate}</div>}
                            </div>
                          </>
                        )}
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="btn-addproduct mb-4">
                <button
                  type="button"
                  className="btn btn-cancel me-2"
                  onClick={() => {
                    if (onClose) onClose();
                    else resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Save Product"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};
export default AddProduct;
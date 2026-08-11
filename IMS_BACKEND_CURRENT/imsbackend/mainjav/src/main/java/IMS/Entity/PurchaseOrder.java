package IMS.Entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "purchase_order")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    // Removed companyAddress, companyContact, companyGstin as per user request

    private String referencePoNo;
    private String date;

    private String supplierName;
    private String supplierAddress;
    private String supplierGstin;

    private String contactPerson;
    private String paymentTerms;
    private String expectedDelivery;

    private Double freightCharges;

    @Column(length = 1000)
    private String description;

    // Removed status as per user request

    @Column(length = 2000)
    private String termsAndConditions;

    private String warehouseName;

    // Removed orderTax, orderDiscount, paid as per user request
    private Double due;

    // CHILD TABLE: Purchase Items
    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderItem> items;

    // Getters and setters
    private Double orderTax;
    private Double orderDiscount;

    public Double getOrderTax() {
        return orderTax;
    }

    public void setOrderTax(Double orderTax) {
        this.orderTax = orderTax;
    }

    public Double getOrderDiscount() {
        return orderDiscount;
    }

    public void setOrderDiscount(Double orderDiscount) {
        this.orderDiscount = orderDiscount;
    }

    public Double getDue() {
        return due;
    }

    public void setDue(Double due) {
        this.due = due;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    // Removed getCompanyAddress, setCompanyAddress, getCompanyContact,
    // setCompanyContact, getCompanyGstin, setCompanyGstin

    public String getReferencePoNo() {
        return referencePoNo;
    }

    public void setReferencePoNo(String referencePoNo) {
        this.referencePoNo = referencePoNo;
    }

    // ... keep existing getters/setters for other fields ...

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierAddress() {
        return supplierAddress;
    }

    public void setSupplierAddress(String supplierAddress) {
        this.supplierAddress = supplierAddress;
    }

    public String getSupplierGstin() {
        return supplierGstin;
    }

    public void setSupplierGstin(String supplierGstin) {
        this.supplierGstin = supplierGstin;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public String getExpectedDelivery() {
        return expectedDelivery;
    }

    public void setExpectedDelivery(String expectedDelivery) {
        this.expectedDelivery = expectedDelivery;
    }

    public Double getFreightCharges() {
        return freightCharges;
    }

    public void setFreightCharges(Double freightCharges) {
        this.freightCharges = freightCharges;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    // Removed getStatus, setStatus

    public String getTermsAndConditions() {
        return termsAndConditions;
    }

    public void setTermsAndConditions(String termsAndConditions) {
        this.termsAndConditions = termsAndConditions;
    }

    public List<PurchaseOrderItem> getItems() {
        return items;
    }

    public void setItems(List<PurchaseOrderItem> items) {
        this.items = items;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("total")
    public Double getGrandTotal() {
        if (items == null)
            return 0.0;
        double sum = items.stream()
                .filter(i -> i.getTotal() != null)
                .mapToDouble(PurchaseOrderItem::getTotal)
                .sum();
        return sum + (freightCharges != null ? freightCharges : 0.0);
    }
}

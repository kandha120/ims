package IMS.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales_order")
public class AddSalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String soNo;
    private String date;
    private String customer;
    private String email;
    private String phone;
    private String billingAddress;
    private String shippingAddress;
    private String customerGstin;
    private String salesperson;
    private String paymentTerms;
    private String expectedDelivery;
    private Double deliveryCharges;
    private String status;

    @Column(length = 1000)
    private String termsAndConditions;

    // Make fetch EAGER so items are returned when serializing (avoids
    // LazyInitialization during JSON)
    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<SalesOrderItem> items = new ArrayList<>();

    public AddSalesOrder() {
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSoNo() {
        return soNo;
    }

    public void setSoNo(String soNo) {
        this.soNo = soNo;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getCustomer() {
        return customer;
    }

    public void setCustomer(String customer) {
        this.customer = customer;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(String billingAddress) {
        this.billingAddress = billingAddress;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getCustomerGstin() {
        return customerGstin;
    }

    public void setCustomerGstin(String customerGstin) {
        this.customerGstin = customerGstin;
    }

    public String getSalesperson() {
        return salesperson;
    }

    public void setSalesperson(String salesperson) {
        this.salesperson = salesperson;
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

    public Double getDeliveryCharges() {
        return deliveryCharges;
    }

    public void setDeliveryCharges(Double deliveryCharges) {
        this.deliveryCharges = deliveryCharges;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTermsAndConditions() {
        return termsAndConditions;
    }

    public void setTermsAndConditions(String termsAndConditions) {
        this.termsAndConditions = termsAndConditions;
    }

    public List<SalesOrderItem> getItems() {
        return items;
    }

    // Safe setter that sets the back-reference on each child
    public void setItems(List<SalesOrderItem> items) {
        this.items = items != null ? items : new ArrayList<>();
        for (SalesOrderItem it : this.items) {
            it.setSalesOrder(this);
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("grand_total")
    public Double getGrandTotal() {
        double sum = items.stream()
                .filter(i -> i.getTotal() != null)
                .mapToDouble(SalesOrderItem::getTotal)
                .sum();
        return sum + (deliveryCharges != null ? deliveryCharges : 0.0);
    }

    @com.fasterxml.jackson.annotation.JsonProperty("customer_name")
    public String getCustomerName() {
        return customer;
    }
}

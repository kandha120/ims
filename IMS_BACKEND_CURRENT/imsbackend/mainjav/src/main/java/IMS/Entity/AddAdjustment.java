package IMS.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "add_adjustment")
public class AddAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String productName;

    private String warehouse;

    private String referenceNumber;

    private Integer quantity;

    private String responsiblePerson;

    @Column(length = 500)
    private String notes;

    public AddAdjustment() {
    }

    public AddAdjustment(String productName, String warehouse, String referenceNumber,
            Integer quantity, String responsiblePerson, String notes) {
        this.productName = productName;
        this.warehouse = warehouse;
        this.referenceNumber = referenceNumber;
        this.quantity = quantity;
        this.responsiblePerson = responsiblePerson;
        this.notes = notes;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(String warehouse) {
        this.warehouse = warehouse;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getResponsiblePerson() {
        return responsiblePerson;
    }

    public void setResponsiblePerson(String responsiblePerson) {
        this.responsiblePerson = responsiblePerson;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}

package IMS.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "add_transfer")
public class AddTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String warehouseFrom;

    private String warehouseTo;

    private String referenceNumber;

    private String productName;

    private Integer quantity;

    @Column(length = 500)
    private String notes;

    public AddTransfer() {}

    public AddTransfer(String warehouseFrom, String warehouseTo, String referenceNumber,
                       String productName, Integer quantity, String notes) {
        this.warehouseFrom = warehouseFrom;
        this.warehouseTo = warehouseTo;
        this.referenceNumber = referenceNumber;
        this.productName = productName;
        this.quantity = quantity;
        this.notes = notes;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWarehouseFrom() { return warehouseFrom; }
    public void setWarehouseFrom(String warehouseFrom) { this.warehouseFrom = warehouseFrom; }

    public String getWarehouseTo() { return warehouseTo; }
    public void setWarehouseTo(String warehouseTo) { this.warehouseTo = warehouseTo; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}


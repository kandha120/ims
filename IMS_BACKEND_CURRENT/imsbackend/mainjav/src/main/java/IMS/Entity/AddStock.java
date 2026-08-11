package IMS.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "add_stock")
public class AddStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String warehouse;
    private String responsiblePerson;
    private String productName;

    // Current quantity
    private Integer quantity;
    private Integer quantityAlert;

    public AddStock() {
    }

    public AddStock(String warehouse,
            String responsiblePerson,
            String productName,
            Integer quantity) {
        this.warehouse = warehouse;
        this.responsiblePerson = responsiblePerson;
        this.productName = productName;
        this.quantity = quantity;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(String warehouse) {
        this.warehouse = warehouse;
    }

    public String getResponsiblePerson() {
        return responsiblePerson;
    }

    public void setResponsiblePerson(String responsiblePerson) {
        this.responsiblePerson = responsiblePerson;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getQuantityAlert() {
        return quantityAlert;
    }

    public void setQuantityAlert(Integer quantityAlert) {
        this.quantityAlert = quantityAlert;
    }
}

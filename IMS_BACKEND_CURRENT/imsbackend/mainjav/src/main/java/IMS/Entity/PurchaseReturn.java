package IMS.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "purchase_returns")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String supplierName;

    private LocalDate date;

    private String reference;

    private String product;

    private Integer quantity;

    private Double cost;

    private Double orderTax;

    private Double discount;

    private String shipping;

    private String status;

    private String description;

    @Column(name = "warehouse_name")
    private String warehouseName;
}

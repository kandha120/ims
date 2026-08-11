package IMS.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "purchases")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String supplierName;

    @Column(name = "warehouse_name")
    private String warehouseName;

    private String reference;

    private LocalDate date;

    private String productSku;

    private Integer quantity;

    private Double cost;

    private Double discount;

    private Double tax;

    private Double orderTax;

    private Double orderDiscount;

    private String shippingStatus;

    private String description;

    private Double paid;
    private Double due;

    @Column(name = "grand_total")
    private Double grandTotal;
}

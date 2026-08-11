package IMS.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "warehouse_products", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "product_name", "warehouse_id" })
})
@Data
@AllArgsConstructor
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Product {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "product_name", nullable = false)
        private String productName;

        @Column(nullable = false)
        private String sku;

        @Column(name = "hsn_sac", nullable = false)
        private String hsnSac;

        @Column(nullable = false)
        private String category;

        private String units;

        @Column(columnDefinition = "TEXT")
        private String description;

        private Integer quantity;

        @Column(nullable = false)
        private Double price;

        private Double cost;

        private Double taxAmount;

        @Column(nullable = false)
        private Integer quantityAlert;

        private String warranty;
        private String manufacturer;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "warehouse_id", nullable = false)
        private Warehouse warehouse;

        @Column(name = "warehouse")
        private String warehouseName;

        @Column(name = "preference_supply")
        private String preferenceSupply;

        private LocalDate manufacturedDate;
        private LocalDate expiryOn;
}

package IMS.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "warehouses")
@Data
@AllArgsConstructor
@NoArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String contactPerson;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String phone;
    private String address;
    private String city;
    private String state;
    private String country;

    @Column(name = "postal_code")
    private String postalCode;

    private String status;
}

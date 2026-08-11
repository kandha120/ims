package IMS.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class Person {
    @Entity
    @Table(name = "users")
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public class User {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;
        private String email;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "warehouse_id", nullable = false)
        private Warehouse warehouse;

    }

}

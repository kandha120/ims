package IMS.Repos;

import IMS.Entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    boolean existsByName(String name);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Warehouse findByName(String name);
}

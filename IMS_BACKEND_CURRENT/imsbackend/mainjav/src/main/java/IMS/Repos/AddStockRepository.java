package IMS.Repos;

import IMS.Entity.AddStock;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddStockRepository extends JpaRepository<AddStock, Long> {

    /**
     * Find existing stock row for a given warehouse and productName.
     */
    Optional<AddStock> findFirstByWarehouseAndProductName(String warehouse, String productName);

    /**
     * All low-stock products where quantity <= threshold,
     * ordered by quantity ASC (lowest first),
     * limited by Pageable (we’ll always use page = 0, size = limit).
     */
    List<AddStock> findByQuantityLessThanEqualOrderByQuantityAsc(Integer quantity, Pageable pageable);

    // Find all stock entries for a specific warehouse (string name)
    List<AddStock> findByWarehouse(String warehouse);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(a.quantity) FROM AddStock a WHERE a.productName = :productName")
    Integer sumQuantityByProductName(
            @org.springframework.data.repository.query.Param("productName") String productName);
}

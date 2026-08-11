package IMS.Repos;

import IMS.Entity.Product;
import IMS.Entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

      Optional<Product> findFirstBySku(String sku);

      // ---------------- DUPLICATE CHECK ----------------
      boolean existsByProductNameAndWarehouse(
                  String productName,
                  Warehouse warehouse);

      boolean existsByProductNameAndWarehouseAndIdNot(
                  String productName,
                  Warehouse warehouse,
                  Long id);

      // ---------------- PRODUCT NAMES ----------------
      @Query("SELECT p.productName FROM Product p ORDER BY p.productName")
      List<String> findAllProductNames();

      List<Product> findByProductName(String productName);

      // ---------------- LIST ALL ----------------
      List<Product> findByWarehouseId(Long warehouseId);

      List<Product> findByWarehouse_Name(String warehouseName);

      Optional<Product> findByProductNameAndWarehouse_Name(String productName, String warehouseName);

      // ---------------- LOW STOCK ----------------
      @Query("SELECT p FROM Product p WHERE p.quantity <= p.quantityAlert")
      List<Product> findLowStockProducts();

      // ---------------- TOP SELLING PRODUCTS ----------------
      @Query(value = """
                  SELECT
                        wp.product_name AS product_name,
                        wp.price AS price,
                        wp.quantity AS quantity,
                        SUM(soi.quantity) AS estimated_sold,
                        (wp.price * SUM(soi.quantity)) AS total_value
                  FROM sales_order_item soi
                  JOIN warehouse_products wp ON wp.product_name = soi.product_name
                  GROUP BY wp.product_name, wp.price, wp.quantity
                  ORDER BY estimated_sold DESC
                  LIMIT :limit
                  """, nativeQuery = true)
      List<Map<String, Object>> findTopSellingProducts(
                  @Param("limit") int limit);
}

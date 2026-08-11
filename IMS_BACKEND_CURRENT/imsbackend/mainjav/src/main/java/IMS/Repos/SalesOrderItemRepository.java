package IMS.Repos;

import IMS.Entity.SalesOrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {

    /**
     * Recent sales, ordered by parent salesOrder.date DESC,
     * but ONLY first N rows as defined by Pageable (we will pass page=0,size=limit).
     *
     * We return List (NOT Page).
     */
    @Query("SELECT i FROM SalesOrderItem i JOIN FETCH i.salesOrder so ORDER BY so.date DESC")
    List<SalesOrderItem> findAllOrderByOrderDateDesc(Pageable pageable);

    /**
     * Native query to get top-selling products aggregated by productName.
     *
     * Returns rows: [ productName, totalQty, totalAmount ]
     */
    @Query(value = """
        SELECT
          i.product_name AS productName,
          SUM(COALESCE(i.quantity,0)) AS totalQty,
          SUM(COALESCE(i.total,0)) AS totalAmount
        FROM sales_order_item i
        GROUP BY i.product_name
        ORDER BY totalQty DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopSellingProducts(@Param("limit") int limit);
}

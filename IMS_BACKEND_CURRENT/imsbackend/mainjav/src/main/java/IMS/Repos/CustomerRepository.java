package IMS.Repos;

import IMS.Entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    @org.springframework.data.jpa.repository.Query(value = """
            SELECT so.customer AS customer,
                   so.email AS email,
                   COUNT(DISTINCT so.id) AS total_orders,
                   SUM(soi.total) AS total_spent
            FROM sales_order so
            LEFT JOIN sales_order_item soi ON so.id = soi.sales_order_id
            GROUP BY so.email, so.customer
            ORDER BY total_spent DESC
            LIMIT :limit
            """, nativeQuery = true)
    java.util.List<java.util.Map<String, Object>> findTopCustomers(
            @org.springframework.data.repository.query.Param("limit") int limit);
}

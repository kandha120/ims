package IMS.Repos;

import IMS.Entity.AddSalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddSalesOrderRepository extends JpaRepository<AddSalesOrder, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT so FROM AddSalesOrder so ORDER BY so.date DESC")
    java.util.List<AddSalesOrder> findRecentOrders(org.springframework.data.domain.Pageable pageable);
}

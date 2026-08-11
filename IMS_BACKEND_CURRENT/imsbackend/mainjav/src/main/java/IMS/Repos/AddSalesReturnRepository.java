package IMS.Repos;

import IMS.Entity.AddSalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddSalesReturnRepository extends JpaRepository<AddSalesReturn, Long> {
}

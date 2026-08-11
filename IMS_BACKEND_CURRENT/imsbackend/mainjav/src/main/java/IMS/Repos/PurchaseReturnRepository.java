package IMS.Repos;



import IMS.Entity.PurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {
}

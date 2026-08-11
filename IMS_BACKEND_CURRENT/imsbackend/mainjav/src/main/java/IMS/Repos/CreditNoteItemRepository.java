package IMS.Repos;


import IMS.Entity.CreditNoteItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditNoteItemRepository extends JpaRepository<CreditNoteItem, Long> {
}

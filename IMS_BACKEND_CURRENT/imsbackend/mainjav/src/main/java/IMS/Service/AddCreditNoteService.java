package IMS.Service;

import IMS.Entity.AddCreditNote;
import IMS.Entity.CreditNoteItem;
import IMS.Repos.AddCreditNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AddCreditNoteService {

    private final AddCreditNoteRepository repository;
    private final IMS.Repos.ProductRepository productRepository;

    public AddCreditNoteService(AddCreditNoteRepository repository, IMS.Repos.ProductRepository productRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
    }

    // CREATE
    @Transactional
    public AddCreditNote saveCreditNote(AddCreditNote creditNote) {
        try {
            if (creditNote.getItems() != null) {
                for (CreditNoteItem item : creditNote.getItems()) {
                    item.setCreditNote(creditNote);

                    // Stock Update Logic
                    if (item.getProductId() != null) {
                        IMS.Entity.Product product = productRepository.findById(item.getProductId()).orElse(null);
                        if (product != null) {
                            int currentQty = product.getQuantity() != null ? product.getQuantity() : 0;
                            int returnQty = item.getQty() != null ? item.getQty() : 0;
                            product.setQuantity(currentQty + returnQty);
                            productRepository.save(product);
                        }
                    }
                }
            }
            return repository.save(creditNote);
        } catch (Exception e) {
            throw new RuntimeException("Error saving credit note: " + e.getMessage(), e);
        }
    }

    // READ ALL
    @Transactional(readOnly = true)
    public List<AddCreditNote> getAllCreditNotes() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching credit notes: " + e.getMessage(), e);
        }
    }

    // READ ONE
    @Transactional(readOnly = true)
    public AddCreditNote getCreditNoteById(Long id) {
        try {
            return repository.findById(id).orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching credit note: " + e.getMessage(), e);
        }
    }

    // UPDATE
    @Transactional
    public AddCreditNote updateCreditNote(Long id, AddCreditNote updated) {
        try {
            AddCreditNote existing = repository.findById(id).orElse(null);
            if (existing == null) {
                return null;
            }

            existing.setCreditNoteNumber(updated.getCreditNoteNumber());
            existing.setDate(updated.getDate());
            existing.setCustomer(updated.getCustomer());
            existing.setOriginalPoNumber(updated.getOriginalPoNumber());
            existing.setOriginalInvoiceDate(updated.getOriginalInvoiceDate());
            existing.setReasonForIssue(updated.getReasonForIssue());
            existing.setTotalAmount(updated.getTotalAmount());
            existing.setGst(updated.getGst());
            existing.setTotalCredit(updated.getTotalCredit());
            existing.setAuthorisedSignatory(updated.getAuthorisedSignatory());
            existing.setStatus(updated.getStatus());
            existing.setRemarks(updated.getRemarks());

            // items
            List<CreditNoteItem> existingItems = existing.getItems();
            if (existingItems == null) {
                existingItems = new ArrayList<>();
                existing.setItems(existingItems);
            } else {
                existingItems.clear();
            }

            if (updated.getItems() != null) {
                for (CreditNoteItem item : updated.getItems()) {
                    item.setCreditNote(existing);
                    existingItems.add(item);
                }
            }

            return repository.save(existing);

        } catch (Exception e) {
            throw new RuntimeException("Error updating credit note: " + e.getMessage(), e);
        }
    }

    // DELETE
    @Transactional
    public String deleteCreditNote(Long id) {
        try {
            if (!repository.existsById(id)) {
                throw new RuntimeException("Credit note not found with id: " + id);
            }
            repository.deleteById(id);
            return "Credit note deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Error deleting credit note: " + e.getMessage(), e);
        }
    }
}

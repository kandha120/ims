package IMS.Service;

import IMS.Entity.AddDebitNote;
import IMS.Entity.DebitNoteItem;
import IMS.Repos.AddDebitNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AddDebitNoteService {

    @Autowired
    private AddDebitNoteRepository repository;

    // CREATE
    public AddDebitNote saveDebitNote(AddDebitNote debitNote) {
        try {
            if (debitNote.getItems() != null) {
                for (DebitNoteItem item : debitNote.getItems()) {
                    item.setDebitNote(debitNote);
                }
            }
            return repository.save(debitNote);
        } catch (Exception e) {
            throw new RuntimeException("Error saving debit note: " + e.getMessage());
        }
    }

    // READ ALL
    public List<AddDebitNote> getAllDebitNotes() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching debit notes: " + e.getMessage());
        }
    }

    // READ ONE
    public AddDebitNote getDebitNoteById(Long id) {
        try {
            return repository.findById(id).orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error getting debit note: " + e.getMessage());
        }
    }

    // UPDATE
    public AddDebitNote updateDebitNote(Long id, AddDebitNote updated) {
        try {
            AddDebitNote existing = repository.findById(id).orElse(null);
            if (existing == null) return null;

            existing.setDebitNoteNumber(updated.getDebitNoteNumber());
            existing.setDate(updated.getDate());
            existing.setOriginalPoNumber(updated.getOriginalPoNumber());
            existing.setOriginalInvoiceDate(updated.getOriginalInvoiceDate());
            existing.setSupplierName(updated.getSupplierName());
            existing.setReasonForIssue(updated.getReasonForIssue());
            existing.setTotalAmount(updated.getTotalAmount());
            existing.setGst(updated.getGst());
            existing.setTotalCredit(updated.getTotalCredit());
            existing.setAuthorisedSignatory(updated.getAuthorisedSignatory());
            existing.setRemarks(updated.getRemarks());

            // replace items
            existing.getItems().clear();
            if (updated.getItems() != null) {
                for (DebitNoteItem item : updated.getItems()) {
                    item.setDebitNote(existing);
                    existing.getItems().add(item);
                }
            }

            return repository.save(existing);

        } catch (Exception e) {
            throw new RuntimeException("Error updating debit note: " + e.getMessage());
        }
    }

    // DELETE
    public String deleteDebitNote(Long id) {
        try {
            repository.deleteById(id);
            return "Debit Note deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Error deleting debit note: " + e.getMessage());
        }
    }
}

package IMS.Service;

import IMS.Entity.AddTransfer;
import IMS.Repos.AddTransferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AddTransferService {

    @Autowired
    private AddTransferRepository repository;

    @Autowired
    private AddStockService stockService;

    public AddTransfer saveTransfer(AddTransfer transfer) {
        try {
            // Perform the stock movement (Decrement Source, Increment Destination)
            stockService.transferStock(
                    transfer.getWarehouseFrom(),
                    transfer.getWarehouseTo(),
                    transfer.getProductName(),
                    transfer.getQuantity());

            // If successful, save the transfer record
            return repository.save(transfer);
        } catch (Exception e) {
            throw new RuntimeException("Error saving transfer: " + e.getMessage());
        }
    }

    public List<AddTransfer> getAllTransfers() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching transfers: " + e.getMessage());
        }
    }

    public AddTransfer getTransferById(Long id) {
        try {
            Optional<AddTransfer> transfer = repository.findById(id);
            return transfer.orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching transfer by ID: " + e.getMessage());
        }
    }

    public AddTransfer updateTransfer(Long id, AddTransfer updated) {
        try {
            AddTransfer existing = repository.findById(id).orElse(null);
            if (existing == null)
                return null;

            existing.setWarehouseFrom(updated.getWarehouseFrom());
            existing.setWarehouseTo(updated.getWarehouseTo());
            existing.setReferenceNumber(updated.getReferenceNumber());
            existing.setProductName(updated.getProductName());
            existing.setQuantity(updated.getQuantity());
            existing.setNotes(updated.getNotes());

            return repository.save(existing);
        } catch (Exception e) {
            throw new RuntimeException("Error updating transfer: " + e.getMessage());
        }
    }

    public String deleteTransfer(Long id) {
        try {
            repository.deleteById(id);
            return "Transfer deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Error deleting transfer: " + e.getMessage());
        }
    }
}

package IMS.Service;

import IMS.Entity.AddAdjustment;
import IMS.Entity.Product;
import IMS.Repos.AddAdjustmentRepository;
import IMS.Repos.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AddAdjustmentService {

    @Autowired
    private AddAdjustmentRepository repository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public AddAdjustment saveAdjustment(AddAdjustment adjustment) {
        try {
            updateProductStock(adjustment.getProductName(), adjustment.getWarehouse(), adjustment.getQuantity(),
                    null);
            return repository.save(adjustment);
        } catch (Exception e) {
            throw new RuntimeException("Error saving adjustment: " + e.getMessage());
        }
    }

    public List<AddAdjustment> getAllAdjustments() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching adjustments: " + e.getMessage());
        }
    }

    public AddAdjustment getAdjustmentById(Long id) {
        try {
            Optional<AddAdjustment> adjustment = repository.findById(id);
            return adjustment.orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching adjustment by id: " + e.getMessage());
        }
    }

    @Transactional
    public AddAdjustment updateAdjustment(Long id, AddAdjustment adj) {
        try {
            AddAdjustment existing = repository.findById(id).orElse(null);
            if (existing == null)
                return null;

            // Revert old quantity
            updateProductStock(existing.getProductName(), existing.getWarehouse(), -existing.getQuantity(), null);

            existing.setProductName(adj.getProductName());
            existing.setWarehouse(adj.getWarehouse());
            existing.setReferenceNumber(adj.getReferenceNumber());
            existing.setQuantity(adj.getQuantity());
            existing.setResponsiblePerson(adj.getResponsiblePerson());
            existing.setNotes(adj.getNotes());

            // Apply new quantity
            updateProductStock(existing.getProductName(), existing.getWarehouse(), existing.getQuantity(),
                    null);

            return repository.save(existing);
        } catch (Exception e) {
            throw new RuntimeException("Error updating adjustment: " + e.getMessage());
        }
    }

    @Transactional
    public String deleteAdjustment(Long id) {
        try {
            Optional<AddAdjustment> adjOpt = repository.findById(id);
            if (adjOpt.isPresent()) {
                AddAdjustment adj = adjOpt.get();
                // Revert quantity (subtract what was added)
                updateProductStock(adj.getProductName(), adj.getWarehouse(), -adj.getQuantity(), null);
            }
            repository.deleteById(id);
            return "Adjustment deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Error deleting adjustment: " + e.getMessage());
        }
    }

    private void updateProductStock(String productName, String warehouseName, int quantityChange, Integer newAlert) {
        Optional<Product> productOpt = productRepository.findByProductNameAndWarehouse_Name(productName, warehouseName);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            int newQuantity = product.getQuantity() + quantityChange;
            // Ensure quantity doesn't go below 0
            if (newQuantity < 0)
                newQuantity = 0;
            product.setQuantity(newQuantity);

            if (newAlert != null) {
                product.setQuantityAlert(newAlert);
            }

            productRepository.save(product);
        } else {
            // Log warning or throw error? For now, silent fail or basic log print
            System.out.println("Warning: Product not found for stock update: " + productName + " in " + warehouseName);
        }
    }
}

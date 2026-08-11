package IMS.Service;

import IMS.Entity.AddStock;
import IMS.Repos.AddStockRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AddStockService {

    // ... repositories ...

    // TRANSFER LOGIC
    @Transactional
    public void transferStock(String fromWarehouse, String toWarehouse, String productName, int quantity) {
        if (quantity <= 0)
            throw new IllegalArgumentException("Transfer quantity must be positive");
        if (fromWarehouse.equals(toWarehouse))
            throw new IllegalArgumentException("Cannot transfer to same warehouse");

        // 1. Handle Source (Decrement)
        Optional<AddStock> sourceOpt = repository.findFirstByWarehouseAndProductName(fromWarehouse, productName);
        if (sourceOpt.isEmpty()) {
            throw new IllegalArgumentException(
                    "Source stock not found for product: " + productName + " in " + fromWarehouse);
        }
        AddStock source = sourceOpt.get();
        if (source.getQuantity() < quantity) {
            throw new IllegalArgumentException(
                    "Insufficient stock in source warehouse. Available: " + source.getQuantity());
        }

        source.setQuantity(source.getQuantity() - quantity);
        repository.save(source);
        updateProductQuantity(fromWarehouse, productName, -quantity, null);

        // 2. Handle Destination (Increment)
        Optional<AddStock> destOpt = repository.findFirstByWarehouseAndProductName(toWarehouse, productName);
        AddStock dest;
        if (destOpt.isPresent()) {
            dest = destOpt.get();
            dest.setQuantity((dest.getQuantity() != null ? dest.getQuantity() : 0) + quantity);
            repository.save(dest);
        } else {
            // Clone source attributes for new entry
            dest = new AddStock();
            dest.setWarehouse(toWarehouse);
            dest.setProductName(productName);
            dest.setQuantity(quantity);
            dest.setResponsiblePerson(source.getResponsiblePerson());
            dest.setQuantityAlert(source.getQuantityAlert());
            // dest.setReferenceNumber(source.getReferenceNumber()); // Optional
            repository.save(dest);
        }
        updateProductQuantity(toWarehouse, productName, quantity, null);
    }

    private final AddStockRepository repository;
    private final IMS.Repos.ProductRepository productRepository;
    private final IMS.Repos.WarehouseRepository warehouseRepository;

    public AddStockService(AddStockRepository repository, IMS.Repos.ProductRepository productRepository,
            IMS.Repos.WarehouseRepository warehouseRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    /**
     * Add stock to inventory.
     *
     * Behavior:
     * - Match ONLY using warehouse + productName
     * - If match exists → increase quantity
     * - Else → create new stock
     */
    @Transactional
    public AddStock saveStock(AddStock stock) {
        if (stock == null)
            throw new IllegalArgumentException("Stock cannot be null");

        // Normalize fields
        String warehouse = stock.getWarehouse() == null ? "" : stock.getWarehouse().trim();
        String productName = stock.getProductName() == null ? "" : stock.getProductName().trim();
        int incomingQty = stock.getQuantity() == null ? 0 : stock.getQuantity();

        // 1. Update Global Product Quantity
        updateProductQuantity(warehouse, productName, incomingQty, stock.getQuantityAlert());

        // 2. Manage AddStock Entry
        // Find existing stock by warehouse + product name
        Optional<AddStock> existingOpt = repository.findFirstByWarehouseAndProductName(warehouse, productName);

        if (existingOpt.isPresent()) {
            AddStock existing = existingOpt.get();

            int oldQty = existing.getQuantity() == null ? 0 : existing.getQuantity();
            int newQty = oldQty + incomingQty;
            existing.setQuantity(newQty);

            // update responsible person if provided
            if (stock.getResponsiblePerson() != null) {
                existing.setResponsiblePerson(stock.getResponsiblePerson());
            }

            if (stock.getQuantityAlert() != null) {
                existing.setQuantityAlert(stock.getQuantityAlert());
            }

            return repository.save(existing);
        } else {
            // New row
            if (stock.getQuantity() == null)
                stock.setQuantity(incomingQty);

            stock.setWarehouse(warehouse);
            stock.setProductName(productName);
            stock.setQuantityAlert(stock.getQuantityAlert());

            return repository.save(stock);
        }
    }

    // READ ALL
    @Transactional(readOnly = true)
    public List<AddStock> getAllStock() {
        return repository.findAll();
    }

    // READ ONE
    @Transactional(readOnly = true)
    public AddStock getStockById(Long id) {
        return repository.findById(id).orElse(null);
    }

    // UPDATE (sku + reorderLevel removed)
    @Transactional
    public AddStock updateStock(Long id, AddStock updated) {
        AddStock existing = repository.findById(id).orElse(null);
        if (existing == null)
            return null;

        // Capture old values
        String oldWarehouse = existing.getWarehouse();
        String oldProductName = existing.getProductName();
        int oldQuantity = existing.getQuantity() == null ? 0 : existing.getQuantity();

        // New values
        String newWarehouse = updated.getWarehouse() == null ? "" : updated.getWarehouse().trim();
        String newProductName = updated.getProductName() == null ? "" : updated.getProductName().trim();
        int newQuantity = updated.getQuantity() == null ? 0 : updated.getQuantity();

        // 1. Revert old quantity from old product
        updateProductQuantity(oldWarehouse, oldProductName, -oldQuantity, null);

        // 2. Add new quantity to new product
        updateProductQuantity(newWarehouse, newProductName, newQuantity, updated.getQuantityAlert());

        // 3. Update AddStock entry
        existing.setWarehouse(newWarehouse);
        existing.setResponsiblePerson(updated.getResponsiblePerson());
        existing.setProductName(newProductName);
        existing.setQuantity(newQuantity);
        existing.setQuantityAlert(updated.getQuantityAlert());

        return repository.save(existing);
    }

    // DELETE
    @Transactional
    public String deleteStock(Long id) {
        AddStock existing = repository.findById(id).orElse(null);
        if (existing != null) {
            // Revert quantity from product
            String warehouse = existing.getWarehouse();
            String productName = existing.getProductName();
            int quantity = existing.getQuantity() == null ? 0 : existing.getQuantity();
            updateProductQuantity(warehouse, productName, -quantity, null);

            repository.deleteById(id);
            return "Stock deleted and product quantity adjusted";
        }
        return "Stock not found";
    }

    /**
     * LOW STOCK LIST
     */
    @Transactional(readOnly = true)
    public List<AddStock> getLowStock(int threshold, int limit) {
        if (limit <= 0)
            limit = 10;

        Pageable pageable = PageRequest.of(0, limit);
        return repository.findByQuantityLessThanEqualOrderByQuantityAsc(threshold, pageable);
    }

    // LIST BY WAREHOUSE
    @Transactional(readOnly = true)
    public List<AddStock> getStocksByWarehouse(String warehouse) {
        return repository.findByWarehouse(warehouse);
    }

    // Helper to update Product entity
    private void updateProductQuantity(String warehouseName, String productName, int deltaQty, Integer newAlert) {
        if (warehouseName == null || warehouseName.isEmpty() || productName == null || productName.isEmpty()
                || deltaQty == 0) {
            return;
        }

        Optional<IMS.Entity.Product> productOpt = productRepository.findByProductNameAndWarehouse_Name(productName,
                warehouseName);
        if (productOpt.isPresent()) {
            IMS.Entity.Product product = productOpt.get();
            int currentQty = product.getQuantity() == null ? 0 : product.getQuantity();
            int finalQty = currentQty + deltaQty;
            if (finalQty < 0)
                finalQty = 0; // Prevent negative stock? Or allow? Assuming 0 floor for now.
            product.setQuantity(finalQty);

            if (newAlert != null) {
                product.setQuantityAlert(newAlert);
            }

            productRepository.save(product);
        } else {
            // Product not found in this warehouse. Try to clone from another warehouse.
            List<IMS.Entity.Product> templates = productRepository.findByProductName(productName);
            if (!templates.isEmpty()) {
                IMS.Entity.Product template = templates.get(0); // Use the first found as template

                // Find target warehouse
                IMS.Entity.Warehouse targetWarehouse = warehouseRepository.findByName(warehouseName);
                if (targetWarehouse == null) {
                    throw new IllegalArgumentException("Warehouse '" + warehouseName + "' not found.");
                }

                // Clone product
                IMS.Entity.Product newProduct = new IMS.Entity.Product();
                newProduct.setProductName(template.getProductName());
                newProduct.setSku(template.getSku()); // Keep same SKU? Or generate unique? Assuming same SKU for same
                                                      // product across warehouses.
                newProduct.setHsnSac(template.getHsnSac());
                newProduct.setCategory(template.getCategory());
                newProduct.setUnits(template.getUnits());
                newProduct.setDescription(template.getDescription());
                newProduct.setPrice(template.getPrice());
                newProduct.setCost(template.getCost());
                newProduct.setTaxAmount(template.getTaxAmount());
                newProduct.setWarranty(template.getWarranty());
                newProduct.setManufacturer(template.getManufacturer());
                newProduct.setPreferenceSupply(template.getPreferenceSupply());
                newProduct.setManufacturedDate(template.getManufacturedDate());
                newProduct.setExpiryOn(template.getExpiryOn());

                newProduct.setWarehouse(targetWarehouse);
                newProduct.setQuantity(Math.max(0, deltaQty)); // Set initial quantity
                newProduct.setQuantityAlert(newAlert != null ? newAlert : template.getQuantityAlert());

                productRepository.save(newProduct);
                System.out.println("Auto-created product '" + productName + "' in warehouse '" + warehouseName + "'");

            } else {
                throw new IllegalArgumentException("Product '" + productName + "' not found in Warehouse '"
                        + warehouseName + "' and no template found to clone from.");
            }
        }
    }
}

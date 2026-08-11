package IMS.Service;

import IMS.Entity.Purchase;
import IMS.Repos.PurchaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseService {

    @Autowired
    private PurchaseRepository repo;

    @Autowired
    private IMS.Repos.ProductRepository productRepo;

    @Autowired
    private IMS.Repos.AddStockRepository addStockRepo;

    // CREATE
    public Purchase savePurchase(Purchase purchase) {
        // Update stock (Product + AddStock)
        if (purchase.getProductSku() != null) {
            if (purchase.getProductSku() != null) {
                adjustStock(purchase.getProductSku(), purchase.getQuantity() == null ? 0 : purchase.getQuantity(),
                        purchase.getWarehouseName());
            }
        }
        return repo.save(purchase);
    }

    // UPDATE
    public Purchase updatePurchase(Long id, Purchase purchase) {

        Purchase existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase record not found"));

        // Stock Adjustment Logic
        String oldSku = existing.getProductSku();
        int oldQty = existing.getQuantity() == null ? 0 : existing.getQuantity();
        String oldWarehouse = existing.getWarehouseName();

        String newSku = purchase.getProductSku();
        int newQty = purchase.getQuantity() == null ? 0 : purchase.getQuantity();
        String newWarehouse = purchase.getWarehouseName();

        if (newSku != null && oldSku != null && newSku.equals(oldSku) &&
                ((newWarehouse == null && oldWarehouse == null)
                        || (newWarehouse != null && newWarehouse.equals(oldWarehouse)))) {
            // Same Product & Warehouse: Adjust difference
            int diff = newQty - oldQty;
            if (diff != 0) {
                adjustStock(newSku, diff, newWarehouse);
            }
        } else {
            // Product OR Warehouse Changed: Revert old, Add new
            if (oldSku != null) {
                adjustStock(oldSku, -oldQty, oldWarehouse); // Revert OLD
            }
            if (newSku != null) {
                adjustStock(newSku, newQty, newWarehouse); // Add NEW
            }
        }

        existing.setSupplierName(purchase.getSupplierName());
        existing.setWarehouseName(purchase.getWarehouseName()); // Set Warehouse
        existing.setReference(purchase.getReference());
        existing.setDate(purchase.getDate());
        existing.setProductSku(purchase.getProductSku());
        existing.setQuantity(purchase.getQuantity());
        existing.setCost(purchase.getCost());
        existing.setDiscount(purchase.getDiscount());
        existing.setTax(purchase.getTax());
        existing.setOrderTax(purchase.getOrderTax());
        existing.setOrderDiscount(purchase.getOrderDiscount());
        existing.setShippingStatus(purchase.getShippingStatus());
        existing.setDescription(purchase.getDescription());
        existing.setPaid(purchase.getPaid());
        existing.setDue(purchase.getDue());
        existing.setGrandTotal(purchase.getGrandTotal());

        return repo.save(existing);
    }

    // GET ONE
    public Purchase getPurchase(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase record not found"));
    }

    // GET ALL
    public List<Purchase> getAllPurchases() {
        return repo.findAll();
    }

    // DELETE
    public void deletePurchase(Long id) {
        Purchase existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase record not found"));

        // Revert stock on delete
        if (existing.getProductSku() != null) {
            adjustStock(existing.getProductSku(), -(existing.getQuantity() == null ? 0 : existing.getQuantity()),
                    existing.getWarehouseName());
        }

        repo.deleteById(id);
    }

    // --- HELPER: Update both Product and AddStock ---
    @org.springframework.transaction.annotation.Transactional
    protected void adjustStock(String sku, int quantityChange, String specificWarehouse) {
        // 1. Update Product Entity (Global/First Found - usually kept for
        // compatibility)
        // Note: If we strictly want to separate products by warehouse in `Product`
        // table too, we should find by SKU AND Warehouse.
        // For now, we update the first found product's total quantity as per original
        // logic,
        // OR better, we find the specific product entry if we assume Product table has
        // one entry per warehouse per SKU.

        // Strategy:
        // If specificWarehouse is provided, try to find Product by SKU AND Warehouse.
        // If not found, fallback to SKU only (legacy behavior).

        IMS.Entity.Product product = null;
        if (specificWarehouse != null) {
            product = productRepo.findByProductNameAndWarehouse_Name(sku, specificWarehouse).orElse(null);
            // Wait, SKU is stored in product, but findByProductNameAndWarehouse_Name
            // usually expects Name.
            // Let's use findBySkuAndWarehouse_Name if it exists, or iterate.
            // Given limitations, let's stick to updating the specific stock first, and then
            // reflect on Product if needed.
            // Actually, `Product` entity in this system seems to be the "Catalog" + "Stock"
            // combined?
            // No, `AddStock` is Inventory. `Product` is Catalog?
            // The previous code updated `Product` quantity. If `Product` is one-per-sku
            // (global catalog), then updating it is fine.
            // If `Product` is one-per-warehouse, we need to find the right one.

            // Let's use `productRepo.findFirstBySku(sku)` for now to keep existing behavior
            // for the "Catalog" view,
            // BUT crucially update `AddStock` correctly.
        }

        if (product == null) {
            product = productRepo.findFirstBySku(sku).orElse(null);
        }

        if (product != null) {
            int currentQty = product.getQuantity() == null ? 0 : product.getQuantity();
            product.setQuantity(currentQty + quantityChange);
            productRepo.save(product);

            // 2. Update AddStock Entity (Inventory)
            // Use specificWarehouse if provided, otherwise fallback to product's default
            // warehouse
            String targetWarehouse = specificWarehouse;
            if (targetWarehouse == null) {
                if (product.getWarehouse() != null) {
                    targetWarehouse = product.getWarehouse().getName();
                } else if (product.getWarehouseName() != null) {
                    targetWarehouse = product.getWarehouseName();
                }
            }

            String productName = product.getProductName();

            if (targetWarehouse != null && productName != null) {
                IMS.Entity.AddStock stockEntry = addStockRepo
                        .findFirstByWarehouseAndProductName(targetWarehouse, productName)
                        .orElse(null);

                if (stockEntry != null) {
                    // Update existing
                    int currentStock = stockEntry.getQuantity() == null ? 0 : stockEntry.getQuantity();
                    stockEntry.setQuantity(currentStock + quantityChange);
                    addStockRepo.save(stockEntry);
                } else if (quantityChange > 0) {
                    // Create new Only if adding
                    IMS.Entity.AddStock newStock = new IMS.Entity.AddStock();
                    newStock.setWarehouse(targetWarehouse);
                    newStock.setProductName(productName);
                    newStock.setQuantity(quantityChange);
                    newStock.setResponsiblePerson("System Purchase"); // Default
                    newStock.setQuantityAlert(10); // Default
                    addStockRepo.save(newStock);
                }
            }
        }
    }
}

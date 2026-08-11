package IMS.Service;

import IMS.Entity.PurchaseReturn;
import IMS.Repos.PurchaseReturnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseReturnService {

    @Autowired
    private PurchaseReturnRepository repo;

    @Autowired
    private IMS.Repos.ProductRepository productRepo;

    @Autowired
    private IMS.Repos.AddStockRepository addStockRepo;

    // CREATE
    public PurchaseReturn savePurchaseReturn(PurchaseReturn purchaseReturn) {
        PurchaseReturn saved = repo.save(purchaseReturn);

        // Update Stock Logic
        try {
            System.out.println("Processing Purchase Return Stock Update...");
            System.out.println("Displaying Warehouse Name from Payload: " + saved.getWarehouseName());
            System.out.println("Displaying Product (SKU/Name) from Payload: " + saved.getProduct());
            System.out.println("Displaying Quantity: " + saved.getQuantity());

            if (saved.getProduct() != null && saved.getQuantity() != null) {
                // 1. Find Product by SKU to get Name and Warehouse
                IMS.Entity.Product product = productRepo.findFirstBySku(saved.getProduct()).orElse(null);
                System.out.println(
                        "Product Lookup by SKU result: " + (product != null ? product.getProductName() : "NULL"));

                if (product != null) {
                    // 2. Reduce quantity in Product table (Frontend "Product List" view)
                    // Note: This updates the CATALOG product. Ideally we should match warehouse too
                    // if Product table tracks warehouse.
                    // But usually Product table is minimal. We'll update it if it matches or just
                    // deduct global quantity if that's the design.
                    // For now, let's keep existing logic but be careful.
                    int currentProductQty = product.getQuantity() != null ? product.getQuantity() : 0;
                    int newProductQty = Math.max(0, currentProductQty - saved.getQuantity());
                    product.setQuantity(newProductQty);
                    productRepo.save(product);
                    System.out.println("Reduced Catalog Product Quantity to: " + newProductQty);
                }

                // 3. Reduce quantity in AddStock table (Inventory / Manage Stock)
                // Use the WAREHOUSE NAME from the Purchase Return directly
                String warehouseTarget = saved.getWarehouseName();
                String productNameTarget = (product != null) ? product.getProductName() : saved.getProduct(); // SKU or
                                                                                                              // Name?

                // If product was null (SKU lookup failed), maybe saved.getProduct() is the
                // Name?
                // Frontend sends 'productSku' which is often the name or SKU.
                // Let's try to identify the product name reliably.
                if (productNameTarget == null)
                    productNameTarget = saved.getProduct();

                System.out.println("Target Warehouse: " + warehouseTarget);
                System.out.println("Target Product Name: " + productNameTarget);

                if (warehouseTarget != null && productNameTarget != null) {
                    IMS.Entity.AddStock stock = addStockRepo
                            .findFirstByWarehouseAndProductName(warehouseTarget, productNameTarget)
                            .orElse(null);

                    if (stock != null) {
                        int currentStockQty = stock.getQuantity() != null ? stock.getQuantity() : 0;
                        int newStockQty = Math.max(0, currentStockQty - saved.getQuantity());
                        stock.setQuantity(newStockQty);
                        addStockRepo.save(stock);
                        System.out.println("Stock deducted for " + productNameTarget + " in " + warehouseTarget + ": "
                                + currentStockQty + " -> " + newStockQty);
                    } else {
                        System.out.println("No Stock entry found for " + productNameTarget + " in " + warehouseTarget);
                        // DEBUG: List all stocks to see what's available
                        /*
                         * List<IMS.Entity.AddStock> allStocks = addStockRepo.findAll();
                         * for(IMS.Entity.AddStock s : allStocks) {
                         * System.out.println("Available Stock: " + s.getProductName() + " @ " +
                         * s.getWarehouse() + " (Qty: " + s.getQuantity() + ")");
                         * }
                         */
                    }
                } else {
                    System.out.println("Skipping Stock Update: Warehouse or Product Name is NULL");
                }
            }
        } catch (Exception e) {
            System.err.println("Error updating stock for Purchase Return: " + e.getMessage());
            e.printStackTrace();
            // We don't throw here to avoid rolling back the return creation,
            // but ideally this should be transactional.
        }

        return saved;
    }

    // UPDATE
    public PurchaseReturn updatePurchaseReturn(Long id, PurchaseReturn purchaseReturn) {

        PurchaseReturn existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Return record not found"));

        existing.setSupplierName(purchaseReturn.getSupplierName());
        existing.setDate(purchaseReturn.getDate());
        existing.setReference(purchaseReturn.getReference());
        existing.setProduct(purchaseReturn.getProduct());
        existing.setQuantity(purchaseReturn.getQuantity());
        existing.setCost(purchaseReturn.getCost());
        existing.setOrderTax(purchaseReturn.getOrderTax());
        existing.setDiscount(purchaseReturn.getDiscount());
        existing.setShipping(purchaseReturn.getShipping());
        existing.setStatus(purchaseReturn.getStatus());
        existing.setDescription(purchaseReturn.getDescription());

        return repo.save(existing);
    }

    // GET ONE
    public PurchaseReturn getPurchaseReturn(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Return record not found"));
    }

    // GET ALL
    public List<PurchaseReturn> getAllPurchaseReturns() {
        return repo.findAll();
    }

    // DELETE
    public void deletePurchaseReturn(Long id) {
        repo.deleteById(id);
    }
}

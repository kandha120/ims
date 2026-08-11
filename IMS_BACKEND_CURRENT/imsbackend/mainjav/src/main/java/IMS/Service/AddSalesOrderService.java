package IMS.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import IMS.Entity.AddSalesOrder;
import IMS.Entity.SalesOrderItem;
import IMS.Repos.AddSalesOrderRepository;

@Service
public class AddSalesOrderService {

    private final AddSalesOrderRepository repo;
    private final IMS.Repos.ProductRepository productRepo;
    private final IMS.Repos.AddStockRepository addStockRepo;

    public AddSalesOrderService(AddSalesOrderRepository repo, IMS.Repos.ProductRepository productRepo,
            IMS.Repos.AddStockRepository addStockRepo) {
        this.repo = repo;
        this.productRepo = productRepo;
        this.addStockRepo = addStockRepo;
    }

    @Transactional
    public AddSalesOrder saveOrder(AddSalesOrder order) {
        // ensure each child points back to parent and calculate totals if needed
        if (order.getItems() != null) {
            for (SalesOrderItem i : order.getItems()) {
                i.setSalesOrder(order);
                if (i.getUnitPrice() != null && i.getQuantity() != null) {
                    i.setTotal(i.getUnitPrice() * i.getQuantity());

                    // Stock Deduction
                    updateProductStock(i.getProductName(), i.getWarehouseName(), i.getQuantity());
                }
            }
        }
        return repo.save(order);
    }

    private void updateProductStock(String productName, String warehouseName, Integer quantityToDeduct) {
        System.out.println("DEBUG: updateProductStock called for Product: " + productName + ", Warehouse: "
                + warehouseName + ", Qty: " + quantityToDeduct);

        if (quantityToDeduct == null || quantityToDeduct <= 0) {
            System.out.println("DEBUG: Quantity is null or <= 0. Skipping.");
            return;
        }

        // Trim inputs
        productName = productName != null ? productName.trim() : "";
        warehouseName = warehouseName != null ? warehouseName.trim() : "";
        System.out.println("DEBUG: updateProductStock TRIMMED -> Product: '" + productName + "', Warehouse: '"
                + warehouseName + "'");

        Optional<IMS.Entity.Product> productOpt = productRepo.findByProductNameAndWarehouse_Name(productName,
                warehouseName);

        if (productOpt.isPresent()) {
            IMS.Entity.Product p = productOpt.get();
            int available = p.getQuantity() != null ? p.getQuantity() : 0;
            System.out.println(
                    "DEBUG: Product found. Current Qty: " + available + ". New Qty: " + (available - quantityToDeduct));
            p.setQuantity(available - quantityToDeduct);
            productRepo.save(p);
        } else {
            System.out.println("DEBUG: Product NOT found in ProductRepository with Name='" + productName
                    + "' and Warehouse.Name='" + warehouseName + "'");
        }

        // Also update AddStock (Manage Stock)
        Optional<IMS.Entity.AddStock> stockOpt = addStockRepo.findFirstByWarehouseAndProductName(warehouseName,
                productName);
        if (stockOpt.isPresent()) {
            IMS.Entity.AddStock s = stockOpt.get();
            int current = s.getQuantity() != null ? s.getQuantity() : 0;
            System.out.println(
                    "DEBUG: AddStock found. Current Qty: " + current + ". New Qty: " + (current - quantityToDeduct));
            s.setQuantity(current - quantityToDeduct);
            addStockRepo.save(s);
        } else {
            System.out.println("DEBUG: AddStock NOT found with Warehouse='" + warehouseName + "' and ProductName='"
                    + productName + "'");
        }
    }

    public List<AddSalesOrder> getAllOrders() {
        return repo.findAll();
    }

    public AddSalesOrder getOrderById(Long id) {
        return repo.findById(id).orElse(null);
    }

    @Transactional
    public AddSalesOrder updateOrder(Long id, AddSalesOrder updated) {
        Optional<AddSalesOrder> opt = repo.findById(id);
        if (!opt.isPresent())
            return null;
        AddSalesOrder existing = opt.get();

        // 1. Revert stock for existing items
        if (existing.getItems() != null) {
            for (SalesOrderItem oldItem : existing.getItems()) {
                revertProductStock(oldItem.getProductName(), oldItem.getWarehouseName(), oldItem.getQuantity());
            }
        }

        existing.setSoNo(updated.getSoNo());
        existing.setDate(updated.getDate());
        existing.setCustomer(updated.getCustomer());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setBillingAddress(updated.getBillingAddress());
        existing.setShippingAddress(updated.getShippingAddress());
        existing.setCustomerGstin(updated.getCustomerGstin());
        existing.setSalesperson(updated.getSalesperson());
        existing.setPaymentTerms(updated.getPaymentTerms());
        existing.setExpectedDelivery(updated.getExpectedDelivery());
        existing.setDeliveryCharges(updated.getDeliveryCharges());
        existing.setStatus(updated.getStatus());
        existing.setTermsAndConditions(updated.getTermsAndConditions());

        // replace child list safely: clear and add new ones with back-reference
        existing.getItems().clear();
        if (updated.getItems() != null) {
            for (SalesOrderItem item : updated.getItems()) {
                item.setSalesOrder(existing);
                if (item.getUnitPrice() != null && item.getQuantity() != null) {
                    item.setTotal(item.getUnitPrice() * item.getQuantity());
                    // 2. Deduct stock for new items
                    updateProductStock(item.getProductName(), item.getWarehouseName(), item.getQuantity());
                }
                existing.getItems().add(item);
            }
        }

        return repo.save(existing);
    }

    private void revertProductStock(String productName, String warehouseName, Integer quantityToAdd) {
        if (quantityToAdd == null || quantityToAdd <= 0)
            return;

        // Revert Product Stock
        Optional<IMS.Entity.Product> productOpt = productRepo.findByProductNameAndWarehouse_Name(productName,
                warehouseName);
        if (productOpt.isPresent()) {
            IMS.Entity.Product p = productOpt.get();
            p.setQuantity((p.getQuantity() != null ? p.getQuantity() : 0) + quantityToAdd);
            productRepo.save(p);
        }

        // Revert AddStock (Manage Stock)
        Optional<IMS.Entity.AddStock> stockOpt = addStockRepo.findFirstByWarehouseAndProductName(warehouseName,
                productName);
        if (stockOpt.isPresent()) {
            IMS.Entity.AddStock s = stockOpt.get();
            int current = s.getQuantity() != null ? s.getQuantity() : 0;
            s.setQuantity(current + quantityToAdd);
            addStockRepo.save(s);
        }
    }

    @Transactional
    public String deleteOrder(Long id) {
        Optional<AddSalesOrder> orderOpt = repo.findById(id);
        if (orderOpt.isPresent()) {
            AddSalesOrder order = orderOpt.get();
            if (order.getItems() != null) {
                for (SalesOrderItem item : order.getItems()) {
                    revertProductStock(item.getProductName(), item.getWarehouseName(), item.getQuantity());
                }
            }
            repo.deleteById(id);
            return "Order deleted successfully";
        }
        return "Order not found";
    }
}

package IMS.Service;

import IMS.Entity.AddSalesReturn;
import IMS.Entity.SalesReturnItem;
import IMS.Repos.AddSalesReturnRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AddSalesReturnService {

    private final AddSalesReturnRepository repository;
    private final AddStockService addStockService;

    public AddSalesReturnService(AddSalesReturnRepository repository, AddStockService addStockService) {
        this.repository = repository;
        this.addStockService = addStockService;
    }

    public List<AddSalesReturn> getAllSalesReturns() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching sales returns: " + e.getMessage(), e);
        }
    }

    public AddSalesReturn getSalesReturnById(Long id) {
        try {
            return repository.findById(id).orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching sales return: " + e.getMessage(), e);
        }
    }

    public AddSalesReturn updateSalesReturn(Long id, AddSalesReturn updated) {
        try {
            AddSalesReturn existing = repository.findById(id).orElse(null);
            if (existing == null) {
                return null;
            }

            existing.setCustomerName(updated.getCustomerName());
            existing.setDate(updated.getDate());
            existing.setReference(updated.getReference());
            existing.setOrderTax(updated.getOrderTax());
            existing.setDiscountTotal(updated.getDiscountTotal());
            existing.setShipping(updated.getShipping());
            existing.setStatus(updated.getStatus());

            existing.setPaid(updated.getPaid());

            // 1. Update Items first to calculate new total
            if (updated.getItems() != null) {
                existing.getItems().clear();
                for (SalesReturnItem item : updated.getItems()) {
                    item.setSalesReturn(existing);
                    existing.getItems().add(item);
                }
            }

            // 2. Calculate Total
            double itemTotal = existing.getItems().stream()
                    .mapToDouble(i -> i.getLineTotal() != null ? i.getLineTotal() : 0.0)
                    .sum();

            double tax = existing.getOrderTax() != null ? existing.getOrderTax() : 0.0;
            double shipping = existing.getShipping() != null ? existing.getShipping() : 0.0;
            double discount = existing.getDiscountTotal() != null ? existing.getDiscountTotal() : 0.0;

            double grandTotal = itemTotal + tax + shipping - discount;
            existing.setGrandTotal(grandTotal);

            // 3. Calculate Due & Paid
            double currentPaid = updated.getPaid() != null ? updated.getPaid()
                    : (existing.getPaid() != null ? existing.getPaid() : 0.0);

            if (currentPaid >= grandTotal) {
                currentPaid = grandTotal; // If fully paid or more, cap at grandTotal
                existing.setPaid(currentPaid);
                existing.setDue(0.0);
            } else {
                existing.setPaid(currentPaid);
                existing.setDue(grandTotal - currentPaid);
            }

            return repository.save(existing);
        } catch (Exception e) {
            throw new RuntimeException("Error updating sales return: " + e.getMessage(), e);
        }
    }

    // Also update saveSalesReturn to calculate due
    public AddSalesReturn saveSalesReturn(AddSalesReturn salesReturn) {
        try {
            if (salesReturn.getItems() != null) {
                for (SalesReturnItem item : salesReturn.getItems()) {
                    item.setSalesReturn(salesReturn);

                    // Update Stock (Increment)
                    if (item.getWarehouseName() != null && item.getProductName() != null
                            && item.getQuantity() != null) {
                        IMS.Entity.AddStock stockUpdate = new IMS.Entity.AddStock();
                        stockUpdate.setWarehouse(item.getWarehouseName());
                        stockUpdate.setProductName(item.getProductName());
                        stockUpdate.setQuantity(item.getQuantity().intValue());
                        // Optional: Set responsible person if available, or leave null

                        addStockService.saveStock(stockUpdate);
                    }
                }
            }

            // Calculate Total
            double itemTotal = 0.0;
            if (salesReturn.getItems() != null) {
                itemTotal = salesReturn.getItems().stream()
                        .mapToDouble(i -> i.getLineTotal() != null ? i.getLineTotal() : 0.0)
                        .sum();
            }

            double tax = salesReturn.getOrderTax() != null ? salesReturn.getOrderTax() : 0.0;
            double shipping = salesReturn.getShipping() != null ? salesReturn.getShipping() : 0.0;
            double discount = salesReturn.getDiscountTotal() != null ? salesReturn.getDiscountTotal() : 0.0;

            double grandTotal = itemTotal + tax + shipping - discount;
            salesReturn.setGrandTotal(grandTotal);

            double paid = salesReturn.getPaid() != null ? salesReturn.getPaid() : 0.0;
            if (paid > grandTotal) {
                paid = grandTotal;
                salesReturn.setPaid(paid);
            }

            salesReturn.setDue(Math.max(0, grandTotal - paid));

            return repository.save(salesReturn);
        } catch (Exception e) {
            throw new RuntimeException("Error saving sales return: " + e.getMessage(), e);
        }
    }

    public String deleteSalesReturn(Long id) {
        try {
            repository.deleteById(id);
            return "Sales return deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Error deleting sales return: " + e.getMessage(), e);
        }
    }
}

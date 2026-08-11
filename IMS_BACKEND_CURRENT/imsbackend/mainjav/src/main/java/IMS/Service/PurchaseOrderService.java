package IMS.Service;

import IMS.Entity.PurchaseOrder;
import IMS.Entity.PurchaseOrderItem;
import IMS.Repos.PurchaseOrderRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository repository;

    public PurchaseOrderService(PurchaseOrderRepository repository) {
        this.repository = repository;
    }

    // CREATE
    public PurchaseOrder savePurchaseOrder(PurchaseOrder purchaseOrder) {
        try {
            if (purchaseOrder.getItems() != null) {
                purchaseOrder.getItems().forEach(item -> item.setPurchaseOrder(purchaseOrder));
            }
            calculateTotals(purchaseOrder);
            return repository.save(purchaseOrder);
        } catch (Exception e) {
            throw new RuntimeException("Error saving Purchase Order: " + e.getMessage(), e);
        }
    }

    // READ ALL
    public List<PurchaseOrder> getAllPurchaseOrders() {
        try {
            return repository.findAll();
        } catch (Exception e) {
            throw new RuntimeException("Error fetching Purchase Orders: " + e.getMessage(), e);
        }
    }

    // READ ONE
    public PurchaseOrder getPurchaseOrderById(Long id) {
        try {
            return repository.findById(id).orElse(null);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching Purchase Order: " + e.getMessage(), e);
        }
    }

    // UPDATE
    public PurchaseOrder updatePurchaseOrder(Long id, PurchaseOrder updated) {
        try {
            PurchaseOrder existing = repository.findById(id).orElse(null);
            if (existing == null)
                return null;

            existing.setCompanyName(updated.getCompanyName());
            // Removed companyAddress, companyContact, companyGstin updates

            existing.setReferencePoNo(updated.getReferencePoNo());
            existing.setDate(updated.getDate());

            existing.setSupplierName(updated.getSupplierName());
            existing.setSupplierAddress(updated.getSupplierAddress());
            existing.setSupplierGstin(updated.getSupplierGstin());

            existing.setContactPerson(updated.getContactPerson());
            existing.setPaymentTerms(updated.getPaymentTerms());
            existing.setExpectedDelivery(updated.getExpectedDelivery());
            existing.setFreightCharges(updated.getFreightCharges());
            existing.setDescription(updated.getDescription());
            // Removed status update
            existing.setTermsAndConditions(updated.getTermsAndConditions());
            existing.setWarehouseName(updated.getWarehouseName());

            existing.setDue(updated.getDue());

            if (existing.getItems() == null) {
                existing.setItems(new ArrayList<>());
            } else {
                existing.getItems().clear();
            }

            if (updated.getItems() != null) {
                for (PurchaseOrderItem item : updated.getItems()) {
                    item.setPurchaseOrder(existing);
                    existing.getItems().add(item);
                }
            }

            calculateTotals(existing);

            return repository.save(existing);
        } catch (Exception e) {
            throw new RuntimeException("Error updating Purchase Order: " + e.getMessage(), e);
        }
    }

    // DELETE
    public String deletePurchaseOrder(Long id) {
        try {
            repository.deleteById(id);
            return "Purchase Order deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Error deleting Purchase Order: " + e.getMessage(), e);
        }
    }

    private void calculateTotals(PurchaseOrder order) {
        if (order.getItems() != null) {
            double totalTax = 0.0;
            double totalDiscount = 0.0;

            for (PurchaseOrderItem item : order.getItems()) {
                double qty = item.getQuantity() != null ? item.getQuantity() : 0;
                double price = item.getUnitPrice() != null ? item.getUnitPrice() : 0;
                double disc = item.getDiscount() != null ? item.getDiscount() : 0;
                double taxRate = item.getTax() != null ? item.getTax() : 0;

                // Base amount after discount
                double baseAmount = (qty * price) - disc;
                // Tax amount
                double taxAmount = baseAmount * (taxRate / 100.0);

                totalTax += taxAmount;
                totalDiscount += disc;
            }
            order.setOrderTax(totalTax);
            order.setOrderDiscount(totalDiscount);
        } else {
            order.setOrderTax(0.0);
            order.setOrderDiscount(0.0);
        }
    }
}

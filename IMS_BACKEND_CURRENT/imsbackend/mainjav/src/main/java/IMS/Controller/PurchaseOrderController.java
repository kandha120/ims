package IMS.Controller;

import IMS.Entity.PurchaseOrder;
import IMS.Service.PurchaseOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-order")
public class PurchaseOrderController {

    private final PurchaseOrderService service;

    public PurchaseOrderController(PurchaseOrderService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addPurchaseOrder(@RequestBody PurchaseOrder purchaseOrder) {
        try {
            return ResponseEntity.ok(service.savePurchaseOrder(purchaseOrder));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save Purchase Order: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllPurchaseOrders() {
        try {
            return ResponseEntity.ok(service.getAllPurchaseOrders());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching Purchase Orders: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseOrder(@PathVariable Long id) {
        try {
            PurchaseOrder po = service.getPurchaseOrderById(id);
            if (po == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(po);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching Purchase Order: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updatePurchaseOrder(
            @PathVariable Long id,
            @RequestBody PurchaseOrder purchaseOrder) {
        try {
            PurchaseOrder updated = service.updatePurchaseOrder(id, purchaseOrder);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update Purchase Order: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deletePurchaseOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.deletePurchaseOrder(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete Purchase Order: " + e.getMessage());
        }
    }
}

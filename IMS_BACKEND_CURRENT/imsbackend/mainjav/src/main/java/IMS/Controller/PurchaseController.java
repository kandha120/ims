package IMS.Controller;

import IMS.Entity.Purchase;
import IMS.Service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchases")

public class PurchaseController {

    @Autowired
    private PurchaseService service;

    // ---------- CREATE ----------
    @PostMapping
    public ResponseEntity<?> createPurchase(@RequestBody Purchase purchase) {

        try {
            System.out.println("Received Purchase Payload: " + purchase);
            System.out.println("Grand Total in Payload: " + purchase.getGrandTotal());
            Purchase saved = service.savePurchase(purchase);
            return ResponseEntity.ok(saved);

        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // ---------- UPDATE ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchase(@PathVariable Long id, @RequestBody Purchase purchase) {

        try {
            Purchase updated = service.updatePurchase(id, purchase);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // ---------- GET ONE ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchase(@PathVariable Long id) {

        try {
            Purchase purchase = service.getPurchase(id);
            return ResponseEntity.ok(purchase);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    // ---------- GET ALL ----------
    @GetMapping
    public ResponseEntity<List<Purchase>> getAllPurchases() {
        return ResponseEntity.ok(service.getAllPurchases());
    }

    // ---------- DELETE ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchase(@PathVariable Long id) {

        try {
            service.deletePurchase(id);
            return ResponseEntity.ok(Map.of("message", "Purchase record deleted successfully"));

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}

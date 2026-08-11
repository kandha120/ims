package IMS.Controller;


import IMS.Entity.PurchaseReturn;
import IMS.Service.PurchaseReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-returns")

public class PurchaseReturnController {

    @Autowired
    private PurchaseReturnService service;


    // ---------- CREATE ----------
    @PostMapping
    public ResponseEntity<?> createPurchaseReturn(@RequestBody PurchaseReturn purchaseReturn) {

        try {
            PurchaseReturn saved = service.savePurchaseReturn(purchaseReturn);
            return ResponseEntity.ok(saved);

        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ---------- UPDATE ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchaseReturn(@PathVariable Long id,
                                                  @RequestBody PurchaseReturn purchaseReturn) {

        try {
            PurchaseReturn updated = service.updatePurchaseReturn(id, purchaseReturn);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ---------- GET ONE ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseReturn(@PathVariable Long id) {

        try {
            PurchaseReturn record = service.getPurchaseReturn(id);
            return ResponseEntity.ok(record);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ---------- GET ALL ----------
    @GetMapping
    public ResponseEntity<List<PurchaseReturn>> getAllPurchaseReturns() {
        return ResponseEntity.ok(service.getAllPurchaseReturns());
    }


    // ---------- DELETE ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchaseReturn(@PathVariable Long id) {

        try {
            service.deletePurchaseReturn(id);
            return ResponseEntity.ok(Map.of("message", "Purchase Return record deleted successfully"));

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

}

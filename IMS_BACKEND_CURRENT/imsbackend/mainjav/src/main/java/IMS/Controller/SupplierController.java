package IMS.Controller;

import IMS.Entity.Supplier;
import IMS.Service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin
public class SupplierController {

    @Autowired
    private SupplierService service;


    // ---------- CREATE ----------
    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody Supplier supplier) {

        try {
            Supplier saved = service.saveSupplier(supplier);
            return ResponseEntity.ok(saved);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ---------- UPDATE ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {

        try {
            Supplier updated = service.updateSupplier(id, supplier);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ---------- GET ONE ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> getSupplier(@PathVariable Long id) {

        try {
            Supplier supplier = service.getSupplier(id);
            return ResponseEntity.ok(supplier);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ---------- GET ALL ----------
    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(service.getAllSuppliers());
    }


    // ---------- DELETE ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {

        try {
            service.deleteSupplier(id);
            return ResponseEntity.ok(Map.of("message", "Supplier deleted successfully"));

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

}

package IMS.Controller;


import IMS.Entity.Warehouse;
import IMS.Service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouses")

public class WarehouseController {

    @Autowired
    private WarehouseService service;


    // ------------ CREATE ------------
    @PostMapping
    public ResponseEntity<?> createWarehouse(@RequestBody Warehouse warehouse) {

        try {
            Warehouse saved = service.saveWarehouse(warehouse);
            return ResponseEntity.ok(saved);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ------------ UPDATE ------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouse) {

        try {
            Warehouse updated = service.updateWarehouse(id, warehouse);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ------------ GET ONE ------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getWarehouse(@PathVariable Long id) {

        try {
            Warehouse warehouse = service.getWarehouse(id);
            return ResponseEntity.ok(warehouse);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // ------------ GET ALL ------------
    @GetMapping
    public ResponseEntity<List<Warehouse>> getAllWarehouses() {
        return ResponseEntity.ok(service.getAllWarehouses());
    }


    // ------------ DELETE ------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWarehouse(@PathVariable Long id) {

        try {
            service.deleteWarehouse(id);
            return ResponseEntity.ok(Map.of("message", "Warehouse deleted successfully"));

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}

package IMS.Controller;

import IMS.Entity.Product;
import IMS.Service.WarehouseProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouse/products")
public class WarehouseProductController {

    @Autowired
    private WarehouseProductService service;

    // ---------------------- CREATE PRODUCT ----------------------
    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestBody Product product,
            @RequestParam Long warehouseId   // ✅ REQUIRED
    ) {
        Product saved = service.saveProduct(product, warehouseId);
        return ResponseEntity.ok(saved);
    }

    // ---------------------- UPDATE PRODUCT ----------------------
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product,
            @RequestParam Long warehouseId   // ✅ REQUIRED
    ) {
        Product updated = service.updateProduct(id, product, warehouseId);
        return ResponseEntity.ok(updated);
    }

    // ---------------------- GET PRODUCT BY ID ----------------------
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        Product product = service.getProduct(id);
        return ResponseEntity.ok(product);
    }

    // ---------------------- GET ALL PRODUCTS ----------------------
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(service.getAllProducts());
    }

    // ---------------------- DELETE PRODUCT ----------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        service.deleteProduct(id);
        return ResponseEntity.ok(
                Map.of("message", "Product deleted successfully")
        );
    }
}

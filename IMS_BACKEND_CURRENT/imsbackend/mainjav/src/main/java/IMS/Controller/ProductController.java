package IMS.Controller;

import IMS.Entity.Product;
import IMS.Service.ProductNameService;
import IMS.Service.ProductService;
import IMS.Service.ProductStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductStatsService statsService;
    private final ProductNameService nameService;

    public ProductController(ProductService productService,
            ProductStatsService statsService,
            ProductNameService nameService) {
        this.productService = productService;
        this.statsService = statsService;
        this.nameService = nameService;
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestParam Long warehouseId,
            @RequestBody Product product) {

        Product savedProduct = productService.createProduct(product, warehouseId);
        return ResponseEntity.ok(savedProduct);
    }

    // ✅ ONLY PLACE FOR THIS API
    @GetMapping("/names")
    public ResponseEntity<List<String>> getProductNames() {
        return ResponseEntity.ok(nameService.getAllProductNames());
    }

    @GetMapping("/top-selling")
    public ResponseEntity<List<Map<String, Object>>> getTopSelling(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(
                statsService.getTopSellingProducts(limit));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStock() {
        return ResponseEntity.ok(statsService.getLowStockProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/by-warehouse/{warehouseName}")
    public ResponseEntity<List<Product>> getProductsByWarehouse(@PathVariable String warehouseName) {
        return ResponseEntity.ok(productService.getProductsByWarehouse(warehouseName));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }
}

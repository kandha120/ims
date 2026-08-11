package IMS.Controller;

import IMS.Entity.AddStock;
import IMS.Service.AddStockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
public class AddStockController {

    private final AddStockService service;

    public AddStockController(AddStockService service) {
        this.service = service;
    }

    // CREATE / ADD QUANTITY
    @PostMapping("/add")
    public ResponseEntity<?> addStock(@RequestBody AddStock stock) {
        AddStock saved = service.saveStock(stock);
        return ResponseEntity.ok(saved);
    }

    // READ ALL
    @GetMapping("/all")
    public ResponseEntity<?> getAllStock() {
        List<AddStock> stocks = service.getAllStock();
        return ResponseEntity.ok(stocks);
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getStockById(@PathVariable Long id) {
        AddStock stock = service.getStockById(id);
        if (stock == null) {
            throw new RuntimeException("Stock not found with id: " + id);
        }
        return ResponseEntity.ok(stock);
    }

    // UPDATE (replace)
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody AddStock stock) {
        AddStock updated = service.updateStock(id, stock);
        if (updated == null) {
            throw new RuntimeException("Stock not found with id: " + id);
        }
        return ResponseEntity.ok(updated);
    }

    /**
     * LOW STOCK – with threshold + limit
     *
     * Example:
     * /api/stock/low?threshold=100&limit=5
     */
    @GetMapping("/low")
    public ResponseEntity<?> getLowStock(
            @RequestParam(name = "threshold", defaultValue = "100") Integer threshold,
            @RequestParam(name = "limit", defaultValue = "10") Integer limit) {
        List<AddStock> lowStock = service.getLowStock(threshold, limit);
        return ResponseEntity.ok(lowStock);
    }

    // READ BY WAREHOUSE
    @GetMapping("/by-warehouse/{warehouseName}")
    public ResponseEntity<?> getStocksByWarehouse(@PathVariable String warehouseName) {
        List<AddStock> list = service.getStocksByWarehouse(warehouseName);
        return ResponseEntity.ok(list);
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteStock(@PathVariable Long id) {
        return ResponseEntity.ok(service.deleteStock(id));
    }
}

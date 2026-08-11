package IMS.Controller;

import IMS.Entity.AddSalesReturn;
import IMS.Service.AddSalesReturnService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-return")
@CrossOrigin(origins = "*") // optional – for frontend access
public class AddSalesReturnController {

    private final AddSalesReturnService service;

    public AddSalesReturnController(AddSalesReturnService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addSalesReturn(@RequestBody AddSalesReturn salesReturn) {
        try {
            AddSalesReturn saved = service.saveSalesReturn(salesReturn);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save sales return: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        try {
            List<AddSalesReturn> list = service.getAllSalesReturns();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error getting sales returns: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            AddSalesReturn sr = service.getSalesReturnById(id);
            if (sr == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(sr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching sales return: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AddSalesReturn salesReturn) {
        try {
            AddSalesReturn updated = service.updateSalesReturn(id, salesReturn);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            String msg = service.deleteSalesReturn(id);
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete: " + e.getMessage());
        }
    }
}

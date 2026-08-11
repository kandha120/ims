package IMS.Controller;

import IMS.Entity.AddAdjustment;
import IMS.Service.AddAdjustmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adjustment")

public class AddAdjustmentController {

    private final AddAdjustmentService service;

    public AddAdjustmentController(AddAdjustmentService service) {
        this.service = service;
    }

    // CREATE
    @PostMapping("/add")
    public ResponseEntity<?> addAdjustment(@RequestBody AddAdjustment adjustment) {
        return ResponseEntity.ok(service.saveAdjustment(adjustment));
    }

    // GET ALL
    @GetMapping("/all")
    public ResponseEntity<?> getAllAdjustments() {
        List<AddAdjustment> list = service.getAllAdjustments();
        return ResponseEntity.ok(list);
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getAdjustmentById(@PathVariable Long id) {
        AddAdjustment adj = service.getAdjustmentById(id);
        if (adj == null) {
            throw new RuntimeException("Adjustment not found with id: " + id);
        }
        return ResponseEntity.ok(adj);
    }

    // UPDATE
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateAdjustment(@PathVariable Long id, @RequestBody AddAdjustment adjustment) {
        AddAdjustment updated = service.updateAdjustment(id, adjustment);
        if (updated == null) {
            throw new RuntimeException("Adjustment not found with id: " + id);
        }
        return ResponseEntity.ok(updated);
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteAdjustment(@PathVariable Long id) {
        return ResponseEntity.ok(service.deleteAdjustment(id));
    }
}

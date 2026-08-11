package IMS.Controller;


import IMS.Entity.AddTransfer;
import IMS.Service.AddTransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfer")

public class AddTransferController {

    private final AddTransferService service;

    public AddTransferController(AddTransferService service) {
        this.service = service;
    }

    // CREATE
    @PostMapping("/add")
    public ResponseEntity<?> addTransfer(@RequestBody AddTransfer transfer) {
        try {
            return ResponseEntity.ok(service.saveTransfer(transfer));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to add transfer: " + e.getMessage());
        }
    }

    // GET ALL
    @GetMapping("/all")
    public ResponseEntity<?> getAllTransfers() {
        try {
            List<AddTransfer> transfers = service.getAllTransfers();
            return ResponseEntity.ok(transfers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching transfers: " + e.getMessage());
        }
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getTransferById(@PathVariable Long id) {
        try {
            AddTransfer transfer = service.getTransferById(id);
            if (transfer == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(transfer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // UPDATE
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateTransfer(@PathVariable Long id, @RequestBody AddTransfer transfer) {
        try {
            AddTransfer updated = service.updateTransfer(id, transfer);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update transfer: " + e.getMessage());
        }
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteTransfer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.deleteTransfer(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete transfer: " + e.getMessage());
        }
    }
}

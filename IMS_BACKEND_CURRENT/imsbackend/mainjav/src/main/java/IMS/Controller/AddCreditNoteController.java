package IMS.Controller;

import IMS.Entity.AddCreditNote;
import IMS.Service.AddCreditNoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/credit-note")
public class AddCreditNoteController {

    private final AddCreditNoteService service;

    public AddCreditNoteController(AddCreditNoteService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addCreditNote(@RequestBody AddCreditNote creditNote) {
        try {
            return ResponseEntity.ok(service.saveCreditNote(creditNote));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save credit note: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllCreditNotes() {
        try {
            return ResponseEntity.ok(service.getAllCreditNotes());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching credit notes: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCreditNoteById(@PathVariable Long id) {
        try {
            AddCreditNote cn = service.getCreditNoteById(id);
            if (cn == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(cn);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching credit note: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateCreditNote(@PathVariable Long id, @RequestBody AddCreditNote creditNote) {
        try {
            AddCreditNote updated = service.updateCreditNote(id, creditNote);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update credit note: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteCreditNote(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.deleteCreditNote(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete: " + e.getMessage());
        }
    }
}

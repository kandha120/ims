package IMS.Controller;

import IMS.Entity.AddDebitNote;
import IMS.Service.AddDebitNoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debit-note")
public class AddDebitNoteController {

    private final AddDebitNoteService service;

    public AddDebitNoteController(AddDebitNoteService service) {
        this.service = service;
    }

    @PostMapping("/add")
    public ResponseEntity<?> addDebitNote(@RequestBody AddDebitNote debitNote) {
        try {
            return ResponseEntity.ok(service.saveDebitNote(debitNote));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to save debit note: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllDebitNotes() {
        try {
            return ResponseEntity.ok(service.getAllDebitNotes());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching debit notes: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDebitNoteById(@PathVariable Long id) {
        try {
            AddDebitNote note = service.getDebitNoteById(id);
            if (note == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(note);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching entry: " + e.getMessage());
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateDebitNote(
            @PathVariable Long id,
            @RequestBody AddDebitNote debitNote) {
        try {
            AddDebitNote updated = service.updateDebitNote(id, debitNote);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update debit note: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteDebitNote(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.deleteDebitNote(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete: " + e.getMessage());
        }
    }
}

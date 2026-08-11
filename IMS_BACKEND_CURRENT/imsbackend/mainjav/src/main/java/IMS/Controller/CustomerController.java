package IMS.Controller;

import IMS.Entity.Customer;
import IMS.Service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")

public class CustomerController {

    @Autowired
    private CustomerService service;

    // ---------------- CREATE ----------------
    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {

        try {
            Customer saved = service.saveCustomer(customer);
            return ResponseEntity.ok(saved);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // ---------------- UPDATE ----------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody Customer customer) {

        try {
            Customer updated = service.updateCustomer(id, customer);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // ---------------- GET ONE ----------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomer(@PathVariable Long id) {

        try {
            Customer customer = service.getCustomer(id);
            return ResponseEntity.ok(customer);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    // ---------------- GET ALL ----------------
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(service.getAllCustomers());
    }

    // ---------------- DELETE ----------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {

        try {
            service.deleteCustomer(id);
            return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/top")
    public ResponseEntity<List<Map<String, Object>>> getTopCustomers(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.getTopCustomers(limit));
    }

}

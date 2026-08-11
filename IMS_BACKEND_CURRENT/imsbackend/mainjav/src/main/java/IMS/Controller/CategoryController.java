package IMS.Controller;


import IMS.Entity.Category;
import IMS.Service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")

public class CategoryController {

    @Autowired
    private CategoryService service;


    // -------- CREATE ----------
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Category category) {

        try {
            Category saved = service.saveCategory(category);
            return ResponseEntity.ok(saved);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // -------- UPDATE ----------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category category) {

        try {
            Category updated = service.updateCategory(id, category);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // -------- GET ONE ----------
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategory(@PathVariable Long id) {

        try {
            Category cat = service.getCategory(id);
            return ResponseEntity.ok(cat);

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    // -------- GET ALL ----------
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(service.getAllCategories());
    }


    // -------- DELETE ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {

        try {
            service.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));

        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

}

package IMS.Service;



import IMS.Entity.Category;
import IMS.Repos.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repo;


    // CREATE
    public Category saveCategory(Category category) {

        if (repo.existsByName(category.getName())) {
            throw new RuntimeException("Category already exists!");
        }

        return repo.save(category);
    }


    // UPDATE
    public Category updateCategory(Long id, Category category) {

        Category existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        existing.setName(category.getName());
        existing.setStatus(category.getStatus());

        return repo.save(existing);
    }


    // GET ONE
    public Category getCategory(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }


    // GET ALL
    public List<Category> getAllCategories() {
        return repo.findAll();
    }


    // DELETE
    public void deleteCategory(Long id) {
        repo.deleteById(id);
    }
}

package IMS.Service;

import IMS.Entity.Product;
import IMS.Entity.Warehouse;
import IMS.Repos.ProductRepository;
import IMS.Repos.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WarehouseProductService {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private WarehouseRepository warehouseRepo;

    // ---------------- CREATE PRODUCT ----------------
    public Product saveProduct(Product product, Long warehouseId) {

        Warehouse warehouse = warehouseRepo.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        product.setWarehouse(warehouse);
        product.setWarehouseName(warehouse.getName());

        if (productRepo.existsByProductNameAndWarehouse(
                product.getProductName(), warehouse)) {

            throw new RuntimeException(
                    "Product '" + product.getProductName() +
                            "' already exists in warehouse '" + warehouse.getName() + "'");
        }

        return productRepo.save(product);
    }

    // ---------------- UPDATE PRODUCT ----------------
    public Product updateProduct(Long id, Product product, Long warehouseId) {

        Product existing = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Warehouse warehouse = warehouseRepo.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        if (productRepo.existsByProductNameAndWarehouseAndIdNot(
                product.getProductName(), warehouse, id)) {

            throw new RuntimeException(
                    "Product '" + product.getProductName() +
                            "' already exists in warehouse '" + warehouse.getName() + "'");
        }

        existing.setProductName(product.getProductName());
        existing.setSku(product.getSku());
        existing.setHsnSac(product.getHsnSac());
        existing.setCategory(product.getCategory());
        existing.setUnits(product.getUnits());
        existing.setDescription(product.getDescription());
        existing.setQuantity(product.getQuantity());
        existing.setPrice(product.getPrice());
        existing.setCost(product.getCost());
        existing.setTaxAmount(product.getTaxAmount());
        existing.setQuantityAlert(product.getQuantityAlert());
        existing.setWarranty(product.getWarranty());
        existing.setManufacturer(product.getManufacturer());
        existing.setPreferenceSupply(product.getPreferenceSupply());
        existing.setManufacturedDate(product.getManufacturedDate());
        existing.setExpiryOn(product.getExpiryOn());
        existing.setExpiryOn(product.getExpiryOn());
        existing.setWarehouse(warehouse);
        existing.setWarehouseName(warehouse.getName());

        return productRepo.save(existing);
    }

    // ---------------- GET ONE ----------------
    public Product getProduct(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    // ---------------- GET ALL ----------------
    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }

    // ---------------- DELETE ----------------
    public void deleteProduct(Long id) {
        if (!productRepo.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepo.deleteById(id);
    }
}

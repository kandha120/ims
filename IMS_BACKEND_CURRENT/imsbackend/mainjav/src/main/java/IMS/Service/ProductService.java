package IMS.Service;

import IMS.Entity.Product;
import IMS.Entity.Warehouse;
import IMS.Repos.ProductRepository;
import IMS.Repos.WarehouseRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

        private final ProductRepository productRepository;
        private final WarehouseRepository warehouseRepository;

        public ProductService(ProductRepository productRepository,
                        WarehouseRepository warehouseRepository) {
                this.productRepository = productRepository;
                this.warehouseRepository = warehouseRepository;
        }

        @Transactional
        public Product createProduct(Product product, Long warehouseId) {

                // 1️⃣ Validate Warehouse
                Warehouse warehouse = warehouseRepository.findById(warehouseId)
                                .orElseThrow(() -> new RuntimeException("Warehouse not found with id: " + warehouseId));

                // 2️⃣ Duplicate Product Check (per warehouse)
                boolean exists = productRepository
                                .existsByProductNameAndWarehouse(
                                                product.getProductName(),
                                                warehouse);

                if (exists) {
                        throw new RuntimeException(
                                        "Product already exists in this warehouse");
                }

                // 3️⃣ SET WAREHOUSE ⭐⭐⭐ (THIS WAS MISSING)
                product.setWarehouse(warehouse);

                // 4️⃣ Save Product
                return productRepository.save(product);
        }

        public java.util.List<Product> getAllProducts() {
                return productRepository.findAll();
        }

        public java.util.List<Product> getProductsByWarehouse(String warehouseName) {
                return productRepository.findByWarehouse_Name(warehouseName);
        }

        public void deleteProduct(Long id) {
                productRepository.deleteById(id);
        }

        public Product getProductById(Long id) {
                return productRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        }
}

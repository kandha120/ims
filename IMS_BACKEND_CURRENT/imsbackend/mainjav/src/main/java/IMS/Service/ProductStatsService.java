package IMS.Service;

import IMS.Repos.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ProductStatsService {

    private final ProductRepository productRepository;

    private final IMS.Repos.AddStockRepository addStockRepository;

    public ProductStatsService(ProductRepository productRepository, IMS.Repos.AddStockRepository addStockRepository) {
        this.productRepository = productRepository;
        this.addStockRepository = addStockRepository;
    }

    public List<Map<String, Object>> getTopSellingProducts(int limit) {
        return productRepository.findTopSellingProducts(limit);
    }

    public List<IMS.Entity.Product> getLowStockProducts() {
        // 1. Get potential low stock products from Product table
        List<IMS.Entity.Product> products = productRepository.findLowStockProducts();

        // 2. Correct the quantity using AddStock (Source of Truth) and filter
        return products.stream()
                .peek(p -> {
                    Integer realQty = addStockRepository.sumQuantityByProductName(p.getProductName());
                    p.setQuantity(realQty != null ? realQty : 0);
                })
                // Only keep if the REAL quantity is actually low
                .filter(p -> p.getQuantity() <= (p.getQuantityAlert() != null ? p.getQuantityAlert() : 0))
                .collect(java.util.stream.Collectors.toList());
    }
}

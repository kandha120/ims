package IMS.Service;

import IMS.Repos.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductNameService {

    private final ProductRepository productRepository;

    public ProductNameService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<String> getAllProductNames() {
        return productRepository.findAllProductNames();
    }
}

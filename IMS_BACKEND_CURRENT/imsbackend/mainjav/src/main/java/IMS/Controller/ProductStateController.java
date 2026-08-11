package IMS.Controller;

import IMS.Service.ProductStatsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-stats")
public class ProductStateController {

    private final ProductStatsService statsService;

    public ProductStateController(ProductStatsService statsService) {
        this.statsService = statsService;
    }

    // ✅ ONLY STATS RELATED API
    @GetMapping("/top-selling")
    public List<Map<String, Object>> getTopSelling(
            @RequestParam(defaultValue = "5") int limit) {
        return statsService.getTopSellingProducts(limit);
    }

    // ❌ NO getProductNames() HERE
}

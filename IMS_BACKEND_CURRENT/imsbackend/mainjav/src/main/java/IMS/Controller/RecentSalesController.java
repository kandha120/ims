package IMS.Controller;

import IMS.Entity.AddSalesOrder;
import IMS.Service.RecentSalesService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class RecentSalesController {

    private final RecentSalesService service;

    public RecentSalesController(RecentSalesService service) {
        this.service = service;
    }

    /**
     * GET /api/sales/recent?limit=5
     *
     * Returns the most recent `limit` AddSalesOrder entries.
     */
    @GetMapping("/recent")
    public List<AddSalesOrder> getRecentSales(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return service.getRecentSalesByLimit(limit);
    }

    /**
     * GET /api/sales
     * Returns all sales orders.
     */
    @GetMapping
    public List<AddSalesOrder> getAllSales() {
        return service.getAllSales();
    }
}

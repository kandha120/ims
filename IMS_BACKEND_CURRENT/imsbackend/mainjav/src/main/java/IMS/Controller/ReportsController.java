package IMS.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import IMS.Service.ReportsService;

@RestController
@RequestMapping("/api/reports/purchase")
public class ReportsController {

    @Autowired
    private ReportsService reportsService;

    @GetMapping("/summary")
    public ResponseEntity<List<Map<String, Object>>> summary(@RequestParam(required = false) String startDate,
                                                              @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(reportsService.getPurchaseSummary(startDate, endDate));
    }

    @GetMapping("/detail")
    public ResponseEntity<List<?>> detail(@RequestParam(required = false) String startDate,
                                          @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(reportsService.getPurchaseDetail(startDate, endDate));
    }

    @GetMapping("/supplier-wise")
    public ResponseEntity<List<Map<String, Object>>> supplierWise(@RequestParam(required = false) String supplierName,
                                                                  @RequestParam(required = false) String startDate,
                                                                  @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(reportsService.getSupplierWise(supplierName, startDate, endDate));
    }

    @GetMapping("/product-wise")
    public ResponseEntity<List<Map<String, Object>>> productWise(@RequestParam(required = false) String productSku,
                                                                 @RequestParam(required = false) String startDate,
                                                                 @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(reportsService.getProductWise(productSku, startDate, endDate));
    }

    @GetMapping("/returns")
    public ResponseEntity<List<?>> returns(@RequestParam(required = false) String startDate,
                                           @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(reportsService.getPurchaseReturns(startDate, endDate));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<List<Map<String, Object>>> outstanding(@RequestParam(required = false) String supplierName) {
        return ResponseEntity.ok(reportsService.getSupplierOutstanding(supplierName));
    }

    @GetMapping("/gst")
    public ResponseEntity<List<Map<String, Object>>> gst(@RequestParam(required = false) String startDate,
                                                         @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(reportsService.getGstPurchase(startDate, endDate));
    }
}

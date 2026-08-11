package IMS.Service;

import IMS.Entity.Purchase;
import IMS.Entity.PurchaseReturn;
import IMS.Repos.PurchaseRepository;
import IMS.Repos.PurchaseReturnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportsService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private PurchaseReturnRepository purchaseReturnRepository;

    private final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    public List<Map<String, Object>> getPurchaseSummary(String startDate, String endDate) {
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        List<Purchase> list = filterByDate(purchaseRepository.findAll(), start, end);

        // Group by period (yyyy-MM) and supplier
        Map<String, Map<String, List<Purchase>>> grouped = list.stream()
                .collect(Collectors.groupingBy(p -> p.getDate() == null ? "" : p.getDate().getYear() + "-" + String.format("%02d", p.getDate().getMonthValue()),
                        Collectors.groupingBy(p -> p.getSupplierName() == null ? "" : p.getSupplierName())));

        List<Map<String, Object>> result = new ArrayList<>();
        grouped.forEach((period, bySupplier) -> {
            bySupplier.forEach((supplier, purchases) -> {
                double totalAmount = purchases.stream().mapToDouble(p -> p.getGrandTotal() == null ? 0.0 : p.getGrandTotal()).sum();
                int totalQty = purchases.stream().mapToInt(p -> p.getQuantity() == null ? 0 : p.getQuantity()).sum();
                Map<String, Object> row = new HashMap<>();
                row.put("period", period);
                row.put("supplier", supplier);
                row.put("totalAmount", totalAmount);
                row.put("totalQty", totalQty);
                result.add(row);
            });
        });
        return result;
    }

    public List<Purchase> getPurchaseDetail(String startDate, String endDate) {
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        return filterByDate(purchaseRepository.findAll(), start, end);
    }

    public List<Map<String, Object>> getSupplierWise(String supplierName, String startDate, String endDate) {
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        List<Purchase> list = filterByDate(purchaseRepository.findAll(), start, end).stream()
                .filter(p -> supplierName == null || supplierName.isEmpty() || supplierName.equalsIgnoreCase(p.getSupplierName()))
                .collect(Collectors.toList());

        Map<String, List<Purchase>> grouped = list.stream().collect(Collectors.groupingBy(p -> p.getSupplierName() == null ? "" : p.getSupplierName()));
        List<Map<String, Object>> result = new ArrayList<>();
        grouped.forEach((supplier, purchases) -> {
            double total = purchases.stream().mapToDouble(p -> p.getGrandTotal() == null ? 0.0 : p.getGrandTotal()).sum();
            int qty = purchases.stream().mapToInt(p -> p.getQuantity() == null ? 0 : p.getQuantity()).sum();
            Map<String, Object> row = new HashMap<>();
            row.put("supplier", supplier);
            row.put("totalPurchases", total);
            row.put("totalQty", qty);
            result.add(row);
        });
        return result;
    }

    public List<Map<String, Object>> getProductWise(String productSku, String startDate, String endDate) {
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        List<Purchase> list = filterByDate(purchaseRepository.findAll(), start, end).stream()
                .filter(p -> productSku == null || productSku.isEmpty() || productSku.equalsIgnoreCase(p.getProductSku()))
                .collect(Collectors.toList());

        Map<String, List<Purchase>> grouped = list.stream().collect(Collectors.groupingBy(p -> p.getProductSku() == null ? "" : p.getProductSku()));
        List<Map<String, Object>> result = new ArrayList<>();
        grouped.forEach((sku, purchases) -> {
            double total = purchases.stream().mapToDouble(p -> p.getGrandTotal() == null ? 0.0 : p.getGrandTotal()).sum();
            int qty = purchases.stream().mapToInt(p -> p.getQuantity() == null ? 0 : p.getQuantity()).sum();
            Map<String, Object> row = new HashMap<>();
            row.put("productSku", sku);
            row.put("purchasedQty", qty);
            row.put("purchasedValue", total);
            result.add(row);
        });
        return result;
    }

    public List<PurchaseReturn> getPurchaseReturns(String startDate, String endDate) {
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        List<PurchaseReturn> list = purchaseReturnRepository.findAll();
        if (start == null && end == null) return list;
        return list.stream().filter(r -> {
            if (r.getDate() == null) return false;
            if (start != null && r.getDate().isBefore(start)) return false;
            if (end != null && r.getDate().isAfter(end)) return false;
            return true;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getSupplierOutstanding(String supplierName) {
        List<Purchase> list = purchaseRepository.findAll().stream()
                .filter(p -> p.getDue() != null && p.getDue() > 0)
                .collect(Collectors.toList());
        if (supplierName != null && !supplierName.isEmpty()) {
            list = list.stream().filter(p -> supplierName.equalsIgnoreCase(p.getSupplierName())).collect(Collectors.toList());
        }
        return list.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("supplier", p.getSupplierName());
            m.put("invoiceNo", p.getReference());
            m.put("dueDate", p.getDate());
            m.put("dueAmount", p.getDue());
            return m;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getGstPurchase(String startDate, String endDate) {
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        List<Purchase> list = filterByDate(purchaseRepository.findAll(), start, end);
        return list.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("invoiceNo", p.getReference());
            m.put("date", p.getDate());
            m.put("supplier", p.getSupplierName());
            m.put("taxableValue", p.getGrandTotal() == null ? 0.0 : p.getGrandTotal() - (p.getTax() == null ? 0.0 : p.getTax()));
            m.put("gst", p.getTax());
            m.put("total", p.getGrandTotal());
            return m;
        }).collect(Collectors.toList());
    }

    // --- Helpers ---
    private LocalDate parseDate(String input) {
        try {
            if (input == null || input.isEmpty()) return null;
            return LocalDate.parse(input, DATE_FORMAT);
        } catch (Exception e) {
            return null;
        }
    }

    private List<Purchase> filterByDate(List<Purchase> list, LocalDate start, LocalDate end) {
        if (start == null && end == null) return list;
        return list.stream().filter(p -> {
            if (p.getDate() == null) return false;
            if (start != null && p.getDate().isBefore(start)) return false;
            if (end != null && p.getDate().isAfter(end)) return false;
            return true;
        }).collect(Collectors.toList());
    }
}

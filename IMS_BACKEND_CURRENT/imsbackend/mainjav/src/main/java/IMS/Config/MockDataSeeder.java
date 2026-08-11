package IMS.Config;

import IMS.Entity.*;
import IMS.Repos.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

// @Component
public class MockDataSeeder implements CommandLineRunner {

    private final WarehouseRepository warehouseRepo;
    private final CategoryRepository categoryRepo;
    private final SupplierRepository supplierRepo;
    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final AddSalesOrderRepository salesOrderRepo;
    private final PurchaseRepository purchaseRepo;

    public MockDataSeeder(WarehouseRepository warehouseRepo,
            CategoryRepository categoryRepo,
            SupplierRepository supplierRepo,
            CustomerRepository customerRepo,
            ProductRepository productRepo,
            AddSalesOrderRepository salesOrderRepo,
            PurchaseRepository purchaseRepo) {
        this.warehouseRepo = warehouseRepo;
        this.categoryRepo = categoryRepo;
        this.supplierRepo = supplierRepo;
        this.customerRepo = customerRepo;
        this.productRepo = productRepo;
        this.salesOrderRepo = salesOrderRepo;
        this.purchaseRepo = purchaseRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        if (warehouseRepo.count() > 0) {
            System.out.println("ℹ️ Database already has data. Skipping mock seeding.");
            return;
        }

        System.out.println("🌱 Seeding Mock Data...");

        // 1. Create Warehouse
        Warehouse wh = new Warehouse();
        wh.setName("Main Hub");
        wh.setEmail("hub@example.com");
        wh.setPhone("9988776655");
        wh.setStatus("Active");
        wh.setAddress("123 Main St");
        wh.setCity("New York");
        wh.setCountry("USA");
        wh.setPostalCode("10001");
        wh = warehouseRepo.save(wh);

        // 2. Create Categories
        Category c1 = new Category(null, "Computers", "Active");
        Category c2 = new Category(null, "Accessories", "Active");
        Category c3 = new Category(null, "Phones", "Active");
        categoryRepo.saveAll(Arrays.asList(c1, c2, c3));

        // 3. Create Suppliers
        Supplier s1 = new Supplier();
        s1.setFirstName("Tech");
        s1.setLastName("Supplies Inc");
        s1.setEmail("supply@tech.com");
        s1.setPhone("1112223333");
        s1.setStatus("Active");
        s1.setCountry("USA");
        s1 = supplierRepo.save(s1);

        Supplier s2 = new Supplier();
        s2.setFirstName("Global");
        s2.setLastName("Components");
        s2.setEmail("global@comp.com");
        s2.setPhone("4445556666");
        s2.setStatus("Active");
        s2.setCountry("China");
        s2 = supplierRepo.save(s2);

        // 4. Create Customers
        Customer cust1 = new Customer();
        cust1.setFirstName("John");
        cust1.setLastName("Doe");
        cust1.setEmail("john@doe.com");
        cust1.setPhone("5551234567");
        cust1.setCountry("USA");
        cust1 = customerRepo.save(cust1);

        Customer cust2 = new Customer();
        cust2.setFirstName("Jane");
        cust2.setLastName("Smith");
        cust2.setEmail("jane@smith.com");
        cust2.setPhone("5559876543");
        cust2.setCountry("UK");
        cust2 = customerRepo.save(cust2);

        // 5. Create Products
        Product p1 = new Product();
        p1.setProductName("MacBook Pro");
        p1.setSku("MBP-2025");
        p1.setCategory("Computers");
        p1.setHsnSac("8471");
        p1.setPrice(1200.0);
        p1.setCost(900.0);
        p1.setQuantity(50);
        p1.setQuantityAlert(5);
        p1.setWarehouse(wh);
        p1.setWarehouseName(wh.getName());
        p1.setDescription("Latest model laptop");
        // Remove manual ID setting
        productRepo.save(p1);

        Product p2 = new Product();
        p2.setProductName("iPhone 15");
        p2.setSku("IPH-15");
        p2.setCategory("Phones");
        p2.setHsnSac("8517");
        p2.setPrice(999.0);
        p2.setCost(750.0);
        p2.setQuantity(100);
        p2.setQuantityAlert(10);
        p2.setWarehouse(wh);
        p2.setWarehouseName(wh.getName());
        productRepo.save(p2);

        Product p3 = new Product();
        p3.setProductName("USB-C Cable");
        p3.setSku("USB-C-01");
        p3.setCategory("Accessories");
        p3.setHsnSac("8544");
        p3.setPrice(19.99);
        p3.setCost(5.0);
        p3.setQuantity(500);
        p3.setQuantityAlert(50);
        p3.setWarehouse(wh);
        p3.setWarehouseName(wh.getName());
        productRepo.save(p3);

        // 6. Create Sales Orders
        AddSalesOrder so1 = new AddSalesOrder();
        so1.setCustomer(cust1.getFirstName() + " " + cust1.getLastName());
        so1.setDate(LocalDate.now().toString());
        so1.setStatus("Completed");
        so1.setPaymentTerms("Cash");
        so1.setSalesperson("Admin");
        so1.setDeliveryCharges(20.0);

        SalesOrderItem item1 = new SalesOrderItem();
        item1.setProductName(p1.getProductName());
        item1.setUnitPrice(p1.getPrice());
        item1.setQuantity(1);
        item1.setTotal(p1.getPrice());
        item1.setSalesOrder(so1);

        so1.setItems(Arrays.asList(item1));
        salesOrderRepo.save(so1);

        // 7. Create Purchases
        Purchase pur1 = new Purchase();
        pur1.setDate(LocalDate.now());
        pur1.setSupplierName(s1.getFirstName());
        pur1.setReference("PO-001");
        pur1.setGrandTotal(5000.0);
        pur1.setPaid(5000.0);
        pur1.setDue(0.0);
        pur1.setShippingStatus("Received");
        purchaseRepo.save(pur1);

        System.out.println("✅ Mock Data Seeding Completed Successfully!");
    }
}

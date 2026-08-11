package IMS.Service;

import IMS.Entity.AddSalesOrder;
import IMS.Repos.AddSalesOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecentSalesService {

    private final AddSalesOrderRepository addSalesOrderRepository;

    @Autowired
    public RecentSalesService(AddSalesOrderRepository addSalesOrderRepository) {
        this.addSalesOrderRepository = addSalesOrderRepository;
    }

    @Transactional(readOnly = true)
    public List<AddSalesOrder> getRecentSalesByLimit(int limit) {
        if (limit <= 0) {
            limit = 10;
        }
        Pageable pageable = PageRequest.of(0, limit);
        return addSalesOrderRepository.findRecentOrders(pageable);
    }

    @Transactional(readOnly = true)
    public List<AddSalesOrder> getAllSales() {
        return addSalesOrderRepository.findAll();
    }
}

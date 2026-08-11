package IMS.Service;

import IMS.Entity.Warehouse;
import IMS.Repos.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WarehouseService {

    @Autowired
    private WarehouseRepository repo;


    // CREATE
    public Warehouse saveWarehouse(Warehouse warehouse) {

        if (repo.existsByName(warehouse.getName())) {
            throw new RuntimeException("Warehouse name already exists!");
        }

        if (repo.existsByEmail(warehouse.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }

        if (warehouse.getPhone() != null && repo.existsByPhone(warehouse.getPhone())) {
            throw new RuntimeException("Phone number already exists!");
        }

        return repo.save(warehouse);
    }


    // UPDATE
    public Warehouse updateWarehouse(Long id, Warehouse warehouse) {

        Warehouse existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        existing.setName(warehouse.getName());
        existing.setContactPerson(warehouse.getContactPerson());
        existing.setEmail(warehouse.getEmail());
        existing.setPhone(warehouse.getPhone());
        existing.setAddress(warehouse.getAddress());
        existing.setCity(warehouse.getCity());
        existing.setState(warehouse.getState());
        existing.setCountry(warehouse.getCountry());
        existing.setPostalCode(warehouse.getPostalCode());
        existing.setStatus(warehouse.getStatus());

        return repo.save(existing);
    }


    // GET ONE
    public Warehouse getWarehouse(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
    }


    // GET ALL
    public List<Warehouse> getAllWarehouses() {
        return repo.findAll();
    }


    // DELETE
    public void deleteWarehouse(Long id) {
        repo.deleteById(id);
    }
}

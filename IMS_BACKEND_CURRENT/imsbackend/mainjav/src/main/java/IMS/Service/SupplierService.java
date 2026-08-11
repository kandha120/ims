package IMS.Service;


import IMS.Entity.Supplier;
import IMS.Repos.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository repo;


    // CREATE
    public Supplier saveSupplier(Supplier supplier) {

        if (repo.existsByEmail(supplier.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }

        if (supplier.getPhone() != null && repo.existsByPhone(supplier.getPhone())) {
            throw new RuntimeException("Phone number already exists!");
        }

        return repo.save(supplier);
    }


    // UPDATE
    public Supplier updateSupplier(Long id, Supplier supplier) {
        Supplier existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        existing.setFirstName(supplier.getFirstName());
        existing.setLastName(supplier.getLastName());
        existing.setEmail(supplier.getEmail());
        existing.setPhone(supplier.getPhone());
        existing.setAddress(supplier.getAddress());
        existing.setCity(supplier.getCity());
        existing.setState(supplier.getState());
        existing.setCountry(supplier.getCountry());
        existing.setPostalCode(supplier.getPostalCode());
        existing.setStatus(supplier.getStatus());

        return repo.save(existing);
    }


    // GET ONE
    public Supplier getSupplier(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }


    // GET ALL
    public List<Supplier> getAllSuppliers() {
        return repo.findAll();
    }


    // DELETE
    public void deleteSupplier(Long id) {
        repo.deleteById(id);
    }
}

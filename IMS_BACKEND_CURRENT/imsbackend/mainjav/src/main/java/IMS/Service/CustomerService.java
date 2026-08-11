package IMS.Service;

import IMS.Entity.Customer;
import IMS.Repos.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository repo;

    // CREATE
    public Customer saveCustomer(Customer customer) {

        if (repo.existsByEmail(customer.getEmail())) {
            throw new RuntimeException("Email already exists!");
        }

        if (customer.getPhone() != null && repo.existsByPhone(customer.getPhone())) {
            throw new RuntimeException("Phone number already exists!");
        }

        return repo.save(customer);
    }

    // UPDATE
    public Customer updateCustomer(Long id, Customer customer) {
        Customer existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        existing.setFirstName(customer.getFirstName());
        existing.setLastName(customer.getLastName());
        existing.setEmail(customer.getEmail());
        existing.setPhone(customer.getPhone());
        existing.setAddress(customer.getAddress());
        existing.setCity(customer.getCity());
        existing.setState(customer.getState());
        existing.setCountry(customer.getCountry());
        existing.setPostalCode(customer.getPostalCode());
        existing.setStatus(customer.getStatus());

        return repo.save(existing);
    }

    // GET ONE
    public Customer getCustomer(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    // GET ALL
    public List<Customer> getAllCustomers() {
        return repo.findAll();
    }

    // DELETE
    public void deleteCustomer(Long id) {
        repo.deleteById(id);
    }

    public java.util.List<java.util.Map<String, Object>> getTopCustomers(int limit) {
        return repo.findTopCustomers(limit);
    }
}

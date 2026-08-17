package IMS.Controller;

import IMS.DTO.UserResponseDTO;
import IMS.Entity.User;
import IMS.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    // ✅ Warehouse mapped user create
    @PostMapping("/register")
    public UserResponseDTO registerUserWithWarehouse(
            @RequestBody User user,
            @RequestParam Long warehouseId) {

        return userService.registerUserWithWarehouse(user, warehouseId);
    }

    @GetMapping
    public java.util.List<User> listAll() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public java.util.Optional<User> getOne(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User body) {
        var opt = userService.getUserById(id);
        if (opt.isEmpty()) throw new RuntimeException("User not found");
        User u = opt.get();
        u.setEmail(body.getEmail());
        if (body.getPassword() != null && !body.getPassword().isBlank()) {
            u.setPassword(body.getPassword());
        }
        u.setRole(body.getRole());
        return userService.registerUser(u);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}

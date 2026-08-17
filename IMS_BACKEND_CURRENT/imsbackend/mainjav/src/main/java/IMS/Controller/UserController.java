package IMS.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import IMS.DTO.UserResponseDTO;
import IMS.Entity.User;
import IMS.Service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping
    public org.springframework.http.ResponseEntity<?> createUser(@RequestBody java.util.Map<String, String> payload) {
        String username = payload.get("username") != null && !payload.get("username").isBlank() 
                ? payload.get("username").trim() 
                : (payload.get("email") != null ? payload.get("email").trim() : "");
        String password = payload.get("password");
        String role = payload.get("role");

        if (username.isBlank() || password == null || password.isBlank()) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", "Username and Password are required"));
        }
        if (role == null || role.isBlank()) {
            role = "User";
        }

        if (userService.getUserByEmail(username).isPresent()) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", "User with this username already exists"));
        }

        User user = new User();
        user.setEmail(username);
        user.setPassword(password);
        user.setRole(role);
        user.setWarehouse(null);

        User saved = userService.registerUser(user);
        return org.springframework.http.ResponseEntity.ok(saved);
    }

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

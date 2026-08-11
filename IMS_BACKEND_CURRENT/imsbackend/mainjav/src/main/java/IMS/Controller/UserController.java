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
}

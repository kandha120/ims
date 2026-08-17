package IMS.Controller;

import IMS.Config.JwtUtil;
import IMS.Controller.DTO.LoginRequest;
import IMS.Controller.DTO.RegisterRequest;
import IMS.Entity.User;
import IMS.Repos.UserRepository;
import IMS.Service.PasswordResetService;
import IMS.Service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final PasswordResetService passwordResetService;
    private final UserService userService;

    public AuthController(AuthenticationManager authManager,
            JwtUtil jwtUtil,
            UserRepository repo,
            PasswordEncoder encoder,
            PasswordResetService passwordResetService,
            UserService userService) {
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.repo = repo;
        this.encoder = encoder;
        this.passwordResetService = passwordResetService;
        this.userService = userService;
    }

    // ✅ LOGIN (email + password only)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletResponse response) {

        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            String email = auth.getName();
            var userOpt = repo.findByEmail(email);
            String role = userOpt.isPresent() ? userOpt.get().getRole() : "User";
            if (role == null || role.isBlank()) role = "User";

            String accessToken = jwtUtil.generateToken(email, role);
            String refreshToken = jwtUtil.generateRefreshToken(email, role);

            addCookie(response, "accessToken", accessToken, 60 * 60);
            addCookie(response, "refreshToken", refreshToken, 60 * 60 * 24 * 7);

            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "accessToken", accessToken,
                    "token", accessToken,
                    "refreshToken", refreshToken,
                    "email", email,
                    "username", email,
                    "role", role
            ));
        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An internal server error occurred"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthenticated"));
        }

        String email = authentication.getName();
        var userOpt = repo.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));

        User user = userOpt.get();
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    // ✅ REGISTER (email + password + role only)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if (repo.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setWarehouse(null); // IMPORTANT

        repo.save(user);

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestParam String email) {

        Optional<User> userOptional = repo.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Email not found");
        }

        String response = passwordResetService.resetPassword(email);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{email}/change-password")
    public ResponseEntity<String> changePassword(
            @PathVariable String email,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {

        return ResponseEntity.ok(
                userService.changePassword(email, oldPassword, newPassword));
    }

    private void addCookie(jakarta.servlet.http.HttpServletResponse response,
            String name,
            String value,
            int maxAge) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");

        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }
}

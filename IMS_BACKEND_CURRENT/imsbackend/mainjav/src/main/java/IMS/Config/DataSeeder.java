package IMS.Config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import IMS.Entity.User;
import IMS.Repos.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        User admin = userRepository.findByEmail("admin@example.com").orElse(new User());
        admin.setEmail("admin@example.com");
        admin.setPassword(passwordEncoder.encode("password123"));
        admin.setRole("Admin");
        userRepository.save(admin);
        System.out.println("✅ Default Admin User Updated/Created: admin@example.com / password123 (Role: Admin)");

        User normalUser = userRepository.findByEmail("user@example.com").orElse(new User());
        normalUser.setEmail("user@example.com");
        normalUser.setPassword(passwordEncoder.encode("password123"));
        normalUser.setRole("User");
        userRepository.save(normalUser);
        System.out.println("✅ Default User Updated/Created: user@example.com / password123 (Role: User)");
    }
}

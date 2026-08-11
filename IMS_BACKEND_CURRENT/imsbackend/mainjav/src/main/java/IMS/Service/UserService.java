package IMS.Service;

import IMS.DTO.UserResponseDTO;
import IMS.Entity.User;
import IMS.Entity.Warehouse;
import IMS.Repos.UserRepository;
import IMS.Repos.WarehouseRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    // ---------------- EXISTING METHODS (UNCHANGED) ----------------

    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // ---------------- NEW METHOD (WAREHOUSE SUPPORT) ----------------

    public UserResponseDTO registerUserWithWarehouse(User user, Long warehouseId) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setWarehouse(warehouse);

        User savedUser = userRepository.save(user);

        // ✅ Response la warehouse NAME mattum
        return new UserResponseDTO(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                warehouse.getName());
    }

    // ---------------- PASSWORD RESET EMAIL ----------------

    public void sendResetPasswordEmail(String toEmail, String newPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request");
            helper.setText(
                    "<div style='font-family: Arial;'>" +
                            "<h2>Password Reset Successful</h2>" +
                            "<p><b>New Password:</b> " + newPassword + "</p>" +
                            "<p>Please change it after login.</p>" +
                            "</div>",
                    true);

            helper.setFrom("premkumar@iatsolutions.co");
            mailSender.send(message);

        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    // ---------------- CHANGE PASSWORD ----------------

    public String changePassword(String email, String oldPassword, String newPassword) {

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null)
            return "User not found";

        if (!passwordEncoder.matches(oldPassword, user.getPassword()))
            return "Old password is incorrect";

        if (oldPassword.equals(newPassword))
            return "New password cannot be same as old password";

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return "Password changed successfully";
    }
}

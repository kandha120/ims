package IMS.Service;

import IMS.Entity.User;
import IMS.Repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final UserService userService;
    @Autowired
    private PasswordEncoder encoder;

    public PasswordResetService(UserRepository userRepository,
            UserService userService,
            PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.userService = userService;

    }

    @Transactional
    public String resetPassword(String email) {

        User user = userRepository.findByEmailReset(email);
        if (user == null)
            return "User not found";

        String newPassword = generateRandomPassword();

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);

        userService.sendResetPasswordEmail(email, newPassword);

        return "Password reset successfully. Check your email!";
    }

    private String generateRandomPassword() {
        int length = 10;
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

}

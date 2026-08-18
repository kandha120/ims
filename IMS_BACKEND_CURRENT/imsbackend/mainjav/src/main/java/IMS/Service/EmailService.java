package IMS.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:premkumar@iatsolutions.co}")
    private String fromEmail;

    public Map<String, Object> sendEmail(String to, String subject, String content, boolean isHtml) {
        if (mailSender == null) {
            return Map.of(
                "success", false,
                "message", "Mail sender is not configured in the application environment."
            );
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, isHtml);

            mailSender.send(message);

            return Map.of(
                "success", true,
                "message", "Email sent successfully to " + to
            );
        } catch (MessagingException e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "message", "Failed to send email: " + e.getMessage()
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "message", "Error sending email: " + e.getMessage()
            );
        }
    }

    public Map<String, Object> sendTestEmail(String recipient) {
        String target = (recipient != null && !recipient.isBlank()) ? recipient : fromEmail;
        String subject = "iatsolutionsPOS - Test Email";
        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>"
                + "<h2 style='color: #ff6b00;'>SMTP Configuration Active</h2>"
                + "<p>This is a test email sent from <b>iatsolutionsPOS System</b>.</p>"
                + "<p>Your email service integration is working properly!</p>"
                + "<hr style='border: 0; border-top: 1px solid #ccc;'/>"
                + "<small>Sent automatically by IMS Application</small>"
                + "</div>";

        return sendEmail(target, subject, htmlContent, true);
    }
}

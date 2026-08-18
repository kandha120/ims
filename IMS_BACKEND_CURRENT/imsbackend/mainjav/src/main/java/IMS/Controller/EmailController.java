package IMS.Controller;

import IMS.Service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendEmail(@RequestBody Map<String, Object> request) {
        String to = (String) request.get("to");
        String subject = (String) request.get("subject");
        String body = (String) request.get("body");
        Boolean isHtml = request.get("isHtml") != null ? (Boolean) request.get("isHtml") : true;

        if (to == null || to.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Recipient email ('to') is required"));
        }
        if (subject == null || subject.isBlank()) {
            subject = "Notification from iatsolutionsPOS";
        }
        if (body == null) body = "";

        Map<String, Object> result = emailService.sendEmail(to, subject, body, isHtml);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.internalServerError().body(result);
        }
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(@RequestBody(required = false) Map<String, String> request) {
        String recipient = request != null ? request.get("to") : null;
        Map<String, Object> result = emailService.sendTestEmail(recipient);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.internalServerError().body(result);
        }
    }
}

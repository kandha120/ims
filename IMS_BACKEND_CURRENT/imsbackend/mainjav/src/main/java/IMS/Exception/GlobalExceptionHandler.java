package IMS.Exception;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleJsonError(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "error", "Invalid JSON request",
                        "message", "Could not parse request body. Please check your JSON syntax and data types.",
                        "details", ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDbConstraint(org.springframework.dao.DataIntegrityViolationException ex) {
        return ResponseEntity.status(409).body(
                Map.of(
                        "error", "Database Conflict",
                        "message",
                        "A data integrity violation occurred. This often means a duplicate record was found or a required field is missing.",
                        "details", ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex) {
        return ResponseEntity.status(500).body(
                Map.of(
                        "error", "Internal Server Error",
                        "message", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "error", "Bad Request",
                        "message", ex.getMessage()));
    }
}

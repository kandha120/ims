package IMS.DTO;

public class UserResponseDTO {

    private Long id;
    private String email;
    private String role;
    private String warehouseName;

    // ✅ REQUIRED for Jackson / Spring
    public UserResponseDTO() {
    }

    public UserResponseDTO(Long id, String email, String role, String warehouseName) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.warehouseName = warehouseName;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getWarehouseName() {
        return warehouseName;
    }
}

package edu.cit.cantero.logpoint.auth;

import edu.cit.cantero.logpoint.shared.User;
import java.time.LocalDateTime;

public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String status;
    private String authProvider;
    private String pictureUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserDTO(User user) {
        this.id           = user.getId();
        this.firstName    = user.getFirstName();
        this.lastName     = user.getLastName();
        this.email        = user.getEmail();
        this.role         = user.getRole();
        this.status       = user.getStatus();
        this.authProvider = user.getAuthProvider();
        this.pictureUrl   = user.getPictureUrl();
        this.createdAt    = user.getCreatedAt();
        this.updatedAt    = user.getUpdatedAt();
    }

    // ── Getters & Setters ─────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public String getPictureUrl() { return pictureUrl; }
    public void setPictureUrl(String pictureUrl) { this.pictureUrl = pictureUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
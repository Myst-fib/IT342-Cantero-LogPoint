package edu.cit.cantero.logpoint.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class VisitorDTO {
    private Long id;
    
    @NotBlank(message = "Visitor name is required")
    private String visitorName;
    
    @NotBlank(message = "Contact number is required")
    private String contactNo;
    
    @NotBlank(message = "Host is required")
    private String host;
    
    @NotBlank(message = "Purpose is required")
    private String purpose;
    
    private LocalDateTime timeIn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public VisitorDTO() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
    
    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }
    
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    
    public LocalDateTime getTimeIn() { return timeIn; }
    public void setTimeIn(LocalDateTime timeIn) { this.timeIn = timeIn; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
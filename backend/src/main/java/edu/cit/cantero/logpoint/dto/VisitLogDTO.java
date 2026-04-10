package edu.cit.cantero.logpoint.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class VisitLogDTO {
    private Long id;
    
    @NotNull(message = "Visitor ID is required")
    private Long visitorId;
    
    private String visitorName;
    
    @NotNull(message = "Purpose ID is required")
    private Long purposeId;
    
    private String purposeName;
    
    private LocalDateTime timeIn;
    private LocalDateTime timeOut;
    private String status;
    private String hostName;
    private String notes;
    private Long createdById;
    private String createdByName;
    private String contactNo;
    
    // Constructors
    public VisitLogDTO() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getVisitorId() { return visitorId; }
    public void setVisitorId(Long visitorId) { this.visitorId = visitorId; }
    
    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
    
    public Long getPurposeId() { return purposeId; }
    public void setPurposeId(Long purposeId) { this.purposeId = purposeId; }
    
    public String getPurposeName() { return purposeName; }
    public void setPurposeName(String purposeName) { this.purposeName = purposeName; }
    
    public LocalDateTime getTimeIn() { return timeIn; }
    public void setTimeIn(LocalDateTime timeIn) { this.timeIn = timeIn; }
    
    public LocalDateTime getTimeOut() { return timeOut; }
    public void setTimeOut(LocalDateTime timeOut) { this.timeOut = timeOut; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getHostName() { return hostName; }
    public void setHostName(String hostName) { this.hostName = hostName; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }
}
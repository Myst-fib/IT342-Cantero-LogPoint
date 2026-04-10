package edu.cit.cantero.logpoint.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateVisitLogRequest {
    
    @NotBlank(message = "Visitor name is required")
    private String visitorName;
    
    @NotBlank(message = "Purpose is required")
    private String purpose;
    
    @NotBlank(message = "Host name is required")
    private String host;
    
    @NotBlank(message = "Department is required")
    private String department;
    
    @NotBlank(message = "Contact number is required")
    private String contactNo;
    
    // Getters and Setters
    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
    
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    
    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }
}
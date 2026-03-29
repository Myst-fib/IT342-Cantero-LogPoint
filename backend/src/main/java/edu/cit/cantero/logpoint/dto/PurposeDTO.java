package edu.cit.cantero.logpoint.dto;

import jakarta.validation.constraints.NotBlank;

public class PurposeDTO {
    private Long id;
    
    @NotBlank(message = "Purpose name is required")
    private String name;
    
    private String description;
    private Long usageCount;
    
    // Constructors
    public PurposeDTO() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Long getUsageCount() { return usageCount; }
    public void setUsageCount(Long usageCount) { this.usageCount = usageCount; }
}
package com.taskassist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProjectRequest {
    
    @NotBlank(message = "Project name is required")
    private String name;
    
    @NotBlank(message = "Project color is required")
    private String color;
    
    @NotNull(message = "User ID is required")
    private Integer userId;
    
    private Integer teamId;
    
    private Boolean isPublic;
}
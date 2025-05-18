package com.taskassist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private Boolean completed;
    
    private Integer projectId;
    
    private LocalDateTime dueDate;
    
    private String priority;
    
    private Boolean starred;
    
    private Integer assignedTo;
    
    private Integer assignedBy;
    
    @NotNull(message = "User ID is required")
    private Integer userId;
    
    private Integer teamId;
}
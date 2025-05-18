package com.taskassist.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Username must be at least 3 characters")
    @Size(min = 3, message = "Username must be at least 3 characters")
    private String username;
    
    @NotBlank(message = "Password must be at least 6 characters")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @Email(message = "Email must be valid")
    private String email;
    
    private String firstName;
    
    private String lastName;
}
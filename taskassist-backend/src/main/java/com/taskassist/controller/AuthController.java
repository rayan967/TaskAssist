package com.taskassist.controller;

import com.taskassist.dto.LoginRequest;
import com.taskassist.dto.RegisterRequest;
import com.taskassist.model.User;
import com.taskassist.security.JwtService;
import com.taskassist.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        // Check if username already exists
        if (userService.getUserByUsername(registerRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }

        // Map DTO to entity
        User userToCreate = User.builder()
                .username(registerRequest.getUsername())
                .password(registerRequest.getPassword()) // Service will encode this
                .email(registerRequest.getEmail())
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .build();

        // Create user
        User user = userService.createUser(userToCreate);

        // Generate JWT token with Express.js compatible format (using ID claim)
        String token = jwtService.generateTokenFromUserId(user.getId());

        // Create response matching Express.js format
        Map<String, Object> response = new HashMap<>();

        // Filter out sensitive data like password
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("email", user.getEmail());
        userMap.put("firstName", user.getFirstName());
        userMap.put("lastName", user.getLastName());
        userMap.put("role", user.getRole());
        userMap.put("profileImageUrl", user.getProfileImageUrl());
        userMap.put("isActive", user.getIsActive());

        response.put("user", userMap);
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            User user = (User) authentication.getPrincipal();

            // Update last login
            userService.updateLastLogin(user.getId());

            // Generate JWT token with Express.js compatible format (using ID claim)
            String token = jwtService.generateTokenFromUserId(user.getId());

            // Create response matching Express.js format
            Map<String, Object> response = new HashMap<>();

            // Filter out sensitive data like password
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("email", user.getEmail());
            userMap.put("firstName", user.getFirstName());
            userMap.put("lastName", user.getLastName());
            userMap.put("role", user.getRole());
            userMap.put("profileImageUrl", user.getProfileImageUrl());
            userMap.put("isActive", user.getIsActive());

            response.put("user", userMap);
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or password"));
        }
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "role", user.getRole(),
                "profileImageUrl", user.getProfileImageUrl(),
                "isActive", user.getIsActive()
        );
    }
}
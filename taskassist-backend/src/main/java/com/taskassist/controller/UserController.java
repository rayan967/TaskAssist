package com.taskassist.controller;

import com.taskassist.model.User;
import com.taskassist.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/search")
    public List<User> search(@RequestParam String q) {
        return userService.searchUsers(q).stream()
               .limit(10)
               .map(u -> { 
                   // Hide password hash in response
                   u.setPassword(null); 
                   return u; 
               })
               .toList();
    }
}
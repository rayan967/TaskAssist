package com.taskassist.controller;

import com.taskassist.model.Team;
import com.taskassist.model.User;
import com.taskassist.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/team-members")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<User>> getTeamMembers(@PathVariable Integer userId) {
        List<User> members = teamService.getTeamMembers(userId);
        return ResponseEntity.ok(members);
    }

    @PostMapping
    public ResponseEntity<Team> addTeamMember(@RequestBody Map<String, Integer> request) {
        Integer userId1 = request.get("userId1");
        Integer userId2 = request.get("userId2");
        
        if (userId1 == null || userId2 == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Team team = teamService.addTeamMember(userId1, userId2);
        return ResponseEntity.status(HttpStatus.CREATED).body(team);
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<?> removeTeamMember(@PathVariable Integer teamId) {
        boolean success = teamService.removeTeamMember(teamId);
        if (success) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
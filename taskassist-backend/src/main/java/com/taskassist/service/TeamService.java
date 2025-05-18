package com.taskassist.service;

import com.taskassist.model.Team;
import com.taskassist.model.User;
import com.taskassist.repository.TeamRepository;
import com.taskassist.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    
    public Team addTeamMember(Integer userId1, Integer userId2) {
        // Check if the connection already exists
        Optional<Team> existingTeam = teamRepository.findTeamConnection(userId1, userId2);
        if (existingTeam.isPresent()) {
            return existingTeam.get();
        }
        
        // Verify both users exist
        userRepository.findById(userId1)
            .orElseThrow(() -> new RuntimeException("User 1 not found"));
        userRepository.findById(userId2)
            .orElseThrow(() -> new RuntimeException("User 2 not found"));
        
        // Create new team connection
        Team team = Team.builder()
            .userId1(userId1)
            .userId2(userId2)
            .build();
        
        return teamRepository.save(team);
    }
    
    public List<User> getTeamMembers(Integer userId) {
        return teamRepository.findTeamMembersByUserId(userId);
    }
    
    public boolean removeTeamMember(Integer teamId) {
        return teamRepository.findById(teamId)
            .map(team -> {
                teamRepository.delete(team);
                return true;
            })
            .orElse(false);
    }
}
package com.taskassist.repository;

import com.taskassist.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {
    
    List<Project> findByUserId(Integer userId);
    
    List<Project> findByTeamId(Integer teamId);
    
    @Query("SELECT p FROM Project p WHERE p.userId = :userId OR " +
           "(p.teamId IN (SELECT t.id FROM Team t WHERE t.userId1 = :userId OR t.userId2 = :userId) AND p.isPublic = true)")
    List<Project> findProjectsByUserIdOrTeamMember(@Param("userId") Integer userId);
}
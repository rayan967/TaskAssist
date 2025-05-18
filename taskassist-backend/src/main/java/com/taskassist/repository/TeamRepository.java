package com.taskassist.repository;

import com.taskassist.model.Team;
import com.taskassist.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Integer> {
    
    @Query("SELECT t FROM Team t WHERE (t.userId1 = :userId1 AND t.userId2 = :userId2) OR (t.userId1 = :userId2 AND t.userId2 = :userId1)")
    Optional<Team> findTeamConnection(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2);
    
    @Query("SELECT u FROM User u WHERE u.id IN " +
           "(SELECT t.userId2 FROM Team t WHERE t.userId1 = :userId " +
           "UNION " +
           "SELECT t.userId1 FROM Team t WHERE t.userId2 = :userId)")
    List<User> findTeamMembersByUserId(@Param("userId") Integer userId);
}
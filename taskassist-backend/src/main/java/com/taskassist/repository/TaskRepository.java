package com.taskassist.repository;

import com.taskassist.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Integer> {
    
    List<Task> findByUserId(Integer userId);
    
    List<Task> findByAssignedTo(Integer assignedTo);
    
    List<Task> findByProjectId(Integer projectId);
    
    List<Task> findByTeamId(Integer teamId);
    
    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND " +
           "(:filter IS NULL OR " +
           "(:filter = 'completed' AND t.completed = true) OR " +
           "(:filter = 'pending' AND t.completed = false) OR " +
           "(:filter = 'starred' AND t.starred = true))")
    List<Task> findByUserIdAndFilter(@Param("userId") Integer userId, @Param("filter") String filter);
    
    @Query("SELECT t FROM Task t WHERE t.assignedTo = :userId AND " +
           "(:filter IS NULL OR " +
           "(:filter = 'completed' AND t.completed = true) OR " +
           "(:filter = 'pending' AND t.completed = false) OR " +
           "(:filter = 'starred' AND t.starred = true))")
    List<Task> findByAssignedToAndFilter(@Param("userId") Integer userId, @Param("filter") String filter);
    
    @Query("SELECT COUNT(t) FROM Task t")
    long countTotalTasks();
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.completed = true")
    long countCompletedTasks();
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.completed = false")
    long countPendingTasks();
}
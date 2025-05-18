package com.taskassist.service;

import com.taskassist.model.Task;
import com.taskassist.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }
    
    public List<Task> getTasksByFilter(String filter) {
        if (filter == null) {
            return taskRepository.findAll();
        }
        
        switch (filter) {
            case "completed":
                return taskRepository.findAll().stream()
                    .filter(Task::getCompleted)
                    .toList();
            case "pending":
                return taskRepository.findAll().stream()
                    .filter(task -> !task.getCompleted())
                    .toList();
            case "starred":
                return taskRepository.findAll().stream()
                    .filter(Task::getStarred)
                    .toList();
            default:
                return taskRepository.findAll();
        }
    }
    
    public Optional<Task> getTaskById(Integer id) {
        return taskRepository.findById(id);
    }
    
    public List<Task> getTasksByUserId(Integer userId, String filter) {
        return taskRepository.findByUserIdAndFilter(userId, filter);
    }
    
    public List<Task> getTasksAssignedToUser(Integer userId, String filter) {
        return taskRepository.findByAssignedToAndFilter(userId, filter);
    }
    
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }
    
    public Optional<Task> updateTask(Integer id, Task taskDetails) {
        return taskRepository.findById(id)
            .map(existingTask -> {
                // Update only non-null fields
                if (taskDetails.getTitle() != null) {
                    existingTask.setTitle(taskDetails.getTitle());
                }
                if (taskDetails.getDescription() != null) {
                    existingTask.setDescription(taskDetails.getDescription());
                }
                if (taskDetails.getCompleted() != null) {
                    existingTask.setCompleted(taskDetails.getCompleted());
                }
                if (taskDetails.getProjectId() != null) {
                    existingTask.setProjectId(taskDetails.getProjectId());
                }
                if (taskDetails.getDueDate() != null) {
                    existingTask.setDueDate(taskDetails.getDueDate());
                }
                if (taskDetails.getPriority() != null) {
                    existingTask.setPriority(taskDetails.getPriority());
                }
                if (taskDetails.getStarred() != null) {
                    existingTask.setStarred(taskDetails.getStarred());
                }
                if (taskDetails.getAssignedTo() != null) {
                    existingTask.setAssignedTo(taskDetails.getAssignedTo());
                }
                if (taskDetails.getAssignedBy() != null) {
                    existingTask.setAssignedBy(taskDetails.getAssignedBy());
                }
                if (taskDetails.getTeamId() != null) {
                    existingTask.setTeamId(taskDetails.getTeamId());
                }
                
                return taskRepository.save(existingTask);
            });
    }
    
    public boolean deleteTask(Integer id) {
        return taskRepository.findById(id)
            .map(task -> {
                taskRepository.delete(task);
                return true;
            })
            .orElse(false);
    }
    
    public Map<String, Long> getTaskSummary() {
        Map<String, Long> summary = new HashMap<>();
        summary.put("total", taskRepository.countTotalTasks());
        summary.put("completed", taskRepository.countCompletedTasks());
        summary.put("pending", taskRepository.countPendingTasks());
        return summary;
    }
}
package com.taskassist.controller;

import com.taskassist.model.Task;
import com.taskassist.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) Integer userId,
            Authentication authentication) {
        
        // If userId is provided, filter tasks by user
        if (userId != null) {
            List<Task> userTasks = taskService.getTasksByUserId(userId, filter);
            return ResponseEntity.ok(userTasks);
        }
        
        // Otherwise, return all tasks with optional filter
        List<Task> tasks = taskService.getTasksByFilter(filter);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Integer id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getTasksByUserId(
            @PathVariable Integer userId,
            @RequestParam(required = false) String filter) {
        List<Task> tasks = taskService.getTasksByUserId(userId, filter);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<Task>> getTasksAssignedToUser(
            @PathVariable Integer userId,
            @RequestParam(required = false) String filter) {
        List<Task> tasks = taskService.getTasksAssignedToUser(userId, filter);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getTaskSummary() {
        Map<String, Long> summary = taskService.getTaskSummary();
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task createdTask = taskService.createTask(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Integer id, @RequestBody Task taskDetails) {
        return taskService.updateTask(id, taskDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Integer id) {
        boolean success = taskService.deleteTask(id);
        if (success) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
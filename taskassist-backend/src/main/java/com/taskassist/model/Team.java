package com.taskassist.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "teams")
public class Team {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "user_id1", nullable = false)
    private Integer userId1;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id1", insertable = false, updatable = false)
    private User user1;
    
    @Column(name = "user_id2", nullable = false)
    private Integer userId2;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id2", insertable = false, updatable = false)
    private User user2;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
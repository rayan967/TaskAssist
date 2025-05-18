package com.taskassist.service;

import com.taskassist.model.Project;
import com.taskassist.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
    
    public Optional<Project> getProjectById(Integer id) {
        return projectRepository.findById(id);
    }
    
    public List<Project> getProjectsByUserId(Integer userId) {
        return projectRepository.findByUserId(userId);
    }
    
    public List<Project> getProjectsByUserIdOrTeamMember(Integer userId) {
        return projectRepository.findProjectsByUserIdOrTeamMember(userId);
    }
    
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }
    
    public Optional<Project> updateProject(Integer id, Project projectDetails) {
        return projectRepository.findById(id)
            .map(existingProject -> {
                // Update only non-null fields
                if (projectDetails.getName() != null) {
                    existingProject.setName(projectDetails.getName());
                }
                if (projectDetails.getColor() != null) {
                    existingProject.setColor(projectDetails.getColor());
                }
                if (projectDetails.getTeamId() != null) {
                    existingProject.setTeamId(projectDetails.getTeamId());
                }
                if (projectDetails.getIsPublic() != null) {
                    existingProject.setIsPublic(projectDetails.getIsPublic());
                }
                
                return projectRepository.save(existingProject);
            });
    }
    
    public boolean deleteProject(Integer id) {
        return projectRepository.findById(id)
            .map(project -> {
                projectRepository.delete(project);
                return true;
            })
            .orElse(false);
    }
}
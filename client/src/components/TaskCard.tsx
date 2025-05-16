import { Task, Project } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, MoreVertical, UserCircle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Hardcoded team members (in a real app, this would come from the API)
const teamMembers = [
  { id: 1, name: "John Smith", role: "Product Manager" },
  { id: 2, name: "Emily Johnson", role: "UX Designer" },
  { id: 3, name: "David Lee", role: "Developer" },
  { id: 4, name: "Lisa Chen", role: "Marketing Specialist" }
];

interface TaskCardProps {
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onEditAssigned?: (task: Task) => void; // Added for assigned tasks editing
}

export function TaskCard({ task, project, onEdit, onEditAssigned }: TaskCardProps) {
  // Find the assignee if task is assigned
  const assignee = task.assignedTo ? teamMembers.find(member => member.id === task.assignedTo) : null;
  const [isHovered, setIsHovered] = useState(false);
  
  const getTimeLabel = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    
    if (task.completed) {
      return "Completed";
    }
    
    if (dueDate < new Date()) {
      return "Overdue";
    }
    
    if (dueDate.toDateString() === new Date().toDateString()) {
      return "Today";
    }
    
    if (
      dueDate.toDateString() === 
      new Date(new Date().setDate(new Date().getDate() + 1)).toDateString()
    ) {
      return "Tomorrow";
    }
    
    return `${formatDistanceToNow(dueDate, { addSuffix: false })} left`;
  };
  
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Partial<Task>) => {
      const res = await apiRequest('PATCH', `/api/tasks/${task.id}`, updatedTask);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/summary'] });
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/summary'] });
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting task",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleToggleComplete = () => {
    updateTaskMutation.mutate({ completed: !task.completed });
  };
  
  const handleToggleStarred = () => {
    updateTaskMutation.mutate({ starred: !task.starred });
  };
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };
  
  const getBadgeStyles = () => {
    if (!project) return "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300";
    
    switch (project.name) {
      case "Personal":
        return "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300";
      case "Work":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Shopping":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300";
    }
  };
  
  return (
    <Card 
      className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className={getBadgeStyles()}>
              {project?.name || "Task"}
            </Badge>
            
            {task.assignedTo && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                <span className="flex items-center gap-1">
                  <UserCircle className="h-3 w-3" />
                  Assigned to {assignee?.name || `Member #${task.assignedTo}`}
                </span>
              </Badge>
            )}
          </div>
          <div className="flex items-center">
            <button 
              className={`transition-colors ${
                task.starred 
                  ? "text-amber-400 hover:text-amber-500" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
              onClick={handleToggleStarred}
            >
              <i className={`${task.starred ? "ri-star-fill" : "ri-star-line"} text-lg`}></i>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-2 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.assignedTo && onEditAssigned ? (
                  <DropdownMenuItem onClick={() => onEditAssigned(task)}>
                    Edit Assignment
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleToggleComplete}>
                  Mark as {task.completed ? "Active" : "Complete"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 dark:text-red-400"
                  onClick={handleDelete}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <h3 className={`text-lg font-semibold mb-2 line-clamp-2 ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : ""}`}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-3 dark:text-gray-400">
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox 
              checked={task.completed} 
              id={`task-${task.id}`} 
              onCheckedChange={handleToggleComplete}
            />
            <label 
              htmlFor={`task-${task.id}`}
              className="ml-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
            >
              Mark complete
            </label>
          </div>
          {task.dueDate && (
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <i className="ri-time-line mr-1"></i>
              {getTimeLabel()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

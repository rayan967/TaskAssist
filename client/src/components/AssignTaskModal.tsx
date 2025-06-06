import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Task, Project, insertTaskSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext.tsx";

// Schema for the form
const formSchema = insertTaskSchema.extend({
  assignedTo: z.number().optional(),
  userId: z.number().default(1),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: number;
  editingTask?: Task;
}

export function AssignTaskModal({ isOpen, onClose, memberId, editingTask }: AssignTaskModalProps) {
  const [date, setDate] = useState<Date | undefined>(
    editingTask?.dueDate ? new Date(editingTask.dueDate as any) : undefined
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id || 1;

  // Helper function to format priority consistently
  const formatPriority = (priority?: string | null): "Low" | "Medium" | "High" => {
    if (!priority) return "Medium";
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority === "low") return "Low";
    if (lowerPriority === "medium") return "Medium";
    if (lowerPriority === "high") return "High";
    return "Medium";
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: null,
      priority: "Medium",
      completed: false,
      starred: false,
      assignedTo: memberId,
      userId: currentUserId,
    }
  });

  // Update form when editingTask changes
  useEffect(() => {
    if (editingTask) {
      const priority = formatPriority(editingTask.priority);
      
      if (editingTask.dueDate) {
        setDate(new Date(editingTask.dueDate as any));
      }
      
      form.reset({
        title: editingTask.title,
        description: editingTask.description || "",
        projectId: editingTask.projectId || null,
        priority: priority,
        completed: editingTask.completed || false,
        starred: editingTask.starred || false,
        assignedTo: editingTask.assignedTo as number | undefined || memberId,
        userId: editingTask.userId || currentUserId,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        projectId: null,
        priority: "Medium",
        completed: false,
        starred: false,
        assignedTo: memberId,
        userId: currentUserId,
      });
    }
  }, [editingTask, form, memberId, currentUserId]);

  // Ensure memberId is set in the form if provided
  useEffect(() => {
    if (memberId) {
      form.setValue('assignedTo', memberId);
    }
  }, [memberId, form]);

  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch team members (connections)
  const { data: teamMembersData = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ['/api/team-members', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/team-members/${currentUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return response.json();
    },
  });

  // Format team members for display
  const teamMembers = teamMembersData.map((data: any) => {
    const userData = data.user;
    return {
      id: userData.id,
      name: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.username,
    };
  });

  // Create new task mutation
  const createMutation = useMutation({
    mutationFn: async (newTask: FormValues) => {
      if (date) {
        newTask.dueDate = date as any;
      }

      newTask.assignedBy = currentUserId;
      
      return await apiRequest({
        method: 'POST',
        url: '/api/tasks',
        data: newTask
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/summary'] });
      toast({
        title: "Task assigned successfully",
        description: "The task has been assigned to the team member.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to assign task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedTask: FormValues) => {
      if (!editingTask) return null;

      if (date) {
        updatedTask.dueDate = date as any;
      }

      if (updatedTask.assignedTo !== editingTask.assignedTo) {
        updatedTask.assignedBy = currentUserId;
      }

      return await apiRequest({
        method: 'PATCH',
        url: `/api/tasks/${editingTask.id}`,
        data: updatedTask
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/summary'] });
      toast({
        title: "Task updated successfully",
        description: "The task has been updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (editingTask) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit Task" : "Assign New Task"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description" 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : null)} 
                      value={field.value ? String(field.value) : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormItem className="flex flex-col gap-1">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-full"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingTeamMembers ? (
                          <SelectItem value="loading">Loading contacts...</SelectItem>
                        ) : teamMembers.length > 0 ? (
                          teamMembers.map((member) => (
                            <SelectItem key={member.id} value={String(member.id)}>
                              {member.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">No contacts found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTask ? "Update Task" : "Assign Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
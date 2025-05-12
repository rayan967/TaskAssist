import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { insertTaskSchema, Task } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: Task;
}

const formSchema = insertTaskSchema.extend({
  dueDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddTaskModal({ isOpen, onClose, editingTask }: AddTaskModalProps) {
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingTask?.title || "",
      description: editingTask?.description || "",
      projectId: editingTask?.projectId || 1,
      priority: editingTask?.priority || "medium",
      dueDate: editingTask?.dueDate ? new Date(editingTask.dueDate) : undefined,
      completed: editingTask?.completed || false,
      starred: editingTask?.starred || false,
    },
  });
  
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: FormValues) => {
      const res = await apiRequest('POST', '/api/tasks', newTask);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/summary'] });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating task",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: FormValues) => {
      if (!editingTask) return null;
      
      const res = await apiRequest('PATCH', `/api/tasks/${editingTask.id}`, updatedTask);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/summary'] });
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    if (editingTask) {
      updateTaskMutation.mutate(values);
    } else {
      createTaskMutation.mutate(values);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Textarea placeholder="Enter task details" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <FormItem className="flex items-center justify-center space-y-0 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <FormControl>
                          <RadioGroupItem value="low" className="sr-only" />
                        </FormControl>
                        <span className="text-sm font-medium mr-2">Low</span>
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      </FormItem>
                      <FormItem className="flex items-center justify-center space-y-0 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <FormControl>
                          <RadioGroupItem value="medium" className="sr-only" />
                        </FormControl>
                        <span className="text-sm font-medium mr-2">Medium</span>
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      </FormItem>
                      <FormItem className="flex items-center justify-center space-y-0 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <FormControl>
                          <RadioGroupItem value="high" className="sr-only" />
                        </FormControl>
                        <span className="text-sm font-medium mr-2">High</span>
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                {editingTask ? "Update Task" : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

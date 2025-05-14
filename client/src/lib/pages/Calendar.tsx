import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, parseISO, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task, Project } from "@shared/schema";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { AddTaskModal } from "@/components/AddTaskModal";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Get tasks and projects data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Calculate days for the current month
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Format date to display
  const formatDate = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };
  
  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate as unknown as string);
      return isSameDay(taskDate, day);
    });
  };

  // Get project by id
  const getProjectById = (projectId?: number | null) => {
    if (!projectId) return undefined;
    return projects.find((project: Project) => project.id === projectId);
  };
  
  // Handle day click
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };
  
  // Handle add task
  const handleAddTask = () => {
    setEditingTask(undefined);
    setShowAddTaskModal(true);
  };
  
  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddTaskModal(true);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setShowAddTaskModal(false);
    setEditingTask(undefined);
  };
  
  return (
    <>
      <div className="mb-8 mt-6">
        <h2 className="text-2xl font-bold mb-2">Tasks Calendar</h2>
        <p className="text-gray-500 dark:text-gray-400">
          View and manage your tasks in a calendar view
        </p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button size="sm" variant="outline" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week days header */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div 
                key={day} 
                className="text-center font-medium py-2 text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, i) => {
              const dayTasks = getTasksForDay(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              
              return (
                <div
                  key={i}
                  className={`
                    min-h-[100px] border rounded-md p-1.5 transition-colors cursor-pointer
                    ${isToday(day) ? 'border-primary-500 dark:border-primary-400' : 'border-gray-200 dark:border-gray-700'}
                    ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-800
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div 
                      className={`
                        h-6 w-6 rounded-full flex items-center justify-center text-sm
                        ${isToday(day) ? 'bg-primary-500 text-white' : ''}
                      `}
                    >
                      {format(day, "d")}
                    </div>
                    
                    {dayTasks.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {dayTasks.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Task list for the day */}
                  <div className="space-y-1 mt-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const project = getProjectById(task.projectId);
                      
                      return (
                        <div 
                          key={task.id}
                          className={`
                            text-xs px-1.5 py-0.5 rounded truncate cursor-pointer
                            ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}
                          `}
                          style={{ 
                            backgroundColor: project ? `${project.color}20` : 'rgba(var(--primary-50))',
                            borderLeft: `2px solid ${project ? project.color : 'var(--primary-500)'}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Selected date tasks */}
      {selectedDate && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Tasks for {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              <Button size="sm" onClick={handleAddTask}>
                Add Task
              </Button>
            </div>
            
            <div className="space-y-3">
              {getTasksForDay(selectedDate).length > 0 ? (
                getTasksForDay(selectedDate).map((task) => {
                  const project = getProjectById(task.projectId);
                  
                  return (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700">
                          <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          {project && (
                            <div className="flex items-center mt-1">
                              <span 
                                className="w-2 h-2 rounded-full mr-1.5" 
                                style={{ backgroundColor: project.color }}
                              ></span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {project.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {task.priority && (
                          <Badge 
                            variant={
                              task.priority === "High" 
                                ? "destructive" 
                                : task.priority === "Medium" 
                                  ? "default" 
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No tasks scheduled for this date.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add/Edit Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={handleCloseModal}
        editingTask={editingTask}
      />
    </>
  );
}
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { StatusCard } from "@/components/StatusCard";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";
import { AssignTaskModal } from "@/components/AssignTaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ListChecks, CheckCircle, Clock, PlusIcon, Search, CalendarIcon, 
  ArrowUpDown, ArrowUp, ArrowDown, Filter
} from "lucide-react";
import { Task, Project, TaskSummary } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Task sort type
type SortOption = "title" | "dueDate" | "priority" | "none";
type SortDirection = "asc" | "desc";

export default function Dashboard({ path }: { path?: string }) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Extract project ID from path if available
  useEffect(() => {
    if (path && path.startsWith('/dashboard/')) {
      const projectId = path.split('/').pop();
      if (projectId && !isNaN(parseInt(projectId))) {
        setSelectedProject(projectId);
      }
    }
  }, [path]);
  // To filter by assignment - added for showing only my tasks or assigned tasks
  const [assignmentFilter, setAssignmentFilter] = useState<string>("my");
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  
  // Date filtering
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  
  // Listen for custom events from sidebar
  useEffect(() => {
    // Handle project filtering from sidebar
    const handleFilterByProject = (event: CustomEvent) => {
      const { projectId } = event.detail;
      setSelectedProject(projectId.toString());
    };
    
    // Handle opening add task modal from sidebar
    const handleOpenAddTaskModal = () => {
      setShowAddTaskModal(true);
    };
    
    // Add event listeners
    window.addEventListener('filterByProject', handleFilterByProject as EventListener);
    window.addEventListener('openAddTaskModal', handleOpenAddTaskModal);
    
    // Cleanup
    return () => {
      window.removeEventListener('filterByProject', handleFilterByProject as EventListener);
      window.removeEventListener('openAddTaskModal', handleOpenAddTaskModal);
    };
  }, []);
  
  // Get current user from auth context
  const { user } = useAuth();
  console.log(user)
  const currentUserId = user?.id || 1; // Default to 1 if not authenticated
  console.log(currentUserId)

  // Fetch tasks - using the new API that returns tasks where user is creator, assignee, or assigner
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', { userId: currentUserId }],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?userId=${currentUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });
  
  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Fetch task summary
  const { data: taskSummary = { total: 0, completed: 0, pending: 0 } } = useQuery<TaskSummary>({
    queryKey: ['/api/tasks/summary'],
  });
  
  // Filter and sort tasks
  const processedTasks = () => {
    // First filter
    let result = tasks.filter((task: Task) => {
      // Filter by status
      if (activeFilter === "active" && task.completed) return false;
      if (activeFilter === "completed" && !task.completed) return false;

      // currentUserId comes from auth context
      const isMyTask = (
          task.userId === currentUserId &&
          !task.assignedTo &&
          !task.assignedBy
      );

      const isAssignedTask = (
          task.assignedTo === currentUserId ||
          task.assignedBy === currentUserId
      );

      // Filtering logic
      if (assignmentFilter === "my" && !isMyTask) return false;
      if (assignmentFilter === "assigned" && !isAssignedTask) return false;
      
      // Filter by search query
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by project
      if (selectedProject && task.projectId !== parseInt(selectedProject)) {
        return false;
      }
      
      // Filter by priority
      if (priorityFilter && task.priority !== priorityFilter) {
        return false;
      }
      
      // Filter by date range
      if (dateRange.from && task.dueDate) {
        const taskDate = new Date(task.dueDate);
        if (taskDate < dateRange.from) return false;
      }
      
      if (dateRange.to && task.dueDate) {
        const taskDate = new Date(task.dueDate);
        if (taskDate > dateRange.to) return false;
      }
    
      return true;
    });
    
    // Then sort
    if (sortBy !== "none") {
      result.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "priority":
            const priorityOrder = { "High": 3, "Medium": 2, "Low": 1, null: 0 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            comparison = aPriority - bPriority;
            break;
          case "dueDate":
            if (!a.dueDate && !b.dueDate) comparison = 0;
            else if (!a.dueDate) comparison = 1;
            else if (!b.dueDate) comparison = -1;
            else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            break;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    return result;
  };
  
  // Get filtered and sorted tasks
  const filteredTasks = processedTasks();
  
  // Toggle sort direction
  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("asc");
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
    setSelectedProject(null);
    setPriorityFilter(null);
    setDateRange({});
    setSortBy("none");
    setAssignmentFilter("my");
  };
  
  const handleAddTask = () => {
    setEditingTask(undefined);
    setShowAddTaskModal(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddTaskModal(true);
  };

  const handleEditAssignedTask = (task: Task) => {
    setEditingTask(task);
    setShowAssignTaskModal(true);
  };
  
  const handleCloseModal = () => {
    setShowAddTaskModal(false);
    setShowAssignTaskModal(false);
    setEditingTask(undefined);
  };
  
  const getProjectById = (projectId?: number | null) => {
    if (!projectId) return undefined;
    return projects.find((project: Project) => project.id === projectId);
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) return "Select dates";
    
    let result = "";
    if (dateRange.from) result += format(dateRange.from, "MMM d, yyyy");
    if (dateRange.from && dateRange.to) result += " - ";
    if (dateRange.to) result += format(dateRange.to, "MMM d, yyyy");
    
    return result;
  };
  
  return (
    <>
      {/* Main header */}
      <div className="mb-10 mt-4 py-2">
        <h2 className="text-2xl font-bold mb-2 w-full">Tasks Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 w-full max-w-2xl">
          Manage and organize your tasks efficiently
        </p>
      </div>

      {/* Task status summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard
          title="Total Tasks"
          value={taskSummary.total}
          icon={<ListChecks className="h-5 w-5 text-primary-500" />}
          iconClassName="bg-primary-50 dark:bg-primary-900/20"
          changePercentage={8}
          changeText="vs last week"
        />
        
        <StatusCard
          title="Completed"
          value={taskSummary.completed}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          iconClassName="bg-green-50 dark:bg-green-900/20"
          changePercentage={12}
          changeText="vs last week"
        />
        
        <StatusCard
          title="Pending"
          value={taskSummary.pending}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          iconClassName="bg-amber-50 dark:bg-amber-900/20"
          changePercentage={2}
          changeText="vs last week"
        />
      </div>

      {/* Task filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg dark:bg-gray-700">
            <Button
              variant={activeFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter !== "all" ? "text-gray-600 dark:text-gray-300" : ""}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("active")}
              className={activeFilter !== "active" ? "text-gray-600 dark:text-gray-300" : ""}
            >
              Active
            </Button>
            <Button
              variant={activeFilter === "completed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("completed")}
              className={activeFilter !== "completed" ? "text-gray-600 dark:text-gray-300" : ""}
            >
              Completed
            </Button>
          </div>
          
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg dark:bg-gray-700">
            <Button
              variant={assignmentFilter === "my" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAssignmentFilter("my")}
              className={assignmentFilter !== "my" ? "text-gray-600 dark:text-gray-300" : ""}
            >
              My Tasks
            </Button>
            <Button
              variant={assignmentFilter === "assigned" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAssignmentFilter("assigned")}
              className={assignmentFilter !== "assigned" ? "text-gray-600 dark:text-gray-300" : ""}
            >
              Assigned Tasks
            </Button>
            <Button
              variant={assignmentFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAssignmentFilter("all")}
              className={assignmentFilter !== "all" ? "text-gray-600 dark:text-gray-300" : ""}
            >
              All Tasks
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-60">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(priorityFilter || Object.keys(dateRange).length > 0 || selectedProject) && (
                  <span className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 text-xs px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Tasks</h4>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Project</p>
                  <Select
                    value={selectedProject || "all"}
                    onValueChange={(value) => setSelectedProject(value !== "all" ? value : null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project: Project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Priority</p>
                  <Select
                    value={priorityFilter || "any"}
                    onValueChange={(value) => setPriorityFilter(value !== "any" ? value : null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Priority</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Due Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateRange()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Button onClick={resetFilters} variant="secondary" size="sm" className="w-full">
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={() => setSortBy(sortBy === "none" ? "dueDate" : "none")} size="sm" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sort
            {sortBy !== "none" && (
              <span className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 text-xs px-1.5 py-0.5 rounded-full">
                {sortBy}
              </span>
            )}
          </Button>
          
          {sortBy !== "none" && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSort("title")}
                className={`${sortBy === "title" ? "bg-white dark:bg-gray-600" : ""} py-1 px-2 text-xs h-auto rounded-none`}
              >
                Title {sortBy === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSort("dueDate")}
                className={`${sortBy === "dueDate" ? "bg-white dark:bg-gray-600" : ""} py-1 px-2 text-xs h-auto rounded-none`}
              >
                Date {sortBy === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSort("priority")}
                className={`${sortBy === "priority" ? "bg-white dark:bg-gray-600" : ""} py-1 px-2 text-xs h-auto rounded-none`}
              >
                Priority {sortBy === "priority" && (sortDirection === "asc" ? "↑" : "↓")}
              </Button>
            </div>
          )}
          
          <Button onClick={handleAddTask} className="ml-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {tasksLoading ? (
          // Loading state
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 animate-pulse h-48 rounded-xl"></div>
          ))
        ) : filteredTasks.length > 0 ? (
          // Show tasks
          filteredTasks.map((task: Task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              project={getProjectById(task.projectId)}
              onEdit={handleEditTask}
              onEditAssigned={handleEditAssignedTask}
            />
          ))
        ) : (
          // Show empty state
          <div className="col-span-full text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 dark:bg-gray-800">
              <i className="ri-clipboard-line text-2xl text-gray-500"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6 dark:text-gray-400">
              {searchQuery || selectedProject || activeFilter !== "all"
                ? "No tasks match your current filters. Try changing your search criteria."
                : "You don't have any tasks yet. Create your first task to get started."}
            </p>
            <Button onClick={handleAddTask}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <Button
        onClick={handleAddTask}
        className="fixed right-6 bottom-6 p-4 rounded-full shadow-lg h-14 w-14"
        size="icon"
      >
        <PlusIcon className="h-6 w-6" />
      </Button>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={handleCloseModal}
        editingTask={editingTask}
      />
      
      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={showAssignTaskModal}
        onClose={handleCloseModal}
        editingTask={editingTask}
      />
    </>
  );
}
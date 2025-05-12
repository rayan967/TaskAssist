import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatusCard } from "@/components/StatusCard";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, CheckCircle, Clock, PlusIcon, Search } from "lucide-react";
import { Task, Project, TaskSummary } from "@shared/schema";

export default function Dashboard() {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Fetch task summary
  const { data: taskSummary = { total: 0, completed: 0, pending: 0 } } = useQuery<TaskSummary>({
    queryKey: ['/api/tasks/summary'],
  });
  
  // Filter tasks based on active filter, search query, and selected project
  const filteredTasks = tasks.filter((task: Task) => {
    // Filter by status
    if (activeFilter === "active" && task.completed) return false;
    if (activeFilter === "completed" && !task.completed) return false;
    
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by project
    if (selectedProject && task.projectId !== parseInt(selectedProject)) {
      return false;
    }
    
    return true;
  });
  
  const handleAddTask = () => {
    setEditingTask(undefined);
    setShowAddTaskModal(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddTaskModal(true);
  };
  
  const handleCloseModal = () => {
    setShowAddTaskModal(false);
    setEditingTask(undefined);
  };
  
  const getProjectById = (projectId?: number | null) => {
    if (!projectId) return undefined;
    return projects.find((project: Project) => project.id === projectId);
  };
  
  return (
    <>
      {/* Main header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Tasks Dashboard</h2>
        <p className="text-gray-500 mt-1 dark:text-gray-400">Manage and organize your tasks efficiently</p>
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10 pr-4 w-full max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            onValueChange={(value) => setSelectedProject(value === "all" ? null : value)}
            value={selectedProject || "all"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: Project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasksLoading ? (
          // Show skeleton loaders when loading
          Array.from({ length: 6 }).map((_, i) => (
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
    </>
  );
}

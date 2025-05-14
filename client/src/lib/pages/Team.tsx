import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  PlusIcon,
  User,
  Users,
  CheckCircle2,
} from "lucide-react";
import { User as UserType, Task, Project } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { AddTaskModal } from "@/components/AddTaskModal";
import { AssignTaskModal } from "@/components/AssignTaskModal";

// Mock team members (in a real app this would be fetched from the backend)
const teamMembers = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Project Manager",
    email: "alex@example.com",
    avatar: "",
    tasksCompleted: 24,
    tasksAssigned: 32,
    phone: "(555) 123-4567",
    availability: "Available",
  },
  {
    id: 2,
    name: "Sarah Williams",
    role: "UI/UX Designer",
    email: "sarah@example.com",
    avatar: "",
    tasksCompleted: 18,
    tasksAssigned: 23,
    phone: "(555) 234-5678",
    availability: "In a meeting",
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "Developer",
    email: "michael@example.com",
    avatar: "",
    tasksCompleted: 45,
    tasksAssigned: 50,
    phone: "(555) 345-6789",
    availability: "Away",
  },
  {
    id: 4,
    name: "Jessica Lee",
    role: "QA Engineer",
    email: "jessica@example.com",
    avatar: "",
    tasksCompleted: 31,
    tasksAssigned: 38,
    phone: "(555) 456-7890",
    availability: "Available",
  },
  {
    id: 5,
    name: "David Kim",
    role: "Backend Developer",
    email: "david@example.com",
    avatar: "",
    tasksCompleted: 27,
    tasksAssigned: 35,
    phone: "(555) 567-8901",
    availability: "Do not disturb",
  }
];

export default function Team() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Fetch tasks and projects data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Get tasks stats
  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      completionRate: Math.round(completionRate)
    };
  };
  
  // Get project stats
  const getProjectStats = () => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(task => task.completed).length;
      
      return {
        ...project,
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    });
  };
  
  const taskStats = getTaskStats();
  const projectStats = getProjectStats();
  
  // Get member by id
  const getMemberById = (id: number) => {
    return teamMembers.find(member => member.id === id);
  };
  
  // Get tasks assigned to member
  const getTasksForMember = (memberId: number) => {
    return tasks.filter(task => task.assignedTo === memberId);
  };
  
  // Handle view member details
  const handleViewMember = (id: number) => {
    setSelectedMember(id);
    setActiveTab("details");
  };
  
  // Handle assign task
  const handleAssignTask = (memberId?: number) => {
    setEditingTask(undefined);
    setSelectedMember(memberId || null);
    setShowTaskModal(true);
  };
  
  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setShowTaskModal(false);
    setEditingTask(undefined);
  };
  
  return (
    <>
      <div className="mb-8 mt-6">
        <h2 className="text-2xl font-bold mb-2">Team Management</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your team and track progress on tasks and projects
        </p>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedMember}>
            Member Details
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-2xl font-bold">{teamMembers.length}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasks Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{taskStats.completionRate}%</span>
                    <Badge variant={taskStats.completionRate > 75 ? "default" : "secondary"}>
                      {taskStats.completed} / {taskStats.total}
                    </Badge>
                  </div>
                  <Progress value={taskStats.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-2xl font-bold">{projects.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.length > 0 ? (
                    projectStats.map((project) => (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: project.color }}
                            ></span>
                            <span className="font-medium">{project.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {project.completedTasks}/{project.totalTasks} tasks
                          </span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No projects found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("members")}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.slice(0, 4).map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md"
                      onClick={() => handleViewMember(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <div>
                        <Badge 
                          variant={
                            member.availability === "Available" 
                              ? "default" 
                              : member.availability === "Away" || member.availability === "In a meeting"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {member.availability}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Team Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <Card 
                    key={member.id}
                    className="cursor-pointer hover:border-primary-500 transition-colors"
                    onClick={() => handleViewMember(member.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-4">
                          <AvatarFallback className="text-xl">{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-3">{member.role}</p>
                        <Badge 
                          variant={
                            member.availability === "Available" 
                              ? "default" 
                              : member.availability === "Away" || member.availability === "In a meeting"
                                ? "secondary"
                                : "outline"
                          }
                          className="mb-4"
                        >
                          {member.availability}
                        </Badge>
                        
                        <div className="w-full space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Tasks Progress</span>
                            <span>{member.tasksCompleted}/{member.tasksAssigned}</span>
                          </div>
                          <Progress 
                            value={(member.tasksCompleted / member.tasksAssigned) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <Button variant="outline" className="w-full" onClick={() => handleViewMember(member.id)}>
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Member Details Tab */}
        <TabsContent value="details">
          {selectedMember && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarFallback className="text-2xl">
                        {getMemberById(selectedMember)?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-xl mb-1">{getMemberById(selectedMember)?.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{getMemberById(selectedMember)?.role}</p>
                    
                    <Badge 
                      variant={
                        getMemberById(selectedMember)?.availability === "Available" 
                          ? "default" 
                          : getMemberById(selectedMember)?.availability === "Away" || getMemberById(selectedMember)?.availability === "In a meeting"
                            ? "secondary"
                            : "outline"
                      }
                      className="mb-6"
                    >
                      {getMemberById(selectedMember)?.availability}
                    </Badge>
                    
                    <div className="w-full space-y-4">
                      <div className="flex items-center text-sm space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{getMemberById(selectedMember)?.email}</span>
                      </div>
                      
                      <div className="flex items-center text-sm space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{getMemberById(selectedMember)?.phone}</span>
                      </div>
                      
                      <Button className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tasks Completion</span>
                        <span>
                          {getMemberById(selectedMember)?.tasksCompleted}/{getMemberById(selectedMember)?.tasksAssigned}
                        </span>
                      </div>
                      <Progress 
                        value={(getMemberById(selectedMember)?.tasksCompleted! / getMemberById(selectedMember)?.tasksAssigned!) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Completed Tasks</h4>
                            <p className="text-2xl font-bold">{getMemberById(selectedMember)?.tasksCompleted}</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center">
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Assigned Tasks</h4>
                            <p className="text-2xl font-bold">{getMemberById(selectedMember)?.tasksAssigned}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Recent Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-full">
                            <CheckCircleIcon className="h-5 w-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium">Completed task "Update dashboard UI"</p>
                            <p className="text-sm text-gray-500">2 hours ago</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-full">
                            <Calendar className="h-5 w-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium">Scheduled meeting with Design team</p>
                            <p className="text-sm text-gray-500">Yesterday at 3:30 PM</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-full">
                            <MessageSquare className="h-5 w-5 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium">Commented on "API Integration Plan"</p>
                            <p className="text-sm text-gray-500">2 days ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

// CheckCircle icon component (since it's not directly imported)
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
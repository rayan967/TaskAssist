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
import { AddFriendModal } from "@/components/AddFriendModal";
import { useAuth } from "@/contexts/AuthContext";

export default function Friends() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const { user } = useAuth();
  
  // Fetch tasks and projects data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch friends data
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: [`/api/friends/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch(`/api/friends/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      return response.json();
    },
    enabled: !!user?.id
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
  
  // Get friend by id
  const getFriendById = (id: number) => {
    return friends.find(friend => friend.friendId === id);
  };
  
  // Get tasks assigned to friend
  const getTasksForFriend = (friendId: number) => {
    return tasks.filter(task => task.assignedTo === friendId);
  };
  
  // Handle view friend details
  const handleViewFriend = (id: number) => {
    setSelectedFriend(id);
    setActiveTab("details");
  };
  
  // Handle assign task
  const handleAssignTask = (friendId?: number) => {
    setEditingTask(undefined);
    setSelectedFriend(friendId || null);
    setShowTaskModal(true);
  };
  
  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };
  
  // Close modals
  const handleCloseModal = () => {
    setShowTaskModal(false);
    setShowAddFriendModal(false);
    setEditingTask(undefined);
  };
  
  // Handle adding a new friend
  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };
  
  return (
    <>
      <div className="mb-8 mt-6">
        <h2 className="text-2xl font-bold mb-2">Friends</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your friends list and collaborate on tasks together
        </p>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="friends">Friend List</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedFriend}>
            Friend Details
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Friends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-2xl font-bold">{friends.length}</span>
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
                <CardTitle>Friends</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("friends")}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {loadingFriends ? (
                  <div className="text-center py-6 text-gray-500">Loading friends...</div>
                ) : friends.length > 0 ? (
                  <div className="space-y-4">
                    {friends.slice(0, 4).map((friend) => (
                      <div 
                        key={friend.id}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md"
                        onClick={() => handleViewFriend(friend.friendId)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{friend.username?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {friend.firstName && friend.lastName
                                ? `${friend.firstName} ${friend.lastName}`
                                : friend.username}
                            </p>
                            <p className="text-sm text-gray-500">{friend.email}</p>
                          </div>
                        </div>
                        <div>
                          <Badge 
                            variant={
                              friend.availability === "Available" 
                                ? "default" 
                                : friend.availability === "Away" || friend.availability === "In a meeting"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {friend.availability || "Available"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No friends found. Add friends to start collaborating!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Friends Tab */}
        <TabsContent value="friends">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Friend List</CardTitle>
              <Button size="sm" onClick={handleAddFriend}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </CardHeader>
            <CardContent>
              {loadingFriends ? (
                <div className="text-center py-6 text-gray-500">Loading friends...</div>
              ) : friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.map((friend) => (
                    <Card 
                      key={friend.id}
                      className="cursor-pointer hover:border-primary-500 transition-colors"
                      onClick={() => handleViewFriend(friend.friendId)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <Avatar className="h-20 w-20 mb-4">
                            <AvatarFallback className="text-xl">
                              {friend.firstName?.charAt(0) || friend.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-bold text-lg mb-1">
                            {friend.firstName && friend.lastName
                              ? `${friend.firstName} ${friend.lastName}`
                              : friend.username}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-3">{friend.email}</p>
                          <Badge 
                            variant={
                              friend.availability === "Available" 
                                ? "default" 
                                : friend.availability === "Away" || friend.availability === "In a meeting"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="mb-4"
                          >
                            {friend.availability || "Available"}
                          </Badge>
                          
                          <div className="w-full space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Tasks Progress</span>
                              <span>{friend.tasksCompleted || 0}/{friend.tasksAssigned || 0}</span>
                            </div>
                            <Progress 
                              value={friend.tasksAssigned ? (friend.tasksCompleted / friend.tasksAssigned) * 100 : 0} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex gap-2 w-full">
                            <Button variant="outline" className="flex-1" onClick={() => handleViewFriend(friend.friendId)}>
                              View Profile
                            </Button>
                            <Button 
                              variant="default" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignTask(friend.friendId);
                              }}
                            >
                              Assign Task
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No friends yet</h3>
                  <p className="text-gray-500 mb-4">Add friends to start collaborating on tasks.</p>
                  <Button onClick={handleAddFriend}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Friend Details Tab */}
        <TabsContent value="details">
          {selectedFriend && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardContent className="p-6">
                  {getFriendById(selectedFriend) && (
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback className="text-2xl">
                          {getFriendById(selectedFriend)?.firstName?.charAt(0) || 
                           getFriendById(selectedFriend)?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-xl mb-1">
                        {getFriendById(selectedFriend)?.firstName && getFriendById(selectedFriend)?.lastName
                          ? `${getFriendById(selectedFriend)?.firstName} ${getFriendById(selectedFriend)?.lastName}`
                          : getFriendById(selectedFriend)?.username}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">{getFriendById(selectedFriend)?.email}</p>
                      
                      <Badge 
                        variant={
                          getFriendById(selectedFriend)?.availability === "Available" 
                            ? "default" 
                            : getFriendById(selectedFriend)?.availability === "Away" || getFriendById(selectedFriend)?.availability === "In a meeting"
                              ? "secondary"
                              : "outline"
                        }
                        className="mb-6"
                      >
                        {getFriendById(selectedFriend)?.availability || "Available"}
                      </Badge>
                      
                      <div className="w-full space-y-4">
                        <div className="flex items-center text-sm space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{getFriendById(selectedFriend)?.email}</span>
                        </div>
                        
                        <Button className="w-full">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleAssignTask(selectedFriend)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Assign Task
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Assigned Tasks</CardTitle>
                  <Button size="sm" onClick={() => handleAssignTask(selectedFriend)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Assign Task
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getTasksForFriend(selectedFriend).length > 0 ? (
                      getTasksForFriend(selectedFriend).map((task) => {
                        const taskProject = projects.find(p => p.id === task.projectId);
                        
                        return (
                          <div 
                            key={task.id}
                            className="border rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer"
                            onClick={() => handleEditTask(task)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center mb-2">
                                  {task.completed && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                  )}
                                  <h4 className="font-medium">{task.title}</h4>
                                </div>
                                
                                {task.description && (
                                  <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-2">
                                  {taskProject && (
                                    <Badge 
                                      className="text-xs" 
                                      style={{ 
                                        backgroundColor: taskProject.color,
                                        color: 'white' 
                                      }}
                                    >
                                      {taskProject.name}
                                    </Badge>
                                  )}
                                  
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
                              
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {task.dueDate ? (
                                  new Date(task.dueDate).toLocaleDateString()
                                ) : (
                                  "No deadline"
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10">
                        <Calendar className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No tasks assigned</h3>
                        <p className="text-gray-500 mb-4">This friend doesn't have any assigned tasks yet.</p>
                        <Button onClick={() => handleAssignTask(selectedFriend)}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Assign Task
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {showTaskModal && (
        <AssignTaskModal
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          memberId={selectedFriend || undefined}
          editingTask={editingTask}
        />
      )}
      
      {showAddFriendModal && (
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={handleCloseModal}
          userId={user?.id || 0}
        />
      )}
    </>
  );
}
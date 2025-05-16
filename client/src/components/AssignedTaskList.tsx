import { useQuery } from "@tanstack/react-query";
import { Task, User } from "@shared/schema";
import { TaskCard } from "@/components/TaskCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssignedTask extends Task {
  assignedBy?: User;
}

export function AssignedTaskList({ onEdit }: { onEdit: (task: Task) => void }) {
  const { isAuthenticated } = useAuth();

  // Fetch tasks assigned to the current user
  const { 
    data: assignedToMe = [], 
    isLoading: loadingAssignedToMe,
    error: errorAssignedToMe 
  } = useQuery<Task[]>({
    queryKey: ['/api/tasks/assigned-to-me'],
    enabled: isAuthenticated,
  });

  // Fetch tasks the user has assigned to others
  const { 
    data: assignedByMe = [], 
    isLoading: loadingAssignedByMe,
    error: errorAssignedByMe 
  } = useQuery<Task[]>({
    queryKey: ['/api/tasks/assigned-by-me'],
    enabled: isAuthenticated,
  });

  // Fetch user data to show who assigned the task
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && (assignedToMe.length > 0 || assignedByMe.length > 0),
  });

  // Enrich tasks with user data
  const enhancedAssignedToMe: AssignedTask[] = assignedToMe.map(task => {
    const assignedBy = users.find(user => user.id === task.userId);
    return { ...task, assignedBy };
  });

  const enhancedAssignedByMe: AssignedTask[] = assignedByMe.map(task => {
    const assignedTo = users.find(user => user.id === task.assignedTo);
    return { ...task, assignedTo };
  });

  if (!isAuthenticated) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to be logged in to view assigned tasks.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assigned-to-me" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="assigned-to-me">
              Assigned to Me 
              {enhancedAssignedToMe.length > 0 && 
                <Badge variant="secondary" className="ml-2">{enhancedAssignedToMe.length}</Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="assigned-by-me">
              Assigned by Me
              {enhancedAssignedByMe.length > 0 && 
                <Badge variant="secondary" className="ml-2">{enhancedAssignedByMe.length}</Badge>
              }
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned-to-me" className="space-y-4">
            {loadingAssignedToMe ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : errorAssignedToMe ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading assigned tasks.
                </AlertDescription>
              </Alert>
            ) : enhancedAssignedToMe.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No tasks assigned to you yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {enhancedAssignedToMe.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={onEdit}
                    assignedByUser={task.assignedBy}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assigned-by-me" className="space-y-4">
            {loadingAssignedByMe ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : errorAssignedByMe ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading tasks you've assigned.
                </AlertDescription>
              </Alert>
            ) : enhancedAssignedByMe.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                You haven't assigned any tasks yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {enhancedAssignedByMe.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={onEdit}
                    assignedToUser={task.assignedTo}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, X } from "lucide-react";
import { User } from "@shared/schema";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
}

export function AddTeamMemberModal({ isOpen, onClose, teamId }: AddTeamMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users that can be added to the team
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest({
        url: `/api/teams/${teamId}/members`,
        method: "POST",
        data: { userId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    }
  });

  // Handle adding a team member
  const handleAddMember = () => {
    if (selectedUser) {
      addMemberMutation.mutate(selectedUser.id);
    }
  };

  // Clear selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedUser(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search users by name, email, or username..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {selectedUser ? (
            <div className="border rounded-md p-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={selectedUser.profileImageUrl || ""} />
                  <AvatarFallback>
                    {selectedUser.firstName?.charAt(0) || selectedUser.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.username}
                  </p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedUser(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border rounded-md divide-y max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading users...
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className="p-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <Avatar>
                      <AvatarImage src={user.profileImageUrl || ""} />
                      <AvatarFallback>
                        {user.firstName?.charAt(0) || user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? "No users found matching your search" : "No users available"}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAddMember}
            disabled={!selectedUser || addMemberMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add to Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
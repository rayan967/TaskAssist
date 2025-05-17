import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number; // The current user who's adding a friend
}

export function AddFriendModal({ isOpen, onClose, userId }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch users based on search query
  const { data: searchResults = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      return response.json();
    },
    enabled: searchQuery.length >= 2
  });

  // Mutation to add user as friend
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user to your friend list');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friends/${userId}`] });
      toast({
        title: "Friend added",
        description: "The user has been successfully added to your friend list.",
      });
      onClose();
      setSelectedUser(null);
      setSearchQuery("");
    },
    onError: (error) => {
      toast({
        title: "Failed to add friend",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleAddFriend = () => {
    if (selectedUser) {
      addFriendMutation.mutate(selectedUser.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search for users by name or email"
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          {searchQuery.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-52 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.firstName?.[0] || user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </p>
                          <p className="text-sm text-gray-500">{user.email || user.username}</p>
                        </div>
                      </div>
                      
                      {selectedUser?.id === user.id && (
                        <Badge>Selected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
          
          {selectedUser && (
            <Card className="p-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedUser.firstName?.[0] || selectedUser.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.username}
                    </p>
                    <p className="text-sm text-gray-500">{selectedUser.email || selectedUser.username}</p>
                  </div>
                </div>
                <Badge>Selected</Badge>
              </div>
            </Card>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddFriend} 
            disabled={!selectedUser || addFriendMutation.isPending}
          >
            {addFriendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : "Add Friend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
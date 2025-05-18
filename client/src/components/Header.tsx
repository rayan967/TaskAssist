import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sun, Moon, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ sidebarOpen, toggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check current DOM state on mount
    const darkModeActive = document.documentElement.classList.contains('dark');
    setIsDarkMode(darkModeActive);
  }, []);
  
  // Direct theme toggle function using DOM
  const handleThemeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Update the DOM directly
    const root = document.documentElement;
    const bodyElement = document.body;
    
    if (newDarkMode) {
      root.classList.add('dark');
      bodyElement.classList.add('dark');
    } else {
      root.classList.remove('dark');
      bodyElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="w-full shadow-sm border-b transition-all fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded">
              <i className="ri-task-line text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">TaskAssist</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleThemeToggle}
            className="text-gray-700 dark:text-gray-300"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage 
                  src={user?.profileImageUrl || "https://ui-avatars.com/api/?name=" + (user?.firstName || user?.username || "U")} 
                  alt={user?.username || "User"} 
                />
                <AvatarFallback>{user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user ? (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email || user.username}</p>
                  </div>
                ) : (
                  "My Account"
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

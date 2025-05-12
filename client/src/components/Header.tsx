import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Header({ sidebarOpen, toggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  // Define a direct theme toggle function that doesn't rely on context
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Update the DOM directly for immediate feedback
    const root = document.documentElement;
    const bodyElement = document.body;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      bodyElement.classList.add('dark');
    } else {
      root.classList.remove('dark');
      bodyElement.classList.remove('dark');
    }
    
    // Save the theme preference
    localStorage.setItem('theme', newTheme);
    
    // Also call the context's toggle function to keep state in sync
    toggleTheme();
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
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

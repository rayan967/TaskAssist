import { ReactNode, useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { theme } = useTheme();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Update the document class when theme changes
  useEffect(() => {
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    
    if (theme === "dark") {
      rootElement.classList.add("dark");
      bodyElement.classList.add("dark");
    } else {
      rootElement.classList.remove("dark");
      bodyElement.classList.remove("dark");
    }
  }, [theme]);
  
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 ${theme === 'dark' ? 'dark' : ''}`}>
      <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <main 
          className="flex-1 overflow-y-auto pt-16 pb-24 lg:pt-0 px-4 md:px-6 lg:px-8 py-6"
          onClick={() => {
            if (window.innerWidth < 1024 && sidebarOpen) {
              setSidebarOpen(false);
            }
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

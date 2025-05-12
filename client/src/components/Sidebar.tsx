import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [location] = useLocation();
  
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  return (
    <aside 
      className={cn(
        "fixed z-10 inset-y-0 left-0 w-64 transition-transform duration-300 transform border-r border-gray-200 dark:border-gray-700 overflow-y-auto pt-16 lg:pt-0 bg-white dark:bg-gray-800",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:inset-auto lg:translate-x-0"
      )}
    >
      <div className="px-4 py-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Menu</p>
          <nav className="space-y-1">
            <Link href="/">
              <a className={cn(
                "flex items-center px-3 py-2 text-sm rounded-lg font-medium",
                location === "/" 
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" 
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}>
                <i className="ri-dashboard-line mr-3 text-lg"></i>
                Dashboard
              </a>
            </Link>
            <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 font-medium dark:text-gray-300 dark:hover:bg-gray-700">
              <i className="ri-calendar-line mr-3 text-lg"></i>
              Calendar
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 font-medium dark:text-gray-300 dark:hover:bg-gray-700">
              <i className="ri-team-line mr-3 text-lg"></i>
              Team
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 font-medium dark:text-gray-300 dark:hover:bg-gray-700">
              <i className="ri-file-list-line mr-3 text-lg"></i>
              Reports
            </a>
          </nav>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Projects</p>
          <nav className="space-y-1">
            {projects.map((project) => (
              <a 
                key={project.id}
                href="#" 
                className="flex items-center justify-between px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 font-medium dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span className="flex items-center">
                  <span 
                    className="w-2 h-2 rounded-full mr-3" 
                    style={{ backgroundColor: project.color }}
                  ></span>
                  {project.name}
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full dark:bg-gray-700 dark:text-gray-300">
                  {/* Task count would be dynamically generated in a real implementation */}
                  {project.id === 1 ? 12 : project.id === 2 ? 8 : 3}
                </span>
              </a>
            ))}
          </nav>
        </div>

        <div className="pt-4">
          <Button className="w-full">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  );
}

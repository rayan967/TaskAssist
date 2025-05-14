import { 
  tasks, 
  projects, 
  users, 
  type Task, 
  type Project,
  type User, 
  type InsertTask, 
  type UpdateTask,
  type InsertProject,
  type InsertUser,
  type TaskSummary
} from "@shared/schema";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  getTasks(filter?: string): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Task summary
  getTaskSummary(): Promise<TaskSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private projects: Map<number, Project>;
  private userId: number;
  private taskId: number;
  private projectId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.projects = new Map();
    this.userId = 1;
    this.taskId = 1;
    this.projectId = 1;
    
    // Initialize with default projects
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add default projects
    const defaultProjects = [
      { id: this.projectId++, name: "Personal", color: "#3B82F6" },
      { id: this.projectId++, name: "Work", color: "#10B981" },
      { id: this.projectId++, name: "Shopping", color: "#F59E0B" }
    ];
    
    defaultProjects.forEach(project => {
      this.projects.set(project.id, project);
    });
    
    // Add some example tasks
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const inTwoDays = new Date(now);
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    
    const inThreeDays = new Date(now);
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    
    const inFiveDays = new Date(now);
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    
    const defaultTasks = [
      {
        id: this.taskId++,
        title: "Update portfolio website with new projects",
        description: "Add recent projects to portfolio, update bio, and check for responsive design issues across different devices.",
        completed: false,
        projectId: 1,
        dueDate: tomorrow,
        priority: "medium",
        starred: false,
        assignedTo: null
      },
      {
        id: this.taskId++,
        title: "Prepare presentation for client meeting",
        description: "Create slides summarizing Q1 results, focusing on key metrics and growth opportunities.",
        completed: true,
        projectId: 2,
        dueDate: now,
        priority: "high",
        starred: true,
        assignedTo: 2
      },
      {
        id: this.taskId++,
        title: "Buy groceries for the week",
        description: "Milk, eggs, bread, fruits, vegetables, chicken, rice, pasta, and snacks.",
        completed: false,
        projectId: 3,
        dueDate: inTwoDays,
        priority: "medium",
        starred: false,
        assignedTo: null
      },
      {
        id: this.taskId++,
        title: "Book flight tickets for vacation",
        description: "Check prices for flights to Barcelona for next month. Compare options and book the best deal.",
        completed: false,
        projectId: 1,
        dueDate: inFiveDays,
        priority: "low",
        starred: false,
        assignedTo: null
      },
      {
        id: this.taskId++,
        title: "Review code pull requests",
        description: "Check team pull requests on GitHub, provide feedback, and approve changes if they meet standards.",
        completed: true,
        projectId: 2,
        dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        priority: "high",
        starred: false,
        assignedTo: 3
      },
      {
        id: this.taskId++,
        title: "Order new headphones",
        description: "Research noise-cancelling headphones, compare prices, and place order online.",
        completed: false,
        projectId: 3,
        dueDate: inThreeDays,
        priority: "medium",
        starred: true,
        assignedTo: 4
      }
    ];
    
    defaultTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Task operations
  async getTasks(filter?: string): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values());
    
    if (!filter || filter === 'all') {
      return allTasks;
    } else if (filter === 'active') {
      return allTasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
      return allTasks.filter(task => task.completed);
    }
    
    return allTasks;
  }
  
  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const newTask: Task = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, taskUpdate: UpdateTask): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    
    if (!task) {
      return undefined;
    }
    
    const updatedTask: Task = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  // Task summary
  async getTaskSummary(): Promise<TaskSummary> {
    const allTasks = Array.from(this.tasks.values());
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    return {
      total,
      completed,
      pending
    };
  }
}

export const storage = new MemStorage();

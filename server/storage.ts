import { 
  User, InsertUser, Task, InsertTask, UpdateTask, Project, InsertProject, TaskSummary 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | null>;
  
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
  
  // Team operations
  getTeamMembers(): Promise<User[]>;
  addTeamMember(userId: number, teamId: number): Promise<boolean>;
  getTasksAssignedByUser(userId: number): Promise<Task[]>;
  getTasksByUserId(userId: number, filter?: string): Promise<Task[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
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
    
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Add default users with hashed passwords
    // Note: In a real app, you would hash these passwords,
    // but for demo we'll use plain text passwords in memory storage
    // The password for all users is 'password123'
    const defaultUsers = [
      {
        id: this.userId++,
        username: "admin",
        password: "password123",  // In real system, this would be hashed
        email: "admin@taskassist.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        profileImageUrl: "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        isActive: true
      },
      {
        id: this.userId++,
        username: "john",
        password: "password123",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        profileImageUrl: "https://ui-avatars.com/api/?name=John+Doe&background=FF5733&color=fff",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        isActive: true
      },
      {
        id: this.userId++,
        username: "sarah",
        password: "password123",
        email: "sarah@example.com",
        firstName: "Sarah",
        lastName: "Smith",
        role: "user",
        profileImageUrl: "https://ui-avatars.com/api/?name=Sarah+Smith&background=4CAF50&color=fff",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        isActive: true
      }
    ];
    
    defaultUsers.forEach(user => {
      this.users.set(user.id, user);
    });
    
    // Team data
    const defaultTeamId = 1;
    const defaultTeam = {
      id: defaultTeamId,
      name: "Development Team",
      description: "Core product development team",
      creatorId: 1, // Admin user
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add default projects with user association
    const defaultProjects = [
      { 
        id: this.projectId++, 
        name: "Personal", 
        color: "#3B82F6", 
        userId: 1,
        teamId: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.projectId++, 
        name: "Work", 
        color: "#10B981", 
        userId: 1,
        teamId: defaultTeamId,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.projectId++, 
        name: "Shopping", 
        color: "#F59E0B", 
        userId: 1,
        teamId: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.projectId++, 
        name: "Marketing", 
        color: "#8B5CF6", 
        userId: 2,
        teamId: defaultTeamId,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.projectId++, 
        name: "Research", 
        color: "#EC4899", 
        userId: 3,
        teamId: defaultTeamId,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
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
        assignedTo: null,
        userId: 1,
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        assignedTo: 2,
        userId: 1,
        teamId: defaultTeamId,
        createdAt: new Date(),
        updatedAt: new Date()
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
        assignedTo: null,
        userId: 1,
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        assignedTo: null,
        userId: 1,
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        assignedTo: 3,
        userId: 1,
        teamId: defaultTeamId,
        createdAt: new Date(),
        updatedAt: new Date()
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
        assignedTo: null,
        userId: 1,
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.taskId++,
        title: "Design new marketing materials",
        description: "Create new brochures and social media graphics for the upcoming product launch.",
        completed: false,
        projectId: 4,
        dueDate: inFiveDays,
        priority: "high",
        starred: true,
        assignedTo: 2,
        userId: 2,
        teamId: defaultTeamId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.taskId++,
        title: "Research competitor pricing",
        description: "Analyze competitor pricing strategies and prepare report for management.",
        completed: false,
        projectId: 5,
        dueDate: inThreeDays,
        priority: "medium",
        starred: false,
        assignedTo: 3,
        userId: 3,
        teamId: defaultTeamId,
        createdAt: new Date(),
        updatedAt: new Date()
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
  
  // Team operations
  async getTeamMembers(): Promise<User[]> {
    // For now, return all users as team members
    return Array.from(this.users.values());
  }
  
  async addTeamMember(userId: number, teamId: number): Promise<boolean> {
    // In a real implementation, we would add a record to a team_members table
    // For this demo, we'll just return true if the user exists
    return this.users.has(userId);
  }
  
  async getTasksAssignedByUser(userId: number): Promise<Task[]> {
    // Get tasks where the user is the creator (userId) but assigned to someone else
    const allTasks = Array.from(this.tasks.values());
    return allTasks.filter(task => 
      task.userId === userId && 
      task.assignedTo !== null && 
      task.assignedTo !== userId
    );
  }
  
  // Helper method for authentication
  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    // In a real app, you would use bcrypt.compare() to compare hashed passwords
    if (user.password === password) {
      return user;
    }
    
    return null;
  }
  
  // Get tasks assigned to a specific user
  async getTasksByUserId(userId: number, filter?: string): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values());
    
    // Filter tasks that are assigned to this user
    const userTasks = allTasks.filter(task => task.assignedTo === userId);
    
    if (!filter || filter === 'all') {
      return userTasks;
    } else if (filter === 'active') {
      return userTasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
      return userTasks.filter(task => task.completed);
    }
    
    return userTasks;
  }
  
  // Get projects associated with a specific user
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    const allProjects = Array.from(this.projects.values());
    return allProjects.filter(project => project.userId === userId);
  }
}

import { DatabaseStorage } from "./DatabaseStorage";

// Use DatabaseStorage for production
export const storage = process.env.NODE_ENV === "production" 
  ? new DatabaseStorage() 
  : new MemStorage();

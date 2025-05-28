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
  searchUsers(query: string): Promise<User[]>;
  
  // Task operations
  getTasks(filter?: string): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getUserTasks(userId: number, filter?: string): Promise<Task[]>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Team operations (friend list style)
  addTeamMember(userId1: number, userId2: number): Promise<any>;
  getTeamMembers(userId: number): Promise<any[]>;
  
  // Task summary
  getTaskSummary(): Promise<TaskSummary>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private projects: Map<number, Project>;
  private teamMembers: Map<number, any>; // For team members
  private userId: number;
  private taskId: number;
  private projectId: number;
  private teamMemberId: number;
  
  // Add verification method to MemStorage
  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    // For in-memory storage in development, we just do a direct password comparison
    // In production with DatabaseStorage, bcrypt.compare would be used
    if (user.password !== password) {
      return null;
    }
    
    return user;
  }
  
  // Implementation of searchUsers for MemStorage
  async searchUsers(query: string): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    const lowerQuery = query.toLowerCase();
    
    // Filter users matching the search query
    const matchedUsers = allUsers.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
      (user.firstName && user.firstName.toLowerCase().includes(lowerQuery)) ||
      (user.lastName && user.lastName.toLowerCase().includes(lowerQuery))
    ).slice(0, 10); // Limit to 10 results
    
    // Return users without passwords (critical security fix)
    return matchedUsers.map(user => {
      // Create a new object without the password field
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }
  
  // Team operations (friend list style)
  async addTeamMember(userId1: number, userId2: number): Promise<any> {
    // Check if both users exist
    const user1 = await this.getUser(userId1);
    const user2 = await this.getUser(userId2);
    
    if (!user1 || !user2) {
      throw new Error("One or both users not found");
    }
    
    // Check if already connected
    const existingConnection = Array.from(this.teamMembers.values()).find(
      team => (team.userId1 === userId1 && team.userId2 === userId2) || 
              (team.userId1 === userId2 && team.userId2 === userId1)
    );
    
    if (existingConnection) {
      throw new Error("Users are already connected");
    }
    
    // Add bidirectional connections (user1 -> user2 and user2 -> user1)
    const id1 = this.teamMemberId++;
    const connection1 = {
      id: id1,
      userId1,
      userId2,
      createdAt: new Date()
    };
    
    const id2 = this.teamMemberId++;
    const connection2 = {
      id: id2,
      userId1: userId2,
      userId2: userId1,
      createdAt: new Date()
    };
    
    this.teamMembers.set(id1, connection1);
    this.teamMembers.set(id2, connection2);
    
    // Return the user information for display
    const { password: _, ...user2WithoutPassword } = user2;
    return user2WithoutPassword;
  }
  
  async getTeamMembers(userId: number): Promise<any[]> {
    // Get all user connections where userId is in userId1
    const connections = Array.from(this.teamMembers.values())
      .filter(team => team.userId1 === userId);
    
    // Get user details for all connections
    return connections.map(connection => {
      const connectedUser = this.users.get(connection.userId2);
      if (!connectedUser) return null;
      
      // Don't expose password
      const { password: _, ...userWithoutPassword } = connectedUser;
      
      return {
        connection: connection.id,
        user: userWithoutPassword
      };
    }).filter(item => item !== null); // Filter out null entries (in case user not found)
  }

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.projects = new Map();
    this.teamMembers = new Map();
    this.userId = 1;
    this.taskId = 1;
    this.projectId = 1;
    this.teamMemberId = 1;
    
    // Initialize with default projects
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
    
    // Set up team connections (friend list style)
    // User 1 (admin) is connected to user 2 (john) and user 3 (sarah)
    // User 2 (john) is connected to user 1 (admin)
    // User 3 (sarah) is connected to user 1 (admin)
    
    const teamConnections = [
      // admin -> john
      {
        id: this.teamMemberId++,
        userId1: 1, // admin
        userId2: 2, // john
        createdAt: new Date()
      },
      // john -> admin
      {
        id: this.teamMemberId++,
        userId1: 2, // john
        userId2: 1, // admin
        createdAt: new Date()
      },
      // admin -> sarah
      {
        id: this.teamMemberId++,
        userId1: 1, // admin
        userId2: 3, // sarah
        createdAt: new Date()
      },
      // sarah -> admin
      {
        id: this.teamMemberId++,
        userId1: 3, // sarah
        userId2: 1, // admin
        createdAt: new Date()
      }
    ];
    
    teamConnections.forEach(connection => {
      this.teamMembers.set(connection.id, connection);
    });
    
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
        teamId: null, // No team hierarchy anymore
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
        teamId: null, // No team hierarchy anymore
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: this.projectId++, 
        name: "Research", 
        color: "#EC4899", 
        userId: 3,
        teamId: null, // No team hierarchy anymore
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
        assignedBy: null,
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
        assignedBy: 1,
        userId: 1,
        teamId: null,
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
        assignedBy: null,
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
        assignedBy: null,
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
        assignedBy: 1,
        userId: 1,
        teamId: null,
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
        assignedBy: null,
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
        assignedBy: 2,
        userId: 2,
        teamId: null,
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
        assignedTo: null,
        assignedBy: null,
        userId: 3,
        teamId: null,
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
  
  async getUserTasks(userId: number, filter?: string): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values());
    
    // Filter tasks where user is creator, assignee, or assigner
    const userTasks = allTasks.filter(task => 
      task.userId === userId || 
      task.assignedTo === userId || 
      task.assignedBy === userId
    );
    
    // Apply additional filters if specified
    if (filter === 'active') {
      return userTasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
      return userTasks.filter(task => task.completed);
    }
    
    return userTasks;
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

import { DatabaseStorage } from "./DatabaseStorage";

// Use DatabaseStorage for production
export const storage = process.env.NODE_ENV === "production" 
  ? new MemStorage() 
  : new DatabaseStorage();

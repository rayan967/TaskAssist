import { eq, and, or, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  tasks, 
  projects, 
  users, 
  teams,
  type Task, 
  type Project,
  type User, 
  type Team,
  type InsertTask, 
  type UpdateTask,
  type InsertProject,
  type InsertUser,
  type InsertTeam,
  type TaskSummary
} from "@shared/schema";
import { IStorage } from "./storage";
import * as bcrypt from "bcryptjs";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    // Insert user with hashed password
    const [user] = await db.insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    // Search by username, email, or name
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db.select()
      .from(users)
      .where(
        sql`LOWER(${users.username}) LIKE ${lowerQuery} OR 
            LOWER(${users.email}) LIKE ${lowerQuery} OR 
            LOWER(${users.firstName}) LIKE ${lowerQuery} OR 
            LOWER(${users.lastName}) LIKE ${lowerQuery}`
      )
      .limit(10); // Limit results for performance
  }

  // Team operations (friend list style)
  async addTeamMember(userId1: number, userId2: number): Promise<any> {
    // Check if both users exist
    const [user1] = await db.select().from(users).where(eq(users.id, userId1));
    const [user2] = await db.select().from(users).where(eq(users.id, userId2));
    
    if (!user1 || !user2) {
      throw new Error("One or both users not found");
    }
    
    // Check if already connected
    const existingConnections = await db.select()
      .from(teams)
      .where(
        or(
          and(
            eq(teams.userId1, userId1),
            eq(teams.userId2, userId2)
          ),
          and(
            eq(teams.userId1, userId2),
            eq(teams.userId2, userId1)
          )
        )
      );

    if (existingConnections.length > 0) {
      throw new Error("Users are already connected");
    }

    // Add bidirectional connections (user1 -> user2 and user2 -> user1)
    await db.insert(teams).values([
      { userId1, userId2, createdAt: new Date() },
      { userId1: userId2, userId2: userId1, createdAt: new Date() }
    ]);
    
    // Return user2 details for display (excluding password)
    const { password, ...user2WithoutPassword } = user2;
    return user2WithoutPassword;
  }
  
  async getTeamMembers(userId: number): Promise<any[]> {
    // Join with users table to get connected user details
    const connections = await db.select({
      id: teams.id,
      connectedUserId: teams.userId2,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      isActive: users.isActive
    })
    .from(teams)
    .innerJoin(users, eq(teams.userId2, users.id))
    .where(eq(teams.userId1, userId));
    
    // Format the results to match the expected structure
    return connections.map(connection => ({
      connection: connection.id,
      user: {
        id: connection.connectedUserId,
        username: connection.username,
        email: connection.email,
        firstName: connection.firstName,
        lastName: connection.lastName,
        profileImageUrl: connection.profileImageUrl,
        role: connection.role,
        isActive: connection.isActive
      }
    }));
  }

  // Task operations
  async getTasks(filter?: string): Promise<Task[]> {
    if (filter === 'active') {
      return await db.select().from(tasks)
        .where(eq(tasks.completed, false))
        .orderBy(desc(tasks.createdAt));
    } else if (filter === 'completed') {
      return await db.select().from(tasks)
        .where(eq(tasks.completed, true))
        .orderBy(desc(tasks.createdAt));
    } else {
      return await db.select().from(tasks)
        .orderBy(desc(tasks.createdAt));
    }
  }
  
  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks)
      .values({
        ...task,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return newTask;
  }
  
  async updateTask(id: number, taskUpdate: UpdateTask): Promise<Task | undefined> {
    // Verify task exists
    const existingTask = await this.getTaskById(id);
    if (!existingTask) {
      return undefined;
    }
    
    // Update with new values
    const [updatedTask] = await db.update(tasks)
      .set({
        ...taskUpdate,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
      
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    const projectsList = await db.select().from(projects);
    return projectsList;
  }
  
  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects)
      .values({
        ...project,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return newProject;
  }
  
  // Task summary
  async getTaskSummary(): Promise<TaskSummary> {
    const result = await db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${tasks.completed} = true then 1 else 0 end)`,
    }).from(tasks);
    
    const { total, completed } = result[0];
    const pending = total - completed;
    
    return {
      total,
      completed,
      pending
    };
  }
  
  // Additional methods specific to this storage
  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return null;
    }
    
    // Update last login timestamp
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));
      
    return user;
  }
  
  // Get tasks for a specific user
  async getTasksByUserId(userId: number, filter?: string): Promise<Task[]> {
    if (filter === 'active') {
      return await db.select().from(tasks)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.completed, false)
        ))
        .orderBy(desc(tasks.createdAt));
    } else if (filter === 'completed') {
      return await db.select().from(tasks)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true)
        ))
        .orderBy(desc(tasks.createdAt));
    } else {
      return await db.select().from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt));
    }
  }
  
  // Get all tasks associated with a user (created by, assigned to, or assigned by)
  async getUserTasks(userId: number, filter?: string): Promise<Task[]> {
    // Base query to find tasks where user is creator, assignee, or assigner
    const baseQuery = or(
      eq(tasks.userId, userId),
      eq(tasks.assignedTo, userId),
      eq(tasks.assignedBy, userId)
    );
    
    // Apply additional filters if specified
    if (filter === 'active') {
      return await db.select().from(tasks)
        .where(and(
          baseQuery,
          eq(tasks.completed, false)
        ))
        .orderBy(desc(tasks.createdAt));
    } else if (filter === 'completed') {
      return await db.select().from(tasks)
        .where(and(
          baseQuery,
          eq(tasks.completed, true)
        ))
        .orderBy(desc(tasks.createdAt));
    } else {
      return await db.select().from(tasks)
        .where(baseQuery)
        .orderBy(desc(tasks.createdAt));
    }
  }
  
  // Get projects for a specific user
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select()
      .from(projects)
      .where(eq(projects.userId, userId));
  }
}
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  tasks, 
  projects, 
  users, 
  teamMembers,
  type Task, 
  type Project,
  type User, 
  type InsertTask, 
  type UpdateTask,
  type InsertProject,
  type InsertUser,
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

  // Friend operations
  async addFriend(userId: number, friendId: number): Promise<any> {
    // First check if the friend relationship already exists
    const existingFriend = await db.select()
      .from(userFriends)
      .where(
        and(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, friendId)
        )
      );

    if (existingFriend.length > 0) {
      throw new Error("User is already in your friend list");
    }

    // Add user as friend
    const [newFriend] = await db.insert(userFriends)
      .values({
        userId,
        friendId,
        createdAt: new Date()
      })
      .returning();
      
    // Get the friend's user information
    const [friendUser] = await db.select().from(users).where(eq(users.id, friendId));
    
    // Return combined data
    return {
      ...newFriend,
      username: friendUser.username,
      email: friendUser.email,
      firstName: friendUser.firstName,
      lastName: friendUser.lastName,
      profileImageUrl: friendUser.profileImageUrl,
      // Default values for UI display
      tasksCompleted: 0,
      tasksAssigned: 0,
      availability: "Available"
    };
  }
  
  async getFriends(userId: number): Promise<any[]> {
    // Join with users table to get friend details
    const friends = await db.select({
      id: userFriends.id,
      userId: userFriends.userId,
      friendId: userFriends.friendId,
      createdAt: userFriends.createdAt,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl
    })
    .from(userFriends)
    .innerJoin(users, eq(userFriends.friendId, users.id))
    .where(eq(userFriends.userId, userId));
    
    // Add task statistics for display
    return friends.map(friend => ({
      ...friend,
      // In a real implementation, these would be calculated from tasks assigned to the friend
      tasksCompleted: 0,
      tasksAssigned: 0,
      availability: "Available"
    }));
  }

  // Task operations
  async getTasks(filter?: string): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    // Apply filters
    if (filter === 'active') {
      query = query.where(eq(tasks.completed, false));
    } else if (filter === 'completed') {
      query = query.where(eq(tasks.completed, true));
    }
    
    // Order by creation date (newest first)
    query = query.orderBy(desc(tasks.createdAt));
    
    return await query;
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
    return result.rowCount > 0;
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
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
    let query = db.select()
      .from(tasks)
      .where(eq(tasks.userId, userId));
    
    // Apply additional filters if needed
    if (filter === 'active') {
      query = query.where(eq(tasks.completed, false));
    } else if (filter === 'completed') {
      query = query.where(eq(tasks.completed, true));
    }
    
    return await query;
  }
  
  // Get projects for a specific user
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select()
      .from(projects)
      .where(eq(projects.userId, userId));
  }
}
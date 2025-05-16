import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, updateTaskSchema, insertProjectSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { authenticate, generateToken, optionalAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Error handler for validation errors
  const handleError = (res: Response, error: unknown) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  };

  // GET task summary
  apiRouter.get("/tasks/summary", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getTaskSummary();
      res.json(summary);
    } catch (error) {
      handleError(res, error);
    }
  });

  // GET all tasks with optional filter
  apiRouter.get("/tasks", async (req: Request, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      const tasks = await storage.getTasks(filter);
      res.json(tasks);
    } catch (error) {
      handleError(res, error);
    }
  });

  // GET single task
  apiRouter.get("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      handleError(res, error);
    }
  });

  // POST create task
  apiRouter.post("/tasks", async (req: Request, res: Response) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      handleError(res, error);
    }
  });

  // PATCH update task
  apiRouter.patch("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const taskData = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(id, taskData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      handleError(res, error);
    }
  });

  // DELETE task
  apiRouter.delete("/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const success = await storage.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  });

  // GET all projects
  apiRouter.get("/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      handleError(res, error);
    }
  });

  // POST create project
  apiRouter.post("/projects", async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      handleError(res, error);
    }
  });

  // GET single project
  apiRouter.get("/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Authentication routes
  // Register endpoint
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return user info and token
      return res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          isActive: user.isActive
        },
        token
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Login endpoint
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      
      // Verify credentials
      const user = await (storage as any).verifyUser(loginData.username, loginData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user.id);
      
      // Return user info and token
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          isActive: user.isActive
        },
        token
      });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  // Get current user info
  apiRouter.get("/auth/me", authenticate, (req: Request, res: Response) => {
    const user = (req as any).user;
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive
    });
  });
  
  // Add optional authentication to all other routes to identify the user if token is provided
  apiRouter.use(optionalAuth);
  
  // Register API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

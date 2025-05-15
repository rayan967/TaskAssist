import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage"; 

// JWT secret should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "taskassist-secret-key";
const JWT_EXPIRES_IN = "24h";

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      
      // Attach user to request
      const user = await storage.getUser(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid token, user not found" });
      }
      
      // Add user to request object
      (req as any).user = user;
      
      next();
    } catch (error) {
      // Token verification failed
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Generate token for a user
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Optional authentication - doesn't require auth but attaches user if token is present
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token, but that's okay - continue without user
      return next();
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      
      // Attach user to request if found
      const user = await storage.getUser(decoded.id);
      
      if (user) {
        (req as any).user = user;
      }
    } catch (error) {
      // Token verification failed, but that's okay for optional auth
      // Just continue without attaching a user
    }
    
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
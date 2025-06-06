import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sessions table for storing user sessions
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { mode: 'date' }).notNull(),
});

// Users table with enhanced fields for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  role: text("role").default("user"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
});

// Teams table for user connections (friend list style)
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id1").notNull(),
  userId2: integer("user_id2").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  userId1: true,
  userId2: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Define project categories for tasks
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").notNull(), // The owner of the project
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  teamId: integer("team_id"), // Optional team association
  isPublic: boolean("is_public").default(false) // Whether project is visible to other team members
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  color: true,
  userId: true,
  teamId: true,
  isPublic: true
}).partial({
  teamId: true,
  isPublic: true
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Define tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  projectId: integer("project_id"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"),
  starred: boolean("starred").default(false),
  assignedTo: integer("assigned_to"),
  assignedBy: integer("assigned_by"), // Who assigned this task
  userId: integer("user_id").notNull(), // The creator/owner of the task
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  teamId: integer("team_id") // Optional team association 
});

const dateCoerce = z.preprocess(
    (val) => (typeof val === "string" || val instanceof Date) ? new Date(val) : val,
    z.date().optional()
);

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  dueDate: dateCoerce
});

export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial().extend({
  dueDate: dateCoerce
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Task summary for displaying stats
export type TaskSummary = {
  total: number;
  completed: number;
  pending: number;
};

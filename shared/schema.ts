import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define project categories for tasks
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull()
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  color: true,
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
  assignedTo: integer("assigned_to")
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true
});

export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true
}).partial();

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Task summary for displaying stats
export type TaskSummary = {
  total: number;
  completed: number;
  pending: number;
};

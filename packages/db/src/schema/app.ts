import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);

export const taskStatus = pgEnum("task_status", ["todo", "done"]);

export const focusSessionMode = pgEnum("focus_session_mode", [
  "focus",
  "short_break",
  "long_break",
]);

export const focusSessionStatus = pgEnum("focus_session_status", [
  "completed",
  "cancelled",
]);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("categories_userId_idx").on(table.userId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriority("priority").notNull().default("medium"),
    status: taskStatus("status").notNull().default("todo"),
    estimatedMinutes: integer("estimated_minutes"),
    focusedMinutes: integer("focused_minutes").notNull().default(0),
    restMinutes: integer("rest_minutes").notNull().default(0),
    dueDate: timestamp("due_date"),
    scheduledDate: timestamp("scheduled_date"),
    orderIndex: integer("order_index").notNull().default(0),
    startedAt: timestamp("started_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("tasks_userId_idx").on(table.userId),
    index("tasks_categoryId_idx").on(table.categoryId),
    index("tasks_scheduledDate_idx").on(table.scheduledDate),
    index("tasks_dueDate_idx").on(table.dueDate),
    index("tasks_status_idx").on(table.status),
  ],
);

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    mode: focusSessionMode("mode").notNull(),
    plannedMinutes: integer("planned_minutes").notNull(),
    actualMinutes: integer("actual_minutes").notNull(),
    status: focusSessionStatus("status").notNull(),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("focusSessions_userId_idx").on(table.userId),
    index("focusSessions_taskId_idx").on(table.taskId),
    index("focusSessions_status_idx").on(table.status),
  ],
);

export const ideas = pgTable(
  "ideas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"),
    tag: text("tag"),
    convertedTaskId: text("converted_task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("ideas_userId_idx").on(table.userId),
    index("ideas_convertedTaskId_idx").on(table.convertedTaskId),
  ],
);

export const categoryRelations = relations(categories, ({ many, one }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  tasks: many(tasks),
}));

export const taskRelations = relations(tasks, ({ many, one }) => ({
  user: one(user, {
    fields: [tasks.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  focusSessions: many(focusSessions),
}));

export const focusSessionRelations = relations(focusSessions, ({ one }) => ({
  user: one(user, {
    fields: [focusSessions.userId],
    references: [user.id],
  }),
  task: one(tasks, {
    fields: [focusSessions.taskId],
    references: [tasks.id],
  }),
}));

export const ideaRelations = relations(ideas, ({ one }) => ({
  user: one(user, {
    fields: [ideas.userId],
    references: [user.id],
  }),
  convertedTask: one(tasks, {
    fields: [ideas.convertedTaskId],
    references: [tasks.id],
  }),
}));

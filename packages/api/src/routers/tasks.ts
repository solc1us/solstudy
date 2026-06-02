import { db } from "@solstudy/db";
import { and, asc, eq, isNull } from "@solstudy/db/query";
import { categories, tasks } from "@solstudy/db/schema/app";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const taskPriorityInput = z.enum(["low", "medium", "high"]);
const taskStatusInput = z.enum(["todo", "done"]);

const idInput = z.object({
  id: z.string().min(1),
});

const nullableDateInput = z.coerce.date().nullable().optional();

async function assertCategoryBelongsToUser(categoryId: string, userId: string) {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);

  if (!category) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Category not found",
    });
  }
}

const taskCreateInput = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  priority: taskPriorityInput.optional(),
  estimatedMinutes: z.number().int().nonnegative().nullable().optional(),
  focusedMinutes: z.number().int().nonnegative().optional(),
  restMinutes: z.number().int().nonnegative().optional(),
  dueDate: nullableDateInput,
  scheduledDate: nullableDateInput,
  orderIndex: z.number().int().optional(),
  startedAt: nullableDateInput,
  completedAt: nullableDateInput,
});

const taskUpdateInput = idInput.extend({
  categoryId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  priority: taskPriorityInput.optional(),
  status: taskStatusInput.optional(),
  estimatedMinutes: z.number().int().nonnegative().nullable().optional(),
  focusedMinutes: z.number().int().nonnegative().optional(),
  restMinutes: z.number().int().nonnegative().optional(),
  dueDate: nullableDateInput,
  scheduledDate: nullableDateInput,
  orderIndex: z.number().int().optional(),
  startedAt: nullableDateInput,
  completedAt: nullableDateInput,
});

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: taskStatusInput.optional(),
          categoryId: z.string().min(1).nullable().optional(),
          scheduledDate: z.coerce.date().optional(),
          dueDate: z.coerce.date().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const filters = [eq(tasks.userId, ctx.session.user.id)];

      if (input?.status) {
        filters.push(eq(tasks.status, input.status));
      }

      if (input?.categoryId === null) {
        filters.push(isNull(tasks.categoryId));
      } else if (input?.categoryId) {
        filters.push(eq(tasks.categoryId, input.categoryId));
      }

      if (input?.scheduledDate) {
        filters.push(eq(tasks.scheduledDate, input.scheduledDate));
      }

      if (input?.dueDate) {
        filters.push(eq(tasks.dueDate, input.dueDate));
      }

      return db
        .select()
        .from(tasks)
        .where(and(...filters))
        .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt));
    }),

  getById: protectedProcedure.input(idInput).query(async ({ ctx, input }) => {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.session.user.id)))
      .limit(1);

    return task;
  }),

  create: protectedProcedure.input(taskCreateInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    if (input.categoryId) {
      await assertCategoryBelongsToUser(input.categoryId, userId);
    }

    const [task] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        userId,
        categoryId: input.categoryId ?? null,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        status: "todo",
        estimatedMinutes: input.estimatedMinutes ?? null,
        focusedMinutes: input.focusedMinutes ?? 0,
        restMinutes: input.restMinutes ?? 0,
        dueDate: input.dueDate ?? null,
        scheduledDate: input.scheduledDate ?? null,
        orderIndex: input.orderIndex ?? 0,
        startedAt: input.startedAt ?? null,
        completedAt: input.completedAt ?? null,
      })
      .returning();

    return task;
  }),

  update: protectedProcedure.input(taskUpdateInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    if (input.categoryId) {
      await assertCategoryBelongsToUser(input.categoryId, userId);
    }

    const [task] = await db
      .update(tasks)
      .set({
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        estimatedMinutes: input.estimatedMinutes,
        focusedMinutes: input.focusedMinutes,
        restMinutes: input.restMinutes,
        dueDate: input.dueDate,
        scheduledDate: input.scheduledDate,
        orderIndex: input.orderIndex,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      })
      .where(and(eq(tasks.id, input.id), eq(tasks.userId, userId)))
      .returning();

    return task;
  }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [task] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.session.user.id)))
      .returning();

    return task;
  }),

  markDone: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [task] = await db
      .update(tasks)
      .set({
        status: "done",
        completedAt: new Date(),
      })
      .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.session.user.id)))
      .returning();

    return task;
  }),

  restore: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [task] = await db
      .update(tasks)
      .set({
        status: "todo",
        completedAt: null,
      })
      .where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.session.user.id)))
      .returning();

    return task;
  }),

  setStarted: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [task] = await db
      .update(tasks)
      .set({
        startedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.id, input.id),
          eq(tasks.userId, ctx.session.user.id),
          isNull(tasks.startedAt),
        ),
      )
      .returning();

    return task;
  }),

  reorder: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              id: z.string().min(1),
              orderIndex: z.number().int(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await db.transaction(async (tx) => {
        for (const item of input.items) {
          await tx
            .update(tasks)
            .set({ orderIndex: item.orderIndex })
            .where(and(eq(tasks.id, item.id), eq(tasks.userId, userId)));
        }
      });

      return { success: true };
    }),
});

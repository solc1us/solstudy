import { db } from "@solstudy/db";
import { and, desc, eq } from "@solstudy/db/query";
import { ideas, tasks } from "@solstudy/db/schema/app";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const idInput = z.object({
  id: z.string().min(1),
});

const ideaInput = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().nullable().optional(),
  tag: z.string().trim().nullable().optional(),
  convertedTaskId: z.string().min(1).nullable().optional(),
});

async function getUserTaskId(taskId: string, userId: string) {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);

  return task?.id;
}

export const ideaRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(ideas)
      .where(eq(ideas.userId, ctx.session.user.id))
      .orderBy(desc(ideas.createdAt));
  }),

  create: protectedProcedure.input(ideaInput).mutation(async ({ ctx, input }) => {
    const convertedTaskId = input.convertedTaskId
      ? await getUserTaskId(input.convertedTaskId, ctx.session.user.id)
      : null;

    return db
      .insert(ideas)
      .values({
        id: crypto.randomUUID(),
        userId: ctx.session.user.id,
        title: input.title,
        content: input.content ?? null,
        tag: input.tag ?? null,
        convertedTaskId,
      })
      .returning()
      .then(([idea]) => idea);
  }),

  update: protectedProcedure
    .input(
      idInput.extend({
        title: z.string().trim().min(1).optional(),
        content: z.string().trim().nullable().optional(),
        tag: z.string().trim().nullable().optional(),
        convertedTaskId: z.string().min(1).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const convertedTaskId = input.convertedTaskId
        ? await getUserTaskId(input.convertedTaskId, ctx.session.user.id)
        : input.convertedTaskId;

      const [idea] = await db
        .update(ideas)
        .set({
          title: input.title,
          content: input.content,
          tag: input.tag,
          convertedTaskId,
        })
        .where(and(eq(ideas.id, input.id), eq(ideas.userId, ctx.session.user.id)))
        .returning();

      return idea;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [idea] = await db
      .delete(ideas)
      .where(and(eq(ideas.id, input.id), eq(ideas.userId, ctx.session.user.id)))
      .returning();

    return idea;
  }),

  convertToTask: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    return db.transaction(async (tx) => {
      const [idea] = await tx
        .select()
        .from(ideas)
        .where(and(eq(ideas.id, input.id), eq(ideas.userId, userId)))
        .limit(1);

      if (!idea) {
        return undefined;
      }

      const [task] = await tx
        .insert(tasks)
        .values({
          id: crypto.randomUUID(),
          userId,
          title: idea.title,
          description: idea.content,
          priority: "medium",
          status: "todo",
          focusedMinutes: 0,
          restMinutes: 0,
          orderIndex: 0,
        })
        .returning();

      if (!task) {
        return undefined;
      }

      await tx
        .update(ideas)
        .set({ convertedTaskId: task.id })
        .where(and(eq(ideas.id, input.id), eq(ideas.userId, userId)));

      return task;
    });
  }),
});

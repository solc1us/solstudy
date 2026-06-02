import { db } from "@solstudy/db";
import { and, asc, eq, sql } from "@solstudy/db/query";
import { focusSessions, tasks } from "@solstudy/db/schema/app";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const focusModeInput = z.enum(["focus", "short_break", "long_break"]);
const focusStatusInput = z.enum(["completed", "cancelled"]);

const idInput = z.object({
  id: z.string().min(1),
});

const sessionFieldsInput = z.object({
  taskId: z.string().min(1),
  mode: focusModeInput,
  plannedMinutes: z.number().int().nonnegative(),
  actualMinutes: z.number().int().nonnegative(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable().optional(),
});

const sessionCreateInput = sessionFieldsInput.extend({
  status: focusStatusInput,
});

async function assertTaskBelongsToUser(taskId: string, userId: string) {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1);

  if (!task) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Task not found",
    });
  }
}

function minuteIncrement(mode: z.infer<typeof focusModeInput>, actualMinutes: number) {
  if (mode === "focus") {
    return { focusedMinutes: sql`${tasks.focusedMinutes} + ${actualMinutes}` };
  }

  return { restMinutes: sql`${tasks.restMinutes} + ${actualMinutes}` };
}

export const focusSessionRouter = router({
  listByTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertTaskBelongsToUser(input.taskId, ctx.session.user.id);

      return db
        .select()
        .from(focusSessions)
        .where(
          and(
            eq(focusSessions.taskId, input.taskId),
            eq(focusSessions.userId, ctx.session.user.id),
          ),
        )
        .orderBy(asc(focusSessions.startedAt));
    }),

  create: protectedProcedure
    .input(sessionCreateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await assertTaskBelongsToUser(input.taskId, userId);

      return db.transaction(async (tx) => {
        const [session] = await tx
          .insert(focusSessions)
          .values({
            id: crypto.randomUUID(),
            userId,
            taskId: input.taskId,
            mode: input.mode,
            plannedMinutes: input.plannedMinutes,
            actualMinutes: input.actualMinutes,
            status: input.status,
            startedAt: input.startedAt,
            endedAt: input.endedAt ?? null,
          })
          .returning();

        if (input.status === "completed") {
          await tx
            .update(tasks)
            .set(minuteIncrement(input.mode, input.actualMinutes))
            .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));
        }

        return session;
      });
    }),

  complete: protectedProcedure
    .input(
      sessionFieldsInput.extend({
        id: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await assertTaskBelongsToUser(input.taskId, userId);

      return db.transaction(async (tx) => {
        if (!input.id) {
          const [session] = await tx
            .insert(focusSessions)
            .values({
              id: crypto.randomUUID(),
              userId,
              taskId: input.taskId,
              mode: input.mode,
              plannedMinutes: input.plannedMinutes,
              actualMinutes: input.actualMinutes,
              status: "completed",
              startedAt: input.startedAt,
              endedAt: input.endedAt ?? new Date(),
            })
            .returning();

          await tx
            .update(tasks)
            .set(minuteIncrement(input.mode, input.actualMinutes))
            .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));

          return session;
        }

        const [existingSession] = await tx
          .select()
          .from(focusSessions)
          .where(
            and(
              eq(focusSessions.id, input.id),
              eq(focusSessions.userId, userId),
              eq(focusSessions.taskId, input.taskId),
            ),
          )
          .limit(1);

        if (!existingSession) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Focus session not found",
          });
        }

        const [session] = await tx
          .update(focusSessions)
          .set({
            mode: input.mode,
            plannedMinutes: input.plannedMinutes,
            actualMinutes: input.actualMinutes,
            status: "completed",
            startedAt: input.startedAt,
            endedAt: input.endedAt ?? new Date(),
          })
          .where(and(eq(focusSessions.id, input.id), eq(focusSessions.userId, userId)))
          .returning();

        if (existingSession.status !== "completed") {
          await tx
            .update(tasks)
            .set(minuteIncrement(input.mode, input.actualMinutes))
            .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));
        }

        return session;
      });
    }),

  cancel: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const [session] = await db
      .update(focusSessions)
      .set({
        status: "cancelled",
        endedAt: new Date(),
      })
      .where(and(eq(focusSessions.id, input.id), eq(focusSessions.userId, ctx.session.user.id)))
      .returning();

    return session;
  }),
});

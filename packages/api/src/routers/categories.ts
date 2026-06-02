import { db } from "@solstudy/db";
import { and, asc, eq } from "@solstudy/db/query";
import { categories, tasks } from "@solstudy/db/schema/app";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const idInput = z.object({
  id: z.string().min(1),
});

const categoryInput = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().nullable().optional(),
  orderIndex: z.number().int().optional(),
});

const defaultCategories = [
  { name: "Study", color: "#3b82f6" },
  { name: "Coding", color: "#22c55e" },
  { name: "Personal", color: "#f59e0b" },
  { name: "Research", color: "#a855f7" },
] as const;

export const categoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return db.transaction(async (tx) => {
      const existingCategories = await tx
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(asc(categories.orderIndex), asc(categories.createdAt));

      if (existingCategories.length) {
        return existingCategories;
      }

      await tx.insert(categories).values(
        defaultCategories.map((category, index) => ({
          id: crypto.randomUUID(),
          userId,
          name: category.name,
          color: category.color,
          orderIndex: index,
        })),
      );

      return tx
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(asc(categories.orderIndex), asc(categories.createdAt));
    });
  }),

  create: protectedProcedure.input(categoryInput).mutation(({ ctx, input }) => {
    return db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        userId: ctx.session.user.id,
        name: input.name,
        color: input.color ?? null,
        orderIndex: input.orderIndex ?? 0,
      })
      .returning()
      .then(([category]) => category);
  }),

  update: protectedProcedure
    .input(
      idInput.extend({
        name: z.string().trim().min(1).optional(),
        color: z.string().trim().nullable().optional(),
        orderIndex: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [category] = await db
        .update(categories)
        .set({
          name: input.name,
          color: input.color,
          orderIndex: input.orderIndex,
        })
        .where(
          and(eq(categories.id, input.id), eq(categories.userId, ctx.session.user.id)),
        )
        .returning();

      return category;
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    return db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ categoryId: null })
        .where(and(eq(tasks.userId, userId), eq(tasks.categoryId, input.id)));

      const [category] = await tx
        .delete(categories)
        .where(and(eq(categories.id, input.id), eq(categories.userId, userId)))
        .returning();

      return category;
    });
  }),
});

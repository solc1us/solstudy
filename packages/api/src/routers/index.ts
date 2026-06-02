import { protectedProcedure, publicProcedure, router } from "../index";
import { categoryRouter } from "./categories";
import { focusSessionRouter } from "./focus-sessions";
import { ideaRouter } from "./ideas";
import { taskRouter } from "./tasks";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  categories: categoryRouter,
  tasks: taskRouter,
  focusSessions: focusSessionRouter,
  ideas: ideaRouter,
});
export type AppRouter = typeof appRouter;

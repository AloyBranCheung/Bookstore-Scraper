import { initTRPC } from "@trpc/server";
import { z } from "zod";

export const t = initTRPC.create();

export const appRouter = t.router({
  healthcheck: t.procedure.query(() => {
    return "Server is good bro.";
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;

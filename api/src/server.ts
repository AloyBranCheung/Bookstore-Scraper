import * as dotenv from "dotenv";
dotenv.config();
// trpc
import { inferAsyncReturnType } from "@trpc/server";
import { appRouter } from "./tRPC-routers";
import * as trpcExpress from "@trpc/server/adapters/express";
// express
import express from "express";
// web scraper
import scrapeBookData from "./web-scrapers/scrape";

// tRPC
// created for each request
const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = inferAsyncReturnType<typeof createContext>;

// express
const app = express();
const port = process.env.PORT;

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

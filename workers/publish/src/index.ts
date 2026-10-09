import { Hono } from "hono";
import type { ArticleStatus } from "@mstudio/contracts";
import { isArticleStatus } from "@mstudio/contracts";
import {
  getArticle,
  listRevisions,
  publishArticle,
  PublishConflictError,
  transitionArticle,
  TransitionError,
} from "@mstudio/db";
import { getCorrelationId } from "@mstudio/observability";

type AppEnv = {
  Bindings: Env;
  Variables: {
    correlationId: string;
  };
};

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  c.set("correlationId", getCorrelationId(c.req.raw));
  await next();
});

app.get("/healthz", (c) =>
  c.json({
    ok: true,
    environment: c.env.ENVIRONMENT,
    correlationId: c.get("correlationId"),
  }),
);

app.get("/articles/:id", async (c) => {
  const id = c.req.param("id");
  const article = await getArticle(c.env.DB, id);
  if (!article) {
    return c.json(
      { error: { code: "ARTICLE_NOT_FOUND", message: `article ${id} not found` } },
      404,
    );
  }
  const revisions = await listRevisions(c.env.DB, id);
  return c.json({ article, revisions });
});

app.post("/articles/:id/transitions", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => null)) as {
    to?: unknown;
  } | null;
  const to = body?.to;
  if (typeof to !== "string" || !isArticleStatus(to)) {
    return c.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "body.to must be a valid ArticleStatus",
        },
      },
      400,
    );
  }
  try {
    const article = await transitionArticle(c.env.DB, id, to as ArticleStatus);
    return c.json(article);
  } catch (error) {
    if (error instanceof TransitionError) {
      return c.json(
        {
          error: {
            code: "INVALID_TRANSITION",
            message: error.message,
            details: { allowed: [...error.allowed] },
          },
        },
        409,
      );
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return c.json(
        { error: { code: "ARTICLE_NOT_FOUND", message: error.message } },
        404,
      );
    }
    throw error;
  }
});

app.post("/articles/:id/publish", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => null)) as {
    revisionId?: unknown;
  } | null;
  const revisionId = body?.revisionId;
  if (typeof revisionId !== "string") {
    return c.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "body.revisionId must be a string",
        },
      },
      400,
    );
  }
  try {
    const result = await publishArticle(c.env.DB, id, revisionId);
    return c.json(result, result.alreadyPublished ? 200 : 201);
  } catch (error) {
    if (error instanceof TransitionError) {
      return c.json(
        { error: { code: "NOT_SCHEDULED", message: error.message } },
        409,
      );
    }
    if (error instanceof PublishConflictError) {
      return c.json(
        { error: { code: "PUBLISH_CONFLICT", message: error.message } },
        409,
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("not found") ||
        error.message.includes("does not belong"))
    ) {
      return c.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        404,
      );
    }
    throw error;
  }
});

app.notFound((c) =>
  c.json({ error: { code: "NOT_FOUND", message: "not found" } }, 404),
);

export default app;

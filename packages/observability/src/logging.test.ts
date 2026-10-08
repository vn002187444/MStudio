import assert from "node:assert/strict";
import { test } from "node:test";
import { createLogger } from "./logging.ts";

test("logger filters below the configured level and emits structured json", () => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: string) => {
    lines.push(line);
  };
  try {
    const logger = createLogger({
      environment: "test",
      logLevel: "warn",
      correlationId: "cid-1",
    });
    logger.debug("hidden");
    logger.info("hidden-too");
    logger.warn("visible", { path: "/x" });
  } finally {
    console.log = original;
  }

  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]) as {
    level: string;
    message: string;
    environment: string;
    correlationId?: string;
    path?: string;
  };
  assert.equal(parsed.level, "warn");
  assert.equal(parsed.message, "visible");
  assert.equal(parsed.environment, "test");
  assert.equal(parsed.correlationId, "cid-1");
  assert.equal(parsed.path, "/x");
});

test("logger defaults to info level", () => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (line: string) => {
    lines.push(line);
  };
  try {
    const logger = createLogger({ environment: "test" });
    logger.debug("hidden");
    logger.info("shown");
  } finally {
    console.log = original;
  }

  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]) as { level: string };
  assert.equal(parsed.level, "info");
});

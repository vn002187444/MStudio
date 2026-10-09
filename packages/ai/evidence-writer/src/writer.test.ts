import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  getAgentRun,
  listAgentRunsByStory,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import {
  ModelGateway,
  ModelGatewayError,
  type ModelProvider,
  type ModelResponse,
} from "@mstudio/model-gateway";
import {
  isRetryable,
  parseEvidenceOutput,
  runEvidenceVerification,
  validateSourceRefs,
  WriterValidationError,
} from "./index.ts";
import type { WriterRequest } from "./types.ts";

const VALID_OUTPUT = JSON.stringify({
  summary: "Two independent sources support the headline.",
  facts: [
    {
      text: "The event happened on Monday",
      sourceRefs: [{ sourceId: "raw-1" }],
    },
  ],
  claims: [
    {
      text: "The budget was passed",
      sourceRefs: [{ sourceId: "raw-2" }],
      confidence: 0.7,
    },
  ],
});

const REQUEST: WriterRequest = {
  storyId: "story-1",
  headline: "Market rallies as budget passes",
  evidenceText:
    "Raw item 1: event happened Monday. Raw item 2: budget passed.",
  evidence: [
    { sourceId: "raw-1", snippet: "event happened Monday" },
    { sourceId: "raw-2", snippet: "budget passed" },
  ],
};

type Step =
  | { kind: "text"; text: string }
  | { kind: "error"; error: unknown };

function mockGateway(
  steps: Step[],
): { gateway: ModelGateway; calls: () => number } {
  let index = 0;
  const provider: ModelProvider = {
    async generate(): Promise<ModelResponse> {
      const step = steps[Math.min(index, steps.length - 1)];
      index += 1;
      if (step.kind === "error") throw step.error;
      return {
        text: step.text,
        model: "test-model",
        finishReason: "STOP",
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      };
    },
  };
  return { gateway: new ModelGateway({ provider }), calls: () => index };
}

async function setup(): Promise<{
  db: D1Database;
  close(): void;
}> {
  const { db, close } = await openMigratedTestDb();
  return { db, close };
}

test("parseEvidenceOutput parses structured output", async () => {
  const output = parseEvidenceOutput(VALID_OUTPUT);
  assert.equal(
    output.summary,
    "Two independent sources support the headline.",
  );
  assert.equal(output.facts.length, 1);
  assert.equal(output.facts[0].sourceRefs[0].sourceId, "raw-1");
  assert.equal(output.claims.length, 1);
  assert.equal(output.claims[0].confidence, 0.7);
});

test("parseEvidenceOutput rejects malformed JSON", async () => {
  assert.throws(
    () => parseEvidenceOutput("not json at all"),
    WriterValidationError,
  );
});

test("parseEvidenceOutput rejects missing summary", async () => {
  assert.throws(
    () => parseEvidenceOutput(JSON.stringify({ facts: [], claims: [] })),
    WriterValidationError,
  );
});

test("parseEvidenceOutput rejects bad confidence", async () => {
  const bad = JSON.stringify({
    summary: "ok",
    facts: [],
    claims: [
      { text: "c", sourceRefs: [], confidence: 1.5 },
    ],
  });
  assert.throws(() => parseEvidenceOutput(bad), WriterValidationError);
});

test("validateSourceRefs accepts cited evidence", async () => {
  const output = parseEvidenceOutput(VALID_OUTPUT);
  assert.doesNotThrow(() => validateSourceRefs(output, REQUEST.evidence));
});

test("validateSourceRefs rejects hallucinated source", async () => {
  const bad = JSON.stringify({
    summary: "ok",
    facts: [
      { text: "made up", sourceRefs: [{ sourceId: "raw-999" }] },
    ],
    claims: [],
  });
  const output = parseEvidenceOutput(bad);
  assert.throws(
    () => validateSourceRefs(output, REQUEST.evidence),
    (error: unknown) => {
      assert.ok(error instanceof WriterValidationError);
      assert.equal(error.details.length, 1);
      assert.match(error.details[0], /raw-999/);
      return true;
    },
  );
});

test("isRetryable gates transient gateway errors", async () => {
  assert.equal(
    isRetryable(new ModelGatewayError("t", "TIMEOUT")),
    true,
  );
  assert.equal(
    isRetryable(new ModelGatewayError("p", "PROVIDER_ERROR")),
    true,
  );
  assert.equal(
    isRetryable(new ModelGatewayError("u", "UNKNOWN")),
    false,
  );
  assert.equal(isRetryable(new WriterValidationError("bad")), true);
  assert.equal(isRetryable(new TypeError("bug")), false);
});

test("runEvidenceVerification succeeds and persists a succeeded agent run", async () => {
  const { db, close } = await setup();
  try {
    const { gateway, calls } = mockGateway([
      { kind: "text", text: VALID_OUTPUT },
    ]);
    const { output, agentRun } = await runEvidenceVerification(
      { db, gateway, options: { promptVersion: "ev1", model: "test-model", maxAttempts: 3 } },
      REQUEST,
    );
    assert.equal(calls(), 1);
    assert.equal(output.facts.length, 1);
    assert.equal(agentRun.status, "succeeded");
    assert.equal(agentRun.attempt, 1);
    assert.equal(agentRun.storyId, "story-1");
    assert.equal(agentRun.type, "evidence_verification");
    assert.equal(agentRun.promptVersion, "ev1");
    assert.deepEqual(agentRun.evidenceRefs, REQUEST.evidence);
    assert.ok(agentRun.output);
    assert.ok(agentRun.finishedAt);
    const persisted = await getAgentRun(db, agentRun.id);
    assert.equal(persisted?.status, "succeeded");
    assert.deepEqual(
      persisted?.evidenceRefs,
      REQUEST.evidence,
    );
  } finally {
    close();
  }
});

test("retry boundary retries transient timeouts then succeeds", async () => {
  const { db, close } = await setup();
  try {
    const { gateway, calls } = mockGateway([
      { kind: "error", error: new ModelGatewayError("t", "TIMEOUT") },
      { kind: "error", error: new ModelGatewayError("t", "TIMEOUT") },
      { kind: "text", text: VALID_OUTPUT },
    ]);
    const { agentRun } = await runEvidenceVerification(
      { db, gateway, options: { promptVersion: "ev1", model: "test-model", maxAttempts: 3 } },
      REQUEST,
    );
    assert.equal(calls(), 3);
    assert.equal(agentRun.status, "succeeded");
    assert.equal(agentRun.attempt, 3);
  } finally {
    close();
  }
});

test("retry boundary stops at maxAttempts and marks failed", async () => {
  const { db, close } = await setup();
  try {
    const { gateway, calls } = mockGateway([
      { kind: "error", error: new ModelGatewayError("p", "PROVIDER_ERROR") },
    ]);
    await assert.rejects(
      runEvidenceVerification(
        {
          db,
          gateway,
          options: { promptVersion: "ev1", model: "test-model", maxAttempts: 2 },
        },
        REQUEST,
      ),
      (error: unknown) => {
        assert.ok(error instanceof ModelGatewayError);
        assert.equal(error.code, "PROVIDER_ERROR");
        return true;
      },
    );
    assert.equal(calls(), 2);
    const runs = await listAgentRunsByStory(db, "story-1");
    assert.equal(runs.rows.length, 1);
    const run = runs.rows[0];
    assert.equal(run.status, "failed");
    assert.equal(run.attempt, 2);
    assert.equal(run.errorCode, "PROVIDER_ERROR");
    assert.ok(run.finishedAt);
  } finally {
    close();
  }
});

test("non-retryable error stops at first attempt", async () => {
  const { db, close } = await setup();
  try {
    const { gateway, calls } = mockGateway([
      { kind: "error", error: new TypeError("unexpected bug") },
    ]);
    await assert.rejects(
      runEvidenceVerification(
        {
          db,
          gateway,
          options: { promptVersion: "ev1", model: "test-model", maxAttempts: 3 },
        },
        REQUEST,
      ),
      (error: unknown) => {
        assert.ok(error instanceof ModelGatewayError);
        assert.equal(error.code, "UNKNOWN");
        return true;
      },
    );
    assert.equal(calls(), 1);
    const runs = await listAgentRunsByStory(db, "story-1");
    assert.equal(runs.rows[0].status, "failed");
    assert.equal(runs.rows[0].attempt, 1);
    assert.equal(runs.rows[0].errorCode, "UNKNOWN");
  } finally {
    close();
  }
});

test("hallucinated source ref is retried then fails", async () => {
  const { db, close } = await setup();
  try {
    const hallucinated = JSON.stringify({
      summary: "ok",
      facts: [
        { text: "made up", sourceRefs: [{ sourceId: "raw-999" }] },
      ],
      claims: [],
    });
    const { gateway, calls } = mockGateway([
      { kind: "text", text: hallucinated },
    ]);
    await assert.rejects(
      runEvidenceVerification(
        {
          db,
          gateway,
          options: { promptVersion: "ev1", model: "test-model", maxAttempts: 2 },
        },
        REQUEST,
      ),
      WriterValidationError,
    );
    assert.equal(calls(), 2);
    const runs = await listAgentRunsByStory(db, "story-1");
    assert.equal(runs.rows[0].status, "failed");
    assert.equal(runs.rows[0].errorCode, "VALIDATION");
    assert.equal(runs.rows[0].attempt, 2);
  } finally {
    close();
  }
});

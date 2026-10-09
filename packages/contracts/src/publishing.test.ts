import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ARTICLE_STATUSES,
  ARTICLE_TRANSITIONS,
  canTransition,
  isArticleStatus,
  isPublishedState,
  isTerminal,
  validateTransition,
} from "./publishing.ts";

test("transitions never target unknown statuses", async () => {
  for (const from of ARTICLE_STATUSES) {
    for (const to of ARTICLE_TRANSITIONS[from]) {
      assert.ok(
        isArticleStatus(to),
        `${from} -> ${to} targets unknown status`,
      );
    }
  }
});

test("review gate: only reviewed states may reach scheduled", async () => {
  const reviewers = ARTICLE_STATUSES.filter((status) =>
    canTransition(status, "scheduled"),
  );
  assert.deepEqual(
    reviewers.sort(),
    ["auto_eligible", "human_review"].sort(),
  );
  assert.equal(canTransition("drafted", "scheduled"), false);
  assert.equal(canTransition("ai_qa", "scheduled"), false);
  assert.equal(canTransition("hold", "scheduled"), false);
});

test("drafted cannot bypass AI QA or review", async () => {
  assert.equal(canTransition("drafted", "ai_qa"), true);
  assert.equal(canTransition("drafted", "published"), false);
  assert.equal(canTransition("drafted", "scheduled"), false);
});

test("correction states reachable only after published", async () => {
  for (const correction of ["updated", "corrected", "retracted"] as const) {
    assert.equal(canTransition("published", correction), true);
  }
  assert.equal(canTransition("scheduled", "corrected"), false);
  assert.equal(canTransition("human_review", "retracted"), false);
});

test("retracted is terminal", async () => {
  assert.equal(isTerminal("retracted"), true);
  assert.equal(canTransition("retracted", "published"), false);
  assert.ok(!isTerminal("published"));
});

test("isPublishedState marks post-publish lifecycle", async () => {
  assert.equal(isPublishedState("published"), true);
  assert.equal(isPublishedState("corrected"), true);
  assert.equal(isPublishedState("scheduled"), false);
  assert.equal(isPublishedState("drafted"), false);
});

test("validateTransition reports allowed targets", async () => {
  const ok = validateTransition("human_review", "scheduled");
  assert.deepEqual(ok, { ok: true });
  const bad = validateTransition("drafted", "scheduled");
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.deepEqual(bad.allowed, ["ai_qa"]);
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { openMigratedTestDb } from "../testing/helpers.ts";
import {
  createEmail,
  listEmails,
  updateEmailStatus,
  updateEmailStar,
} from "./emails.ts";
import type { EmailRecord } from "@mstudio/contracts";

test("should create and list emails", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const email: EmailRecord = {
      id: "test-email-1",
      direction: "outbound",
      senderName: "Test Sender",
      senderEmail: "test@example.com",
      recipientEmail: "recipient@example.com",
      subject: "Test Subject",
      body: "Test Body",
      preview: "Test Preview",
      category: "Phản hồi",
      status: "unread",
      starred: 0,
      createdAt: new Date().toISOString(),
    };

    await createEmail(db, email);
    const emails = await listEmails(db);
    
    assert.ok(emails.length >= 1);
    const found = emails.find((e) => e.id === "test-email-1");
    assert.ok(found);
    assert.equal(found?.subject, "Test Subject");
  } finally {
    close();
  }
});

test("should update status and star", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const email: EmailRecord = {
      id: "test-email-2",
      direction: "inbound",
      senderEmail: "in@example.com",
      recipientEmail: "me@example.com",
      subject: "Inbound",
      body: "Hello",
      category: "Phản hồi",
      status: "unread",
      starred: 0,
      createdAt: new Date().toISOString(),
    };

    await createEmail(db, email);
    
    await updateEmailStatus(db, "test-email-2", "read");
    await updateEmailStar(db, "test-email-2", 1);
    
    const emails = await listEmails(db, { status: "read" });
    const found = emails.find((e) => e.id === "test-email-2");
    assert.ok(found);
    assert.equal(found?.status, "read");
    assert.equal(found?.starred, 1);
  } finally {
    close();
  }
});

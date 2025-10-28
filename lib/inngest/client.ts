// lib/inngest/client.ts
import { Inngest } from "inngest";

// Create the Inngest client
export const inngest = new Inngest({
  id: process.env.INNGEST_APP_ID || "memo", // Use env var or default
  eventKey: process.env.INNGEST_EVENT_KEY,
});
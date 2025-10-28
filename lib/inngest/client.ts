// lib/inngest/client.ts
import { Inngest } from "inngest";

// Create the Inngest client
export const inngest = new Inngest({ 
  id: "your-app-name",
  eventKey: process.env.INNGEST_EVENT_KEY,
});




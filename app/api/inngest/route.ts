// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { articleSubmissionFunction } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    articleSubmissionFunction,
    // Add other functions here
  ],
});
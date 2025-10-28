// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { 
  articleSubmissionFunction,
  articleDeletionFunction,
  bulkArticleUpdateFunction,
  articleStatsAggregationFunction
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    articleSubmissionFunction,
    articleDeletionFunction,
    bulkArticleUpdateFunction,
    articleStatsAggregationFunction,
  ],
});
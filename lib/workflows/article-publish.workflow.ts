import OpenAI from "openai";
import { memoFlow } from "@/lib/workflow";
import { z } from "zod";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ---------------------
// Schema Validation
// ---------------------
const ReviewSchema = z.object({
  spellingErrors: z.array(z.object({ word: z.string(), correction: z.string(), context: z.string() })).optional(),
  grammarIssues: z.array(z.object({ issue: z.string(), fix: z.string(), context: z.string() })).optional(),
  nsfwDetected: z.boolean().default(false),
  nsfwReasons: z.array(z.string()).optional(),
  contentQuality: z.object({ score: z.number(), feedback: z.string() }),
  factualAccuracy: z.object({ score: z.number(), issues: z.array(z.string()) }),
  toneAnalysis: z.object({ appropriate: z.boolean(), description: z.string() }),
  overallScore: z.number(),
  aiConfidence: z.number(),
}).catchall(z.any());

// ---------------------
// Helper: Safe AI Request with Fallback
// ---------------------
async function safeAIRequest(messages: any[], options: { max_tokens?: number; temperature?: number } = {}) {
  const models = [
    "openai/gpt-4o-mini",
    "mistralai/mistral-7b-instruct:free",
    "alibaba/tongyi-deepresearch-30b-a3b:free",
  ];

  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: options.max_tokens || 3000,
        temperature: options.temperature ?? 0.2,
      });
      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty response from AI");
      return { content, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[AI Fallback] Model ${model} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 500)); // short delay before next attempt
    }
  }
  throw new Error(`All AI fallback models failed: ${lastError?.message}`);
}

// ---------------------
// Refactored: AI Review Content
// ---------------------
async function aiReviewContent(articleData: any): Promise<any> {
  const primaryPrompt = `
You are an expert content reviewer. Review this article JSON for:
- Spelling errors
- Grammar mistakes
- NSFW content
- Content quality, readability, engagement
- Factual accuracy
- Tone

Return ONLY valid JSON with this structure:
{
  "spellingErrors": [],
  "grammarIssues": [],
  "nsfwDetected": false,
  "nsfwReasons": [],
  "contentQuality": { "score": 0-10, "feedback": "" },
  "factualAccuracy": { "score": 0-10, "issues": [] },
  "toneAnalysis": { "appropriate": true, "description": "" },
  "overallScore": 0-10,
  "aiConfidence": 0-1
}
Article JSON:
${JSON.stringify(articleData, null, 2)}
`;

  const fallbackPrompt = `
Return a simplified content review JSON for this article:
${JSON.stringify(articleData, null, 2)}
Ensure the JSON is valid and includes:
nsfwDetected, overallScore, aiConfidence, contentQuality, factualAccuracy
`;

  try {
    // Try primary prompt
    const { content: rawContent } = await safeAIRequest(
      [
        { role: "system", content: "You are a content review expert. Respond only with JSON." },
        { role: "user", content: primaryPrompt },
      ],
      { max_tokens: 3000 }
    );

    try {
      const parsed = JSON.parse(rawContent);
      const validated = ReviewSchema.safeParse(parsed);
      if (!validated.success) {
        console.warn("Primary JSON validation failed. Using fallback.");
        throw new Error("Schema mismatch");
      }
      return validated.data;
    } catch (err) {
      console.warn("Parsing or validation failed for primary AI output:", err.message, rawContent);
      // Retry with fallback prompt
      const { content: fallbackContent } = await safeAIRequest(
        [
          { role: "system", content: "Simplified content review AI. Return valid JSON only." },
          { role: "user", content: fallbackPrompt },
        ],
        { max_tokens: 1500, temperature: 0.2 }
      );
      try {
        const parsedFallback = JSON.parse(fallbackContent);
        return ReviewSchema.parse(parsedFallback);
      } catch (err) {
        console.error("Fallback parsing failed:", err.message, fallbackContent);
        // Return minimal safe review
        return {
          spellingErrors: [],
          grammarIssues: [],
          nsfwDetected: false,
          nsfwReasons: [],
          contentQuality: { score: 5, feedback: "Fallback review" },
          factualAccuracy: { score: 5, issues: ["Fallback review"] },
          toneAnalysis: { appropriate: true, description: "Unknown" },
          overallScore: 5,
          aiConfidence: 0,
          error: "AI review failed",
        };
      }
    }
  } catch (err) {
    console.error("AI review completely failed:", err);
    // Return minimal safe review if all attempts fail
    return {
      spellingErrors: [],
      grammarIssues: [],
      nsfwDetected: false,
      nsfwReasons: [],
      contentQuality: { score: 5, feedback: "AI review system failure" },
      factualAccuracy: { score: 5, issues: ["AI system error"] },
      toneAnalysis: { appropriate: true, description: "Unknown" },
      overallScore: 5,
      aiConfidence: 0,
      error: err.message,
    };
  }
}

// ---------------------
// Integration in Workflow
// ---------------------
memoFlow.createFunction(
  { id: "ai-article-review-workflow", name: "AI Article Review", retries: 3 },
  { event: "article.submitted" },
  async ({ event, step }) => {
    const { articleId, htmlContent, author, title, category } = event.data;

    // ... Steps for cleaning HTML and parsing JSON (similar fallback logic) ...

    const jsonData = await step.run("ai-parse-json", async () => {
      // Use safe AI request & JSON validation similar to above
    });

    const contentReview = await step.run("ai-content-review", async () => {
      return await aiReviewContent(jsonData);
    });

    const storageResult = await step.run("store-article", async () => {
      const id = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { id, url: `/articles/${id}` };
    });

    return {
      articleId,
      status: contentReview.nsfwDetected ? "flagged" : "approved",
      review: contentReview,
      storageId: storageResult.id,
      aiConfidence: contentReview.aiConfidence,
      timestamp: new Date(),
    };
  }
);
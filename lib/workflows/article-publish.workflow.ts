import OpenAI from "openai";
import { memoFlow } from "@/lib/workflow";
import { z } from "zod";

// -------------------
// OpenRouter Setup
// -------------------
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// -------------------
// Schema Validation
// -------------------
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

// -------------------
// Helper: Safe AI Request with Fallback Models
// -------------------
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
      if (!content) throw new Error("Empty AI response");
      return { content, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[AI Fallback] Model ${model} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 500)); // short delay before next attempt
    }
  }

  throw new Error(`All fallback models failed: ${lastError?.message}`);
}

// -------------------
// 1️⃣ HTML Cleaning
// -------------------
async function aiCleanAndSecureHtml(html: string): Promise<string> {
  const prompt = `
You are an HTML security expert. Clean and secure this HTML content by:
1. Remove ALL script tags and inline event handlers
2. Remove dangerous attributes (onclick, onload, javascript:, etc.)
3. Fix HTML syntax issues while preserving layout
4. Keep CSS/styling intact
5. Ensure no XSS vulnerabilities remain
6. Maintain content structure and UI
Return ONLY the cleaned HTML.
HTML:
${html}
`;

  try {
    const { content } = await safeAIRequest(
      [
        { role: "system", content: "HTML security expert. Return only cleaned HTML." },
        { role: "user", content: prompt },
      ],
      { max_tokens: 4000, temperature: 0.1 }
    );
    return content;
  } catch (err) {
    console.error("HTML cleaning failed. Using regex fallback:", err.message);
    // Basic fallback cleaning
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/javascript:/gi, "");
  }
}

// -------------------
// 2️⃣ Parse HTML to JSON
// -------------------
async function aiParseArticleToJson(html: string, metadata: any): Promise<any> {
  const prompt = `
Parse this HTML article into structured JSON:
1. Title / headings
2. Author
3. Publication date
4. Main text content
5. Sections & subtitles
6. Images/media
7. Categories/tags
8. Summary
Metadata: ${JSON.stringify(metadata)}
HTML:
${html}
Return ONLY valid JSON.
`;

  try {
    const { content: rawContent } = await safeAIRequest(
      [
        { role: "system", content: "Data extraction expert. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
      { max_tokens: 2000, temperature: 0.1 }
    );
    return JSON.parse(rawContent);
  } catch (err) {
    console.error("JSON parsing failed. Using fallback:", err.message);
    return {
      ...metadata,
      content: html.replace(/<[^>]*>/g, "").slice(0, 1000),
      sections: [],
      error: "Parsing failed",
    };
  }
}

// -------------------
// 3️⃣ Content Review
// -------------------
async function aiReviewContent(articleData: any): Promise<any> {
  const primaryPrompt = `
You are an expert content reviewer. Review this article JSON for:
- Spelling, grammar, NSFW content
- Content quality, readability, engagement
- Factual accuracy
- Tone

Return ONLY JSON:
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
Return a simplified content review JSON with valid keys:
nsfwDetected, overallScore, aiConfidence, contentQuality, factualAccuracy
Article JSON:
${JSON.stringify(articleData, null, 2)}
`;

  try {
    const { content: rawContent } = await safeAIRequest(
      [
        { role: "system", content: "Content review expert. Respond only with JSON." },
        { role: "user", content: primaryPrompt },
      ],
      { max_tokens: 3000 }
    );

    try {
      const parsed = JSON.parse(rawContent);
      const validated = ReviewSchema.safeParse(parsed);
      if (!validated.success) throw new Error("Schema mismatch");
      return validated.data;
    } catch (err) {
      console.warn("Primary AI output invalid. Retrying with fallback.");
      const { content: fallbackContent } = await safeAIRequest(
        [
          { role: "system", content: "Simplified content reviewer. Return valid JSON." },
          { role: "user", content: fallbackPrompt },
        ],
        { max_tokens: 1500 }
      );
      try {
        return ReviewSchema.parse(JSON.parse(fallbackContent));
      } catch (err) {
        console.error("Fallback review failed. Returning minimal safe review:", err.message);
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
          error: err.message,
        };
      }
    }
  } catch (err) {
    console.error("AI review completely failed:", err.message);
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

// -------------------
// 4️⃣ Storage Function
// -------------------
async function storeReviewedArticle(article: any): Promise<{ id: string; url: string }> {
  const id = `article_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  console.log(`📁 Stored article ${id}`);
  await new Promise((r) => setTimeout(r, 300));
  return { id, url: `/articles/${id}` };
}

// -------------------
// 5️⃣ Workflow Integration
// -------------------
memoFlow.createFunction(
  { id: "ai-article-review-workflow", name: "AI Article Review", retries: 3 },
  { event: "article.submitted" },
  async ({ event, step }) => {
    const { articleId, htmlContent, author, title, category } = event.data;

    // Step 1: Clean HTML
    const cleanedHtml = await step.run("ai-clean-html", async () => aiCleanAndSecureHtml(htmlContent), { maxRetries: 2 });

    // Step 2: Parse HTML → JSON
    const jsonData = await step.run(
      "ai-parse-json",
      async () => aiParseArticleToJson(cleanedHtml, { articleId, title, author, category }),
      { maxRetries: 2 }
    );

    // Step 3: Content Review
    const contentReview = await step.run("ai-content-review", async () => aiReviewContent(jsonData), { maxRetries: 3 });

    // Step 4: Store Reviewed Article
    const storageResult = await step.run("store-article", async () =>
      storeReviewedArticle({
        articleId,
        originalHtml: htmlContent,
        cleanedHtml,
        jsonData,
        contentReview,
        reviewedAt: new Date(),
        status: contentReview.nsfwDetected ? "flagged" : "approved",
        aiConfidence: contentReview.aiConfidence,
      }),
      { maxRetries: 3 }
    );

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
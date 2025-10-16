import OpenAI from 'openai';
import { eventFlow } from '@/lib/workflow';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
});

// Article Review Workflow using AI
eventFlow.createFunction(
  {
    id: "ai-article-review-workflow",
    name: "AI-Powered Article Submission Review",
    retries: 3
  },
  {
    event: "article.submitted"
  },
  async ({ event, step }) => {
    const { articleId, htmlContent, author, title, category } = event.data;

    console.log(`🤖 Starting AI review for article: "${title}" by ${author}`);

    // Step 1: AI-Powered HTML Cleaning and Security Fix
    const cleanedHtml = await step.run(
      "ai-clean-html",
      async () => {
        console.log("🔧 Step 1: AI cleaning HTML and fixing security issues...");
        return await aiCleanAndSecureHtml(htmlContent);
      },
      { maxRetries: 2 }
    );

    // Step 2: AI-Powered JSON Parsing and Structure Analysis
    const jsonData = await step.run(
      "ai-parse-json",
      async () => {
        console.log("📋 Step 2: AI parsing content to structured JSON...");
        return await aiParseArticleToJson(cleanedHtml, { articleId, title, author, category });
      },
      { maxRetries: 2 }
    );

    // Step 3: AI Content Review (Spelling, Grammar, NSFW, Quality)
    const contentReview = await step.run(
      "ai-content-review",
      async () => {
        console.log("🔍 Step 3: AI reviewing content quality and safety...");
        return await aiReviewContent(jsonData);
      },
      { maxRetries: 3 }
    );

    // Step 4: Store the AI-Reviewed Article
    const storageResult = await step.run(
      "store-article",
      async () => {
        console.log("💾 Step 4: Storing AI-reviewed article...");
        return await storeReviewedArticle({
          articleId,
          originalHtml: htmlContent,
          cleanedHtml,
          jsonData,
          contentReview,
          reviewedAt: new Date(),
          status: contentReview.nsfwDetected ? 'flagged' : 'approved',
          aiConfidence: contentReview.aiConfidence
        });
      },
      { maxRetries: 3 }
    );

    console.log(`✅ AI article review completed for: "${title}"`);
    
    return {
      articleId,
      status: contentReview.nsfwDetected ? 'flagged' : 'approved',
      review: contentReview,
      storageId: storageResult.id,
      aiConfidence: contentReview.aiConfidence,
      timestamp: new Date()
    };
  }
);

// AI-Powered Helper Functions
async function aiCleanAndSecureHtml(html: string): Promise<string> {
  const prompt = `
You are an HTML security expert. Clean and secure this HTML content by:

1. Remove ALL script tags and inline event handlers
2. Remove dangerous attributes (onclick, onload, javascript:, etc.)
3. Fix any HTML syntax issues while preserving the visual layout
4. Keep all CSS and styling intact
5. Ensure no XSS vulnerabilities remain
6. Maintain the original content structure and UI

HTML to clean:
${html}

Return ONLY the cleaned HTML without any explanations.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "alibaba/tongyi-deepresearch-30b-a3b:free",
      messages: [
        {
          role: "system",
          content: "You are an HTML security expert that returns only cleaned HTML code."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });

    return completion.choices[0].message.content?.trim() || html;
  } catch (error) {
    console.error("AI HTML cleaning failed, using fallback:", error);
    // Fallback basic cleaning
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/on\w+="[^"]*"/g, '')
              .replace(/javascript:/gi, '');
  }
}

async function aiParseArticleToJson(html: string, metadata: any): Promise<any> {
  const prompt = `
Parse this HTML article content into a structured JSON format. Extract:

1. Title and main heading
2. Author information
3. Publication date if available
4. Main content text (clean, without HTML tags)
5. Key sections and subtitles
6. Images and media references
7. Categories/tags
8. Summary/abstract

Metadata provided: ${JSON.stringify(metadata)}

HTML content:
${html}

Return ONLY valid JSON without any additional text.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "alibaba/tongyi-deepresearch-30b-a3b:free",
      messages: [
        {
          role: "system",
          content: "You are a data extraction expert that returns only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const jsonString = completion.choices[0].message.content?.trim();
    return JSON.parse(jsonString || '{}');
  } catch (error) {
    console.error("AI JSON parsing failed:", error);
    return {
      ...metadata,
      content: html.replace(/<[^>]*>/g, '').substring(0, 1000),
      sections: [],
      error: "Parsing failed"
    };
  }
}

async function aiReviewContent(articleData: any): Promise<any> {
  const prompt = `
Comprehensively review this article content for:

1. SPELLING ERRORS: List all spelling mistakes with corrections
2. GRAMMAR ISSUES: Identify grammatical errors with fixes
3. NSFW CONTENT: Detect any inappropriate, adult, or unsafe content
4. CONTENT QUALITY: Assess readability, structure, and engagement
5. FACTUAL ACCURACY: Flag any obvious factual inaccuracies
6. TONE ANALYSIS: Evaluate appropriateness of tone

Article Data:
${JSON.stringify(articleData, null, 2)}

Return a JSON object with this structure:
{
  "spellingErrors": [{ "word": "incorect", "correction": "incorrect", "context": "sentence" }],
  "grammarIssues": [{ "issue": "subject-verb agreement", "fix": "suggested correction", "context": "sentence" }],
  "nsfwDetected": boolean,
  "nsfwReasons": ["reason1", "reason2"],
  "contentQuality": { "score": 0-10, "feedback": "detailed feedback" },
  "factualAccuracy": { "score": 0-10, "issues": ["issue1", "issue2"] },
  "toneAnalysis": { "appropriate": boolean, "description": "tone description" },
  "overallScore": 0-10,
  "aiConfidence": 0-1
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "alibaba/tongyi-deepresearch-30b-a3b:free",
      messages: [
        {
          role: "system",
          content: "You are a content review expert that returns only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.2
    });

    const jsonString = completion.choices[0].message.content?.trim();
    return JSON.parse(jsonString || '{}');
  } catch (error) {
    console.error("AI content review failed:", error);
    return {
      spellingErrors: [],
      grammarIssues: [],
      nsfwDetected: false,
      nsfwReasons: [],
      contentQuality: { score: 5, feedback: "Review failed" },
      factualAccuracy: { score: 5, issues: ["Review system error"] },
      toneAnalysis: { appropriate: true, description: "Unable to analyze" },
      overallScore: 5,
      aiConfidence: 0,
      error: "AI review failed"
    };
  }
}

// Storage function (mock implementation)
async function storeReviewedArticle(article: any): Promise<{ id: string; url: string }> {
  // In real implementation, this would save to database
  const storageId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📁 Storing article with ID: ${storageId}`);
  
  // Simulate storage delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    id: storageId,
    url: `/articles/${storageId}`
  };
}

// Example usage
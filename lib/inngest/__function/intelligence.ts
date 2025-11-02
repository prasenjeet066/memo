import { inngest } from "@/lib/inngest/client";
import { RecordDAL } from "@/lib/dal/record.dal";
import openAi from "@/lib/utils/ai/openai";
import { AI_PROMPTS } from "@/lib/utils/prompt";
import {
  ResearchResult,
  ArticleResult,
  SearchResult,
  CrawlResult,
  DatabaseResult,
  ArticleEvent,
} from "@/types/bot";

/**
 * Configuration
 */
const CONFIG = {
  AI_MODEL: "openai/gpt-oss-safeguard-20b:groq",
  SEARCH_API_URL: "https://memoorg.vercel.app/api/search",
  CRAWL_API_URL: "https://sistorica-python.onrender.com/api/", // TODO: Add your actual crawl API URL
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
  MAX_SEARCH_QUERIES: 5,
} as const;

/**
 * Utility: Retry helper with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.RETRY_ATTEMPTS,
  delay = CONFIG.RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`Retrying after error: ${String(err)}`);
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Utility: Safe JSON parse
 */
function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("JSON parsing error:", err);
    return fallback;
  }
}

/**
 * Utility: Validate research result
 */
function isValidResearchResult(data: any): data is ResearchResult {
  return (
    data &&
    typeof data.RevisedName === "string" &&
    typeof data.articleCategory === "string" &&
    Array.isArray(data.SearchQuerys) &&
    Array.isArray(data.KeyFacts) &&
    Array.isArray(data.Sources) &&
    typeof data.ResearchSummary === "string"
  );
}

/**
 * Utility: Validate article result
 */
function isValidArticleResult(data: any): data is ArticleResult {
  return (
    data &&
    Array.isArray(data.ImagesUrls) &&
    typeof data.Sections === "string" &&
    Array.isArray(data.ReferenceList) &&
    data.SchemaOrg &&
    typeof data.SchemaOrg["@context"] === "string" &&
    typeof data.Summary === "string"
  );
}

/**
 * Step 1: Perform AI research with web search
 */
async function performAIResearch(slug: string): Promise<ResearchResult> {
  const response = await openAi.chat.completions.create({
    model: CONFIG.AI_MODEL,
    messages: [
      {
        role: "system",
        content: AI_PROMPTS.RESEARCH_SYSTEM,
      },
      {
        role: "user",
        content: AI_PROMPTS.RESEARCH_USER(slug),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "research_results",
        schema: {
          type: "object",
          properties: {
            RevisedName: {
              type: "string",
              description: "Corrected name with proper spelling",
            },
            articleCategory: {
              type: "string",
              description: "Category of the entity",
            },
            SearchQuerys: {
              type: "array",
              items: { type: "string" },
              description: "All search queries for knowledge",
            },
            KeyFacts: {
              type: "array",
              items: { type: "string" },
              description: "Important facts discovered",
            },
            Sources: {
              type: "array",
              items: { type: "string" },
              description: "Source URLs used",
            },
            ResearchSummary: {
              type: "string",
              description: "Summary of research findings",
            },
          },
          required: [
            "RevisedName",
            "SearchQuerys",
            "articleCategory",
            "KeyFacts",
            "Sources",
            "ResearchSummary",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse<Partial<ResearchResult>>(content, {});

  if (!isValidResearchResult(parsed)) {
    throw new Error("Invalid research result structure");
  }

  return parsed;
}

/**
 * Step 2: Crawl a single URL
 */
async function crawlUrl(url: string, query: string): Promise<CrawlResult> {
  try {
    const response = await fetch(
      `${CONFIG.CRAWL_API_URL}?url=${encodeURIComponent(url)}`
    ,{
      method: 'POST'
    });

    if (!response.ok) {
      return {
        query,
        url,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (data.plain_text && data.plain_text.trim() !== "") {
      return {
        plainText: data.plain_text,
        author: data.author,
        date: data.publication_date,
      };
    }

    return {
      query,
      url,
      error: "No content available",
    };
  } catch (error) {
    return {
      query,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 3: Perform web searches and crawl results
 */
async function performWebSearch(
  queries: string[]
): Promise<SearchResult[]> {
  if (!queries || queries.length === 0) {
    return [];
  }

  // Limit number of queries to prevent API abuse
  const limitedQueries = queries.slice(0, CONFIG.MAX_SEARCH_QUERIES);

  const searchResults = await Promise.allSettled(
    limitedQueries.map(async (query): Promise<SearchResult> => {
      try {
        const searchResponse = await fetch(
          `${CONFIG.SEARCH_API_URL}?q=${encodeURIComponent(query)}`
        );

        if (!searchResponse.ok) {
          return {
            query,
            results: [],
            error: `Search API returned status ${searchResponse.status}`,
          };
        }

        const searchData = await searchResponse.json();

        // Crawl up to 3 URLs per query
        const urls = searchData.items?.slice(0, 3).map((item: any) => item.link) || [];
        
        const crawlResults = await Promise.allSettled(
          urls.map((url: string) => crawlUrl(url, query))
        );

        const crawlData = crawlResults
          .filter((result): result is PromiseFulfilledResult<CrawlResult> => 
            result.status === "fulfilled"
          )
          .map((result) => result.value);

        return {
          query,
          crawl: crawlData,
        };
      } catch (error) {
        return {
          query,
          results: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return searchResults
    .filter((result): result is PromiseFulfilledResult<SearchResult> => 
      result.status === "fulfilled"
    )
    .map((result) => result.value);
}

/**
 * Step 4: Generate article from research
 */
async function generateArticle(
  research: ResearchResult
): Promise<ArticleResult> {
  const response = await openAi.chat.completions.create({
    model: CONFIG.AI_MODEL,
    messages: [
      {
        role: "system",
        content: AI_PROMPTS.ARTICLE_SYSTEM,
      },
      {
        role: "user",
        content: AI_PROMPTS.ARTICLE_USER(research),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "article_output",
        schema: {
          type: "object",
          properties: {
            ImagesUrls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  caption: { type: "string" },
                  size: { type: "string" },
                },
                required: ["url"],
                additionalProperties: false,
              },
            },
            Sections: {
              type: "string",
              description: "Full article in Markdown format",
            },
            ReferenceList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string" },
                },
                required: ["title"],
                additionalProperties: false,
              },
            },
            SchemaOrg: {
              type: "object",
              properties: {
                "@context": { type: "string" },
                "@type": { type: "string" },
                name: { type: "string" },
              },
              required: ["@context", "@type", "name"],
              additionalProperties: true,
            },
            Summary: {
              type: "string",
            },
          },
          required: [
            "ImagesUrls",
            "Sections",
            "SchemaOrg",
            "ReferenceList",
            "Summary",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content || "{}";
  const parsed = safeJsonParse<Partial<ArticleResult>>(content, {});

  if (!isValidArticleResult(parsed)) {
    throw new Error("Invalid article result structure");
  }

  return parsed;
}

/**
 * Step 5: Save article to database
 */
async function saveToDatabase(
  article: ArticleResult,
  research: ResearchResult,
  userid: string,
  username: string
): Promise<DatabaseResult> {
  try {
    const record = await RecordDAL.createRecord(
      {
        title: research.RevisedName,
        content: article.Sections,
        content_type: "mkd",
        summary: article.Summary,
        categories: [research.articleCategory],
        tags: [],
        references: article.ReferenceList,
        schemaOrg: article.SchemaOrg,
      },
      userid,
      username,
      article.SchemaOrg
    );

    return {
      success: true,
      recordId: record._id,
      slug: record.slug,
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main Function: Process Article with AI
 */
export const articleIntelligenceFunction = inngest.createFunction(
  {
    id: "article-ai-submission",
    name: "Process Article With AI",
  },
  { event: "article/ai/worker" },
  async ({ event, step }) => {
    const { data } = event as ArticleEvent;
    const { slug, userid, username } = data;

    /**
     * STEP 1: AI reasoning and research
     */
    const research = await step.run(
      "ai_research_with_web",
      async () => await retry(() => performAIResearch(slug))
    );

    /**
     * STEP 2: Web search and content crawling
     */
    const searchResults = await step.run(
      "web_search_and_crawl",
      async () => await performWebSearch(research.SearchQuerys)
    );

    /**
     * STEP 3: Generate comprehensive article
     */
    const article = await step.run(
      "generate_article",
      async () => await retry(() => generateArticle(research))
    );

    /**
     * STEP 4: Save to database
     */
    const databaseResult = await step.run(
      "save_to_database",
      async () => await saveToDatabase(article, research, userid, username)
    );

    /**
     * STEP 5: Return complete results
     */
    return {
      slug,
      research,
      searchResults,
      article,
      database: databaseResult,
    };
  }
);
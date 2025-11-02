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
  CRAWL_API_URL: "https://sistorica-python.vercel.app/scrape-llm",
  IMAGE_SEARCH_API: "https://api.unsplash.com/search/photos", // Add your Unsplash API key
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
  MAX_SEARCH_QUERIES: 5,
  MAX_URLS_PER_QUERY: 3,
  MAX_IMAGES: 5,
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
 * Step 1: Generate optimized search queries
 */
async function generateSearchQueries(slug: string): Promise<string[]> {
  const response = await openAi.chat.completions.create({
    model: CONFIG.AI_MODEL,
    messages: [
      {
        role: "system",
        content: AI_PROMPTS.QUERY_GENERATION_SYSTEM,
      },
      {
        role: "user",
        content: AI_PROMPTS.QUERY_GENERATION_USER(slug),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "search_queries",
        schema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: { type: "string" },
              description: "Optimized search queries",
            },
          },
          required: ["queries"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content || '{"queries":[]}';
  const parsed = safeJsonParse<{ queries: string[] }>(content, { queries: [slug] });
  return parsed.queries.slice(0, CONFIG.MAX_SEARCH_QUERIES);
}

/**
 * Step 2: Crawl a single URL with enhanced error handling
 */
async function crawlUrl(url: string, query: string): Promise<CrawlResult> {
  try {
    const response = await fetch(
      `${CONFIG.CRAWL_API_URL}?url=${encodeURIComponent(url)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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
        url: url,
        query: query,
        images: data.images,
        title: data.title || "",
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
 * Step 3: Perform web searches and crawl results (Perplexity-style)
 */
async function performWebSearch(queries: string[]): Promise<SearchResult[]> {
  if (!queries || queries.length === 0) {
    return [];
  }

  const searchResults = await Promise.allSettled(
    queries.map(async (query): Promise<SearchResult> => {
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

        // Extract URLs and metadata
        const items = searchData.items?.slice(0, CONFIG.MAX_URLS_PER_QUERY) || [];
        const urls = items.map((item: any) => ({
          url: item.link,
          title: item.title,
          snippet: item.snippet,
        }));

        // Crawl URLs in parallel
        const crawlResults = await Promise.allSettled(
          urls.map(({ url }: { url: string }) => crawlUrl(url, query))
        );

        const crawlData = crawlResults
          .filter(
            (result): result is PromiseFulfilledResult<CrawlResult> =>
              result.status === "fulfilled" && !result.value.error
          )
          .map((result) => result.value);

        return {
          query,
          crawl: crawlData,
          searchMetadata: urls,
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
    .filter(
      (result): result is PromiseFulfilledResult<SearchResult> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
}

/**
 * Step 4: Search for relevant images
 */
async function searchImages(topic: string): Promise<any[]> {
  try {
    // You can use Unsplash, Pexels, or your own image API
    // For now, returning empty array - implement based on your needs
    return [];
    
    /* Example Unsplash implementation:
    const response = await fetch(
      `${CONFIG.IMAGE_SEARCH_API}?query=${encodeURIComponent(topic)}&per_page=${CONFIG.MAX_IMAGES}`,
      {
        headers: {
          'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY'
        }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.results?.map((img: any) => ({
      url: img.urls.regular,
      caption: img.alt_description || topic,
      size: `${img.width}x${img.height}`,
      author: img.user.name,
      source: img.links.html,
    })) || [];
    */
  } catch (error) {
    console.error("Image search error:", error);
    return [];
  }
}

/**
 * Step 5: Perform AI research with web context
 */
async function performAIResearch(
  slug: string,
  searchResults: SearchResult[]
): Promise<ResearchResult> {
  const response = await openAi.chat.completions.create({
    model: CONFIG.AI_MODEL,
    messages: [
      {
        role: "system",
        content: AI_PROMPTS.RESEARCH_SYSTEM,
      },
      {
        role: "user",
        content: AI_PROMPTS.RESEARCH_USER(slug, searchResults),
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
              description: "All search queries used",
            },
            KeyFacts: {
              type: "array",
              items: { type: "string" },
              description: "Important facts with source references",
            },
            Sources: {
              type: "array",
              items: { type: "string" },
              description: "Source URLs used",
            },
            ResearchSummary: {
              type: "string",
              description: "Summary with inline citations",
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
 * Step 6: Generate article with citations (Perplexity-style)
 */
async function generateArticle(
  research: ResearchResult,
  searchResults: SearchResult[],
  images: any[]
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
        content: AI_PROMPTS.ARTICLE_USER(research, searchResults, images),
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
                  author: { type: "string" },
                  source: { type: "string" },
                },
                required: ["url"],
                additionalProperties: false,
              },
            },
            Sections: {
              type: "string",
              description: "Full article in Markdown with inline citations",
            },
            ReferenceList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string" },
                  index: { type: "number" },
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
 * Step 7: Save article to database
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
        summary: 'New Created',
        categories: [research.articleCategory],
        tags: [],
        references: article.ReferenceList,
        schemaOrg: article.SchemaOrg,
        images: article.ImagesUrls,
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
 * Main Function: Process Article with AI (Perplexity-style)
 */
export const articleIntelligenceFunction = inngest.createFunction(
  {
    id: "article-ai-submission",
    name: "Process Article With AI ",
  },
  { event: "article/ai/worker" },
  async ({ event, step }) => {
    const { data } = event as ArticleEvent;
    const { slug, userid, username } = data;

    /**
     * STEP 1: Generate optimized search queries
     */
    const searchQueries = await step.run(
      "generate_search_queries",
      async () => await retry(() => generateSearchQueries(slug))
    );

    /**
     * STEP 2: Perform web search and crawl content
     */
    const searchResults = await step.run(
      "web_search_and_crawl",
      async () => await performWebSearch(searchQueries)
    );

    /**
     * STEP 3: Search for relevant images
     */
    const images = await step.run(
      "search_images",
      async () => await searchImages(slug)
    );

    /**
     * STEP 4: AI research with web context
     */
    const research = await step.run(
      "ai_research_with_context",
      async () => await retry(() => performAIResearch(slug, searchResults))
    );

    /**
     * STEP 5: Generate article with inline citations
     */
    const article = await step.run(
      "generate_article_with_citations",
      async () =>
        await retry(() => generateArticle(research, searchResults, images))
    );

    /**
     * STEP 6: Save to database
     */
    const databaseResult = await step.run(
      "save_to_database",
      async () => await saveToDatabase(article, research, userid, username)
    );

    /**
     * STEP 7: Return complete results
     */
    return {
      slug,
      searchQueries,
      research,
      searchResults,
      images,
      article,
      database: databaseResult,
    };
  }
);
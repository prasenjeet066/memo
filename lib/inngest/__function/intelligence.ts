import { inngest } from "@/lib/inngest/client";
import { RecordDAL } from "@/lib/dal/record.dal";
import { UserDAL } from "@/lib/dal/user.dal";
import openAi from "@/lib/utils/ai/openai";

// Fixed interface to match the actual API response
interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface OutputWebSearch {
  query: string;
  results: SearchResult[];
}

// Interface for scraped data response
interface ScrapedData {
  url: string;
  status_code: number;
  scraped_at: string;
  metadata: {
    title: string | null;
    description: string | null;
    keywords: string[] | null;
    author: string | null;
    published_date: string | null;
    modified_date: string | null;
    canonical_url: string | null;
    language: string | null;
    og_tags: Record<string, any>;
    twitter_tags: Record<string, any>;
    schema_org: any[];
  };
  content: {
    headings: Record<string, string[]>;
    paragraphs: string[];
    lists: any[];
    tables: any[];
    code_blocks: string[];
    quotes: string[];
    text_content: string;
    word_count: number;
  };
  media: Record<string, any>;
  links: Record<string, string[]>;
  structured_data: Record<string, any>;
}

import { CreateRecordDTO, UpdateRecordDTO } from "@/lib/dtos/record.dto";

export const articleIntelligenceFunction = inngest.createFunction(
  {
    id: "article-ai-submission",
    name: "Process Article With AI",
  },
  { event: "article/ai/worker" },
  async ({ event, step }) => {
    const { data } = event;
    const __slug = data.slug;

    /**
     * STEP 1: AI reasoning about the topic
     */
    const __call__thinking = await step.run("ai_thinking", async () => {
      const __output = await openAi.chat.completions.create({
        model: "nvidia/nemotron-nano-9b-v2:free",
        messages: [
          {
            role: "system",
            content: `You are a reasoning AI. When given a topic or name, respond with:
            - articleCategory: What kind of entity it is (e.g., "people", "country").
            - WebSearchRequests: A list of useful web search queries to gather detailed info about it.`,
          },
          {
            role: "user",
            content: `Topic or name or subject is "${__slug}"`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "results",
            schema: {
              type: "object",
              properties: {
                articleCategory: { type: "string" },
                WebSearchRequests: { type: "array", items: { type: "string" } },
              },
              required: ["articleCategory", "WebSearchRequests"],
            },
          },
        },
      });

      // Parse AI output safely
      try {
        return JSON.parse(__output.choices?.[0]?.message?.content || "{}");
      } catch (err) {
        console.error("AI parsing error:", err);
        return {};
      }
    });

    /**
     * STEP 2: Perform web search requests based on AI output
     */
    const __call__websearch: OutputWebSearch[] = await step.run(
      "websearch_request",
      async () => {
        if (!__call__thinking) return [];

        const { articleCategory, WebSearchRequests } = __call__thinking;

        if (Array.isArray(WebSearchRequests) && WebSearchRequests.length > 0) {
          const __all_index = await Promise.all(
            WebSearchRequests.map(async (r) => {
              try {
                const res = await fetch(
                  "https://memoorg.vercel.app/api/search?q=" +
                    encodeURIComponent(r),
                  { method: "GET" }
                );

                if (!res.ok) {
                  console.error("Search API returned error:", res.status);
                  return { query: r, results: [] };
                }

                const data = await res.json();
                // The API returns { query, results_count, results, start_index }
                return { query: r, results: data };
              } catch (error) {
                console.error("Web search error:", error);
                return { query: r, results: [] };
              }
            })
          );

          return __all_index;
        }

        return [];
      }
    );

    /**
     * STEP 3: Scrape content from search results
     */
    const __gather__data = await step.run("gather-run", async () => {
      if (__call__websearch.length === 0) {
        console.log("No search results to scrape");
        return [];
      }

      // Collect all URLs from all search queries (limit to top 3 per query)
      const allUrls: string[] = [];
      for (const search of __call__websearch) {
        if (search.results && Array.isArray(search.results)) {
          const urls = search.results
            .slice(0, 3) // Limit to top 3 results per query
            .map((result) => result.link)
            .filter((link) => link); // Filter out any undefined/null links
          
          allUrls.push(...urls);
        }
      }

      // Remove duplicates
      const uniqueUrls = [...new Set(allUrls)];
      console.log(`Scraping ${uniqueUrls.length} unique URLs`);

      if (uniqueUrls.length === 0) {
        console.log("No valid URLs to scrape");
        return [];
      }

      // Scrape all URLs concurrently
      const scrapedData = await Promise.allSettled(
        uniqueUrls.map(async (url) => {
          try {
            // Use query parameter format for the scrape endpoint
            const __scrape = await fetch(
              `https://sistorica-python.vercel.app/api/scrape?url=${encodeURIComponent(url)}&include_images=false&include_links=true&max_content_length=30000`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }
            );

            if (!__scrape.ok) {
              const errorText = await __scrape.text();
              console.error(
                `Scraping failed for ${url}:`,
                __scrape.status,
                errorText
              );
              return null;
            }

            const json: ScrapedData = await __scrape.json();
            console.log(`Successfully scraped: ${url}`);
            return json;
          } catch (err) {
            console.error("Scraping error for", url, ":", err);
            return null;
          }
        })
      );

      // Filter out failed requests and extract successful data
      const successfulScrapes = scrapedData
        .filter(
          (result): result is PromiseFulfilledResult<ScrapedData | null> =>
            result.status === "fulfilled" && result.value !== null
        )
        .map((result) => result.value);

      console.log(
        `Successfully scraped ${successfulScrapes.length} out of ${uniqueUrls.length} URLs`
      );

      return successfulScrapes;
    });

    // Return combined results for debugging/logging
    return {
      slug: __slug,
      thinking: __call__thinking,
      websearch: __call__websearch,
      gatheredData: __gather__data,
      summary: {
        searchQueries: __call__websearch.length,
        totalSearchResults: __call__websearch.reduce(
          (sum, s) => sum + (s.results?.length || 0),
          0
        ),
        scrapedPages: __gather__data.length,
      },
    };
  }
);
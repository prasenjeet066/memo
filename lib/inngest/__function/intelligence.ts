import { inngest } from "@/lib/inngest/client";
import { RecordDAL } from "@/lib/dal/record.dal";
import { UserDAL } from "@/lib/dal/user.dal";
import openAi from "@/lib/utils/ai/openai";
import { CreateRecordDTO, UpdateRecordDTO } from "@/lib/dtos/record.dto";
import {markdownToHtml} from "@/lib/editor/templates/markdown"
/**
 * Interfaces
 */
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
    og_tags: Record < string,
    any > ;
    twitter_tags: Record < string,
    any > ;
    schema_org: any[];
  };
  content: {
    headings: Record < string,
    string[] > ;
    paragraphs: string[];
    lists: any[];
    tables: any[];
    code_blocks: string[];
    quotes: string[];
    text_content: string;
    word_count: number;
  };
  media: Record < string,
  any > ;
  links: Record < string,
  string[] > ;
  structured_data: Record < string,
  any > ;
}

/**
 * Utility: retry helper with exponential backoff
 */
async function retry < T > (
  fn: () => Promise < T > ,
  retries = 2,
  delay = 1000
): Promise < T > {
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
 * Main Function: Process Article with AI
 */
export const articleIntelligenceFunction = inngest.createFunction(
  {
    id: "article-ai-submission",
    name: "Process Article With AI",
  }, { event: "article/ai/worker" },
  async ({ event, step }) => {
    const { data } = event;
    const __slug = data.slug;
    const userid = data.userid;
    const username = data.username;
    
    /**
     * STEP 1: AI reasoning about the topic
     */
    const __call__thinking = await step.run("ai_thinking", async () => {
      const __output = await openAi.chat.completions.create({
        model: "openai/gpt-oss-safeguard-20b:groq",
        messages: [
        {
          role: "system",
          content: `You are a reasoning AI. When given a topic or name, respond with:
- RevisedName: A corrected version of the name/topic (fix typos/spelling)
- articleCategory: What kind of entity it is (e.g., "person", "country", "technology", "event")
- WebSearchRequests: An array of 2-4 useful web search queries to gather detailed info

Be concise and accurate.`,
        },
        {
          role: "user",
          content: `Topic or name or subject is "${__slug}"`,
        }, ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "results",
            schema: {
              type: "object",
              properties: {
                RevisedName: {
                  type: "string",
                  description: "Corrected name with proper spelling"
                },
                articleCategory: {
                  type: "string",
                  description: "Category of the entity"
                },
                WebSearchRequests: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of search queries"
                },
              },
              required: ["RevisedName", "articleCategory", "WebSearchRequests"],
              additionalProperties: false
            },
          },
        },
      });
      
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
        
        const { WebSearchRequests } = __call__thinking;
        
        if (Array.isArray(WebSearchRequests) && WebSearchRequests.length > 0) {
          const __all_index = await Promise.all(
            WebSearchRequests.map(async (r) => {
              try {
                const res = await fetch(
                  "https://memoorg.vercel.app/api/search?q=" +
                  encodeURIComponent(r), { method: "GET" }
                );
                
                if (!res.ok) {
                  console.error("Search API returned error:", res.status);
                  return { query: r, results: [] };
                }
                
                const data = await res.json();
                return { query: r, results: data.items || [] };
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
      if (!__call__websearch.length) {
        return [];
      }
      
      // Flatten all result links from all queries
      const allLinks = __call__websearch
        .flatMap((i) => i.results || [])
        .map((r) => r.link)
        .filter((link) => typeof link === "string" && link.trim() !== "");
      
      if (allLinks.length === 0) {
        return [];
      }
      
      console.log(`Scraping ${allLinks.length} URLs...`);
      
      // Scrape all URLs concurrently with retry
      const scrapedData = await Promise.all(
        allLinks.map((link) =>
          retry(async () => {
            const res = await fetch(
              `https://sistorica-python.vercel.app/api/scrape?url=${encodeURIComponent(
                link
              )}&include_images=false&include_links=true&max_content_length=30000`, { method: "POST", headers: { "Content-Type": "application/json" } }
            );
            
            if (!res.ok) {
              console.error(`Scraping failed for ${link}:`, res.status);
              return { url: link, error: `HTTP ${res.status}` };
            }
            
            const json = await res.json();
            
            if (json?.details === "Not found") {
              console.warn(`Not found for ${link}`);
              return { url: link, error: "Not found" };
            }
            
            console.log(`✅ Successfully scraped: ${link}`);
            return json as ScrapedData;
          })
        )
      );
      
      // Filter out invalid/failed responses
      const validData = scrapedData.filter(
        (d: any) => d && !d.error && !d.details && d.content
      );
      
      console.log(
        `Scraped ${validData.length} valid pages out of ${allLinks.length}`
      );
      
      return validData;
    });
    
    const InvestigateWithSrc = await step.run("investigate", async () => {
      if (__gather__data.length < 1) {
        // Failed to search integration - write without web data
        const WriteWithoutWebIntegration = await openAi.chat.completions.create({
          model: "openai/gpt-oss-safeguard-20b:groq",
          messages: [
          {
            role: "system",
            content: `You are a wiki article generator. Create a comprehensive article with:
- ImagesUrls: Array of image objects with url, caption, and size properties
- Sections: Array of section objects with name and text (HTML formatted) properties
- ReferenceList: Array of reference objects with title, url, and source properties
- SchemaOrg: A valid schema.org JSON-LD object for SEO

Write detailed, informative content. Use proper HTML formatting in section text.`,
          },
          {
            role: "user",
            content: `Create a wiki article about: "${
                __call__thinking.RevisedName || __slug
              }" (Category: ${__call__thinking.articleCategory || "Unknown"})`,
          }, ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "results",
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
                        size: { type: "string" }
                      },
                      required: ["url"],
                      additionalProperties: false
                    },
                    description: "Array of image objects"
                  },
                  Sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        text: { type: "string" }
                      },
                      required: ["name", "text"],
                      additionalProperties: false
                    },
                    description: "Array of article sections with HTML content"
                  },
                  ReferenceList: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        source: { type: "string" }
                      },
                      required: ["title"],
                      additionalProperties: false
                    },
                    description: "Array of references"
                  },
                  SchemaOrg: {
                    type: "object",
                    properties: {
                      "@context": { type: "string" },
                      "@type": { type: "string" },
                      name: { type: "string" }
                    },
                    required: ["@context", "@type", "name"],
                    additionalProperties: true,
                    description: "Schema.org JSON-LD object"
                  },
                },
                required: ["ImagesUrls", "Sections", "SchemaOrg", "ReferenceList"],
                additionalProperties: false
              },
            },
          },
        });
        
        try {
          return JSON.parse(
            WriteWithoutWebIntegration.choices?.[0]?.message?.content || "{}"
          );
        } catch (err) {
          console.error("AI parsing error:", err);
          return {};
        }
      }
      
      // TODO: Process gathered data when available
      // For now, use the same structure with web data
      const WriteWithWebData = await openAi.chat.completions.create({
        model: "openai/gpt-oss-safeguard-20b:groq",
        messages: [
        {
          role: "system",
          content: `You are a wiki article generator. Using the provided web scraped data, create a comprehensive article with:
- summary: short summary about this article and edition 
- ImagesUrls: Array of image objects with url, caption, and size properties
- Sections: Wiki or Article  (Markdown formatted) properties.
- ReferenceList: Array of reference objects with title, url, and source properties (use scraped sources)
- SchemaOrg: A valid schema.org JSON-LD object for SEO

Write detailed, informative content based on the sources. Use proper HTML formatting in section text.`,
        },
        {
          role: "user",
          content: `Create a wiki article about: "${
              __call__thinking.RevisedName || __slug
            }" (Category: ${__call__thinking.articleCategory || "Unknown"})

Scraped data from ${__gather__data.length} sources:
${JSON.stringify(__gather__data.slice(0, 3).map(d => ({
  url: d.url,
  title: d.metadata?.title,
  content: d.content?.text_content?.slice(0, 1000)
})))}`,
        }, ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "results",
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
                      size: { type: "string" }
                    },
                    required: ["url"],
                    additionalProperties: false
                  }
                },
                Sections: {
                  type: 'text'
                },
                ReferenceList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      url: { type: "string" },
                      source: { type: "string" }
                    },
                    required: ["title"],
                    additionalProperties: false
                  }
                },
                SchemaOrg: {
                  type: "object",
                  properties: {
                    "@context": { type: "string" },
                    "@type": { type: "string" },
                    name: { type: "string" }
                  },
                  required: ["@context", "@type", "name"],
                  additionalProperties: true
                },
                Summary: {
                  type: 'string'
                }
              },
              required: ["ImagesUrls", "Sections", "SchemaOrg", "ReferenceList", "Summary"],
              additionalProperties: false
            },
          },
        },
      });
      
      try {
        return JSON.parse(
          WriteWithWebData.choices?.[0]?.message?.content || "{}"
        );
      } catch (err) {
        console.error("AI parsing error with web data:", err);
        return {};
      }
    });
    
    const fillDataToMarkup = await step.run("markup", async () => {
      if (InvestigateWithSrc.Sections && InvestigateWithSrc.SchemaOrg) {
        const __heading = await markdownToHtml(InvestigateWithSrc.Sections);
        
        const __infobox = InvestigateWithSrc.SchemaOrg;
        const __refList = InvestigateWithSrc.ReferenceList;
        const __imgList = InvestigateWithSrc.ImagesUrls;
        
        // insert to db ...
        let dto = {
          title: __call__thinking.RevisedName,
          content: __heading,
          summary: InvestigateWithSrc.Summary || 'None',
          categories: __call__thinking.articleCategory,
          schemaOrg: InvestigateWithSrc.SchemaOrg || {},
        };
        
        try {
          const resp = await RecordDAL.createRecord(dto, userid, username);
          return resp;
        } catch (e) {
          console.error("Database error:", e);
          return { error: String(e) };
        }
      }
      return { error: "No sections or schema generated" };
    });
    
    /**
     * STEP 4: Return results for logging or further processing
     */
    return {
      slug: __slug,
      thinking: __call__thinking,
      websearch: __call__websearch,
      gatheredData: __gather__data,
      investigation: InvestigateWithSrc,
      markup: fillDataToMarkup,
    };
  }
);
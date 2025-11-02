import { inngest } from "@/lib/inngest/client";
import { RecordDAL } from "@/lib/dal/record.dal";
import { UserDAL } from "@/lib/dal/user.dal";
import openAi from "@/lib/utils/ai/openai";
import { CreateRecordDTO, UpdateRecordDTO } from "@/lib/dtos/record.dto";
import { markdownToHtml } from "@/lib/editor/templates/markdown";

/**
 * Interfaces
 */
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
 * Main Function: Process Article with AI using OpenAI Web Search
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
     * STEP 1: AI reasoning and web search in one call
     * Using OpenAI's web search capability to gather information
     */
    const __call__research = await step.run("ai_research_with_web", async () => {
      const __output = await openAi.chat.completions.create({
        model: "openai/gpt-oss-safeguard-20b:groq", // Use a model that supports web search
        messages: [
        {
          role: "system",
          content: `
          
You are a research AI with web search capabilities. When given a topic, you will:
1. Search the web for comprehensive information
2. Analyze and synthesize the findings
3. Provide structured output

Respond with:
- RevisedName: Corrected/standardized name of the topic
- articleCategory: Entity type (person, place, technology, event, etc.)
- KeyFacts: Array of important facts discovered
- SearchQuerys: Array of all search querys
- Sources: Array of source URLs used
- ResearchSummary: Brief summary of findings

Be thorough and use current web information.`,
        },
        {
          role: "user",
          content: `Research and gather comprehensive information about: "${__slug}" Please search the web for reliable sources and provide detailed findings.`,
        }, ],
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
                  description: "All search query for knowledge."
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
      
      try {
        return JSON.parse(__output.choices?.[0]?.message?.content || "{}");
      } catch (err) {
        console.error("AI parsing error:", err);
        return {};
      }
    });
    const SearchUse = await step.run('search', async () => {
      const querys = __call__research.SearchQuerys;
      
      if (!querys || !querys.length) {
        return [];
      }
      
      // Run all searches in parallel
      const searchMap = await Promise.all(
        querys.map(async (q) => {
          try {
            const s = await fetch(`https://memoorg.vercel.app/api/search?q=${encodeURIComponent(q)}`);
            
            if (!s.ok) {
              return {
                query: q,
                results: [],
                error: `Search API returned status ${s.status}`
              };
            }
            
            const res = await s.json();
          
              const Crawl = await Promise.all(res.items.map((urli)=>{
                const url = urli.link;
                try {
                  const ce = await fetch('');
                  if (!ce.ok) {
                    return {
                      query: q,
                      url,
                      error: ce.statusText
                    }
                  }
                  const j = await ce.json();
                  if (j.plain_text.trim()!=='') {
                    return {
                      plainText : j.plain_text,
                      author: j.author,
                      date : j.publication_date
                    }
                  }
                } catch (e) {
                  return {
                    query: q,
                    url,
                    error: ''
                  }
                }
              }))
            
            return {
              query: q ,
              crawl: Crawl 
            }
          } catch (e) {
            return {
              query: q,
              results: [],
              error: e.message || 'Unknown error'
            };
          }
        })
      );
      
      return searchMap;
    });
    /**
     * STEP 2: Generate comprehensive article using research data
     */
    const __generate__article = await step.run(
      "generate_article",
      async () => {
        if (!__call__research || !__call__research.RevisedName) {
          return { error: "Research step failed" };
        }
        
        const articlePrompt = `Based on the research findings, create a comprehensive wiki article about "${__call__research.RevisedName}".

Research Summary:
${__call__research.ResearchSummary}

Key Facts:
${__call__research.KeyFacts?.join("\n- ") || "No facts available"}

Category: ${__call__research.articleCategory}

Create a well-structured article with proper sections, references, and schema.org markup.`;
        
        const __output = await openAi.chat.completions.create({
          model: "openai/gpt-oss-safeguard-20b:groq",
          messages: [
          {
            role: "system",
            content: `You are a professional wiki article writer. Create comprehensive, well-structured articles with:
- summary: Concise article summary
- ImagesUrls: Array of relevant image objects (if applicable)
- Sections: Write a comprehensive wiki-style article in Markdown Extra (MDX) format. The article should include:A clear and descriptive title.Proper headings and subheadings for sections (H1, H2, H3, etc.) to organize the content logically.Detailed content for each section, written in an encyclopedic and neutral tone.Tables, lists, links, images, or code snippets where appropriate to enhance understanding.Internal and external references/links formatted correctly in MDX.Optional: Short summary or introduction at the beginning and a conclusion or key points section at the end.Ensure accurate information, clarity, and readability. Avoid filler content.Include any relevant citations, references, or sources at the end in a proper format.
- ReferenceList: Array of reference objects from sources
- SchemaOrg: Valid schema.org JSON-LD object for SEO

Write detailed, informative content with proper citations and structure.`,
          },
          {
            role: "user",
            content: articlePrompt,
          }, ],
          
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
        
        try {
          return JSON.parse(__output.choices?.[0]?.message?.content || "{}");
        } catch (err) {
          console.error("Article generation parsing error:", err);
          return { error: "Failed to parse article" };
        }
      }
    );
    
    /**
     * STEP 3: Save to database
     */
    const __save__to__db = await step.run("save_to_database", async () => {
      if (
        __generate__article.error ||
        !__generate__article.Sections ||
        !__generate__article.SchemaOrg
      ) {
        return { error: "Article generation incomplete" };
      }
      
      const dto = {
        title: __call__research.RevisedName,
        content: __generate__article.Sections,
        content_type: "mkd",
        summary: "None",
        categories: [__call__research.articleCategory],
        tags: [],
        references: __generate__article.ReferenceList || [],
        schemaOrg: __generate__article.SchemaOrg || {},
      };
      
      try {
        const record = await RecordDAL.createRecord(
          dto,
          userid,
          username,
          dto.schemaOrg
        );
        
        return {
          success: true,
          recordId: record._id,
          slug: record.slug,
        };
      } catch (e) {
        console.error("Database error:", e);
        return { error: String(e) };
      }
    });
    
    /**
     * STEP 4: Return complete results
     */
    return {
      slug: __slug,
      research: __call__research,
      article: __generate__article,
      database: __save__to__db,
    };
  }
);



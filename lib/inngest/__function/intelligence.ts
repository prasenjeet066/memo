import { inngest } from "@/lib/inngest/client";
import { RecordDAL } from "@/lib/dal/record.dal";
import { UserDAL } from "@/lib/dal/user.dal";
import openAi from "@/lib/utils/ai/openai";

import { CreateRecordDTO, UpdateRecordDTO } from "@/lib/dtos/record.dto";

export const articleIntelligenceFunction = inngest.createFunction(
  {
    id: "article-ai-submission",
    name: "Process Article With AI",
  }, { event: "article/ai/worker" },
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
        }, ],
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
    const __call__websearch = await step.run("websearch_request", async () => {
      if (!__call__thinking) return {};
      
      const { articleCategory, WebSearchRequests } = __call__thinking;
      
      if (Array.isArray(WebSearchRequests) && WebSearchRequests.length > 0) {
        const __all_index = await Promise.all(
          WebSearchRequests.map(async (r) => {
            try {
              const res = await fetch(
                "https://sistorica-python.vercel.app/search?q=" + encodeURIComponent(r), { method: "GET" }
              );
              
              if (!res.ok) {
                console.error("Search API returned error:", res.status);
                return { query: r, results: [] };
              }
              
              const data = await res.json();
              return { query: r, results: data.results };
            } catch (error) {
              console.error("Web search error:", error);
              return { query: r, results: [] };
            }
          })
        );
        
        return __all_index;
        
      }
      
      return {};
    });
    
    // Return combined results for debugging/logging
    return {
      slug: __slug,
      thinking: __call__thinking,
      websearch: __call__websearch,
    };
  }
);
import { inngest } from "./client";
import { RecordDAL } from "@/lib/dal/record.dal";
import { UserDAL } from "@/lib/dal/user.dal";
import openAi from '@/lib/utils/ai/openai';

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
     * in this step - ai start to reasoning this topics 
     */
    const __call__thinking = await step.run('ai_thinking', async () => {
      const __output = await openAi.chat.completion({
        model: 'nvidia/nemotron-nano-9b-v2:free',
        message: [
        {
          role: 'system',
          message: `You are one.You are a thinker, if you are given a topic or a name, the responses you will make are:
          articleCategory: The topic or name is related to something, such as: Bangladesh - a country or an Asian country, Donald Trump - a person or the President of the USA, etc.
          WebSearchRequests: All the queries that need to be searched in the web browser to write a wiki or detailed information on the topic or name.
          `,
        },
        {
          role: 'user',
          message: `Topic or name or subject is "${__slug}"`
        }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "results",
            schema: {
              type: "object",
              properties: {
                articleCategory: { type: "string", enum: ["people", "country"] },
                WebSearchRequests: { type: "array", items: { type: 'string' } },
                
              },
              required: ["articleCategory", "WebSearchRequests"],
            },
          },
        }
      })
      return JSON.parse(__output.choices[0].message?.content || "{}");
      
    })
    const __call__websearch = await step.run('websearch_request', async () => {
      if (__call__thinking) {
        const { articleCategory, WebSearchRequests } = __call__thinking;
        if (Array.isArray(WebSearchRequests) && WebSearchRequests.length) {
          try {
            const __search_json_fetch = await fetch('https://sistorica-python.vercel.app/batch-search', {
              method: 'POST',
              body: WebSearchRequests,
              headers: { 'Content-Type': 'application/json' }
            });
            if (!__searched_json.ok) return {};
            
            const __searched_json = await __search_json_fetch.json()
            return __search_json_fetch.data;
          } catch (error) {
            return { error }
          }
        }
      }
    })
  })
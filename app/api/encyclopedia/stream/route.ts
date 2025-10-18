// app/api/encyclopedia/stream/route.ts
// Simplified one-step: brief encyclopedia summary (no HTML)

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// OpenRouter Setup
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Request Schema
const EncyclopediaRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  style: z.enum(['academic', 'casual', 'technical', 'simple']).default('academic'),
  includeReferences: z.boolean().default(false),
});

type EncyclopediaRequest = z.infer<typeof EncyclopediaRequestSchema>;

// Model Configuration
const CONTENT_MODEL = 'alibaba/tongyi-deepresearch-30b-a3b:free'; // main model

// Generate Prompt (short summary)
function generateShortPrompt(request: EncyclopediaRequest): string {
  const styleGuides = {
    academic: 'Use formal, scholarly tone with neutral language.',
    casual: 'Use accessible, conversational tone suitable for general readers.',
    technical: 'Use precise, domain-specific language for experts.',
    simple: 'Use simple and clear language for beginners or children.',
  };

  let prompt = `
You are a concise encyclopedia writer.

Write a short, Wikipedia-style summary about the topic: "${request.topic}"

REQUIREMENTS:
- Length: 100–300 words
- Avoid repetition or filler
`;

  if (request.includeReferences) {
    prompt += `
At the end, include a brief "References" section (2–3 short citations in plain text).
Example:
References:
- NASA, "Mars Exploration Program", 2023
- Britannica, "Quantum Mechanics", 2022
`;
  }

  return prompt;
}

// Stream generation (single-step)
async function streamArticle(
  request: EncyclopediaRequest,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
) {
  try {
    // Status update
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'status',
          message: 'Generating short encyclopedia summary...',
          step: 1,
        })}\n\n`
      )
    );

    const prompt = generateShortPrompt(request);
    let contentAccumulator = '';

    const contentStream = await openai.chat.completions.create({
      model: CONTENT_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert at writing concise encyclopedia summaries.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500, // short output
      temperature: 0.5,
      stream: true,
    });

    try {
      for await (const chunk of contentStream) {
        if ('error' in chunk) {
          throw new Error(chunk.error?.message || 'OpenRouter streaming error');
        }

        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          contentAccumulator += content;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                content,
              })}\n\n`
            )
          );

          // Optional safeguard: stop if >300 words
          if (contentAccumulator.split(/\s+/).length > 320) break;
        }
      }
    } catch (err) {
      throw new Error(`Error during content streaming: ${err instanceof Error ? err.message : err}`);
    }

    // Done
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'done',
          success: true,
          models: { content: CONTENT_MODEL },
          metadata: {
            topic: request.topic,
            summary: true,
            maxWords: 300,
          },
        })}\n\n`
      )
    );
  } catch (error) {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`
      )
    );
  }
}

// POST handler — main endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = EncyclopediaRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const request = validation.data;

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamArticle(request, encoder, controller);
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Encyclopedia stream error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET handler — info/help
export async function GET() {
  return new Response(
    JSON.stringify({
      message: 'Encyclopedia Summary API (Short Form)',
      description:
        'Generates a 100–300 word summary of a given topic in plain text (no HTML).',
      usage: 'POST to this endpoint with JSON body.',
      example: {
        topic: 'Artificial Intelligence',
        style: 'academic',
        includeReferences: true,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
// app/api/encyclopedia/stream/route.ts

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
  depth: z.enum(['brief', 'standard', 'comprehensive']).default('standard'),
  style: z.enum(['academic', 'casual', 'technical', 'simple']).default('academic'),
  includeReferences: z.boolean().default(true),
  sections: z.array(z.string()).optional(),
});

type EncyclopediaRequest = z.infer<typeof EncyclopediaRequestSchema>;

// Model Configuration with Fallbacks
const MODEL_CONFIG = [
  { name: 'deepseek/deepseek-r1:free', maxTokens: 4000, temperature: 0.7 },
  { name: 'mistralai/mistral-7b-instruct:free', maxTokens: 4000, temperature: 0.7 },
  // local model endpoint fallback (if you host one)
];

// Generate System Prompt
function generateSystemPrompt(style: string): string {
  const styleGuides = {
    academic: 'Write in a formal, scholarly tone suitable for academic publications. Use precise terminology and maintain objectivity.',
    casual: 'Write in an accessible, conversational tone while maintaining accuracy. Make complex topics easy to understand.',
    technical: 'Write with technical precision using domain-specific terminology. Assume the reader has advanced knowledge.',
    simple: 'Write in simple, clear language suitable for general audiences. Avoid jargon and explain all technical terms.',
  };

  return `You are an expert encyclopedia writer specializing in creating comprehensive, well-researched articles.

Style Guide: ${styleGuides[style as keyof typeof styleGuides]}

Requirements:
1. Structure the article with clear sections and subsections
2. Start with a concise introduction/overview
3. Use markdown formatting (headers, lists, emphasis)
4. Include relevant examples and context
5. Maintain factual accuracy and neutrality
6. Cite sources when possible
7. End with a conclusion or summary
8. Add related topics section if relevant

Format your response in clean markdown that can be directly rendered.`;
}

// Generate Article Prompt
function generateArticlePrompt(request: EncyclopediaRequest): string {
  const depthGuides = {
    brief: 'Write a concise article (500-800 words) covering the essential information.',
    standard: 'Write a comprehensive article (1200-2000 words) with detailed coverage of key aspects.',
    comprehensive: 'Write an in-depth article (2500-4000 words) with extensive details, examples, and analysis.',
  };

  let prompt = `Write an encyclopedia article about: "${request.topic}"

${depthGuides[request.depth]}

`;

  if (request.sections && request.sections.length > 0) {
    prompt += `\nInclude these specific sections:\n${request.sections.map(s => `- ${s}`).join('\n')}\n`;
  }

  if (request.includeReferences) {
    prompt += '\nInclude a "References" or "Further Reading" section at the end.\n';
  }

  prompt += '\nProvide accurate, well-researched content with proper citations where applicable.';

  return prompt;
}

// Stream Article Generation
async function streamArticle(
  request: EncyclopediaRequest,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
) {
  const systemPrompt = generateSystemPrompt(request.style);
  const userPrompt = generateArticlePrompt(request);

  let lastError: Error | null = null;
  let modelUsed = '';

  // Try each model in sequence
  for (const model of MODEL_CONFIG) {
    try {
      modelUsed = model.name;
      
      // Send metadata
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'metadata',
            model: model.name,
            topic: request.topic,
            depth: request.depth,
            style: request.style,
          })}\n\n`
        )
      );

      const stream = await openai.chat.completions.create({
        model: model.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: model.maxTokens,
        temperature: model.temperature,
        stream: true,
      });

      // Stream content chunks
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'content',
                content,
              })}\n\n`
            )
          );
        }
      }

      // Send completion
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'done',
            model: modelUsed,
            success: true,
          })}\n\n`
        )
      );

      return; // Success, exit
    } catch (error) {
      lastError = error as Error;
      console.error(`Model ${model.name} failed:`, error);

      // Send error notification
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'model_failed',
            model: model.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          })}\n\n`
        )
      );

      // Wait before trying next model
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // All models failed
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({
        type: 'error',
        error: `All models failed. Last error: ${lastError?.message || 'Unknown error'}`,
      })}\n\n`
    )
  );
}

// Main Route Handler
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const body = await req.json();
    const validationResult = EncyclopediaRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const request = validationResult.data;

    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'OPENROUTER_API_KEY not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create streaming response
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
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// GET handler for testing
export async function GET() {
  return new Response(
    JSON.stringify({
      message: 'Encyclopedia Article Streaming API',
      usage: 'POST to this endpoint with JSON body',
      example: {
        topic: 'Quantum Computing',
        depth: 'standard',
        style: 'academic',
        includeReferences: true,
        sections: ['History', 'Principles', 'Applications', 'Future'],
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
// app/api/encyclopedia/stream/route.ts
// Two-step Wikipedia-style article generation: Content → HTML

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

type EncyclopediaRequest = z.infer < typeof EncyclopediaRequestSchema > ;

// Model Configuration with Fallbacks
const CONTENT_MODEL = 'alibaba/tongyi-deepresearch-30b-a3b:free'; // For article content
const HTML_MODEL = 'qwen/qwen3-coder:free'; // For HTML conversion

// STEP 1: Generate Article Content
function generateContentPrompt(request: EncyclopediaRequest): string {
  const depthGuides = {
    brief: 'Write a concise encyclopedia article (500-800 words) covering essential information.',
    standard: 'Write a comprehensive encyclopedia article (1200-2000 words) with detailed coverage.',
    comprehensive: 'Write an in-depth encyclopedia article (2500-4000 words) with extensive details, examples, and analysis.',
  };
  
  const styleGuides = {
    academic: 'Use formal, scholarly language with precise terminology and objectivity.',
    casual: 'Use accessible, conversational language while maintaining accuracy.',
    technical: 'Use technical precision with domain-specific terminology.',
    simple: 'Use simple, clear language suitable for general audiences.',
  };
  
  let prompt = `You are writing a Wikipedia-style encyclopedia article about: "${request.topic}"

REQUIREMENTS:
${depthGuides[request.depth]}
${styleGuides[request.style]}

STRUCTURE YOUR ARTICLE WITH THESE SECTIONS:

1. **Lead/Introduction** (2-3 paragraphs)
   - Define the topic clearly
   - Provide context and significance
   - Summarize key points

2. **Main Content Sections**`;
  
  if (request.sections && request.sections.length > 0) {
    prompt += `
   Include these specific sections:
${request.sections.map(s => `   - ${s}`).join('\n')}`;
  } else {
    prompt += `
   - History/Background
   - Key Concepts/Components
   - Applications/Impact
   - Current State/Developments`;
  }
  
  prompt += `

3. **Additional Sections** (as relevant)
   - Notable Examples
   - Controversies/Challenges
   - Future Outlook

`;
  
  if (request.includeReferences) {
    prompt += `4. **References**
   - Include 5-10 credible sources
   - Format: Author/Organization, "Title", Publication, Year

`;
  }
  
  prompt += `5. **See Also** (Related Topics)
   - List 3-5 related articles

WRITING GUIDELINES:
- Use clear section headings marked with ##
- Write in third person, neutral tone
- Include specific facts, dates, and data
- Use examples to illustrate concepts
- Cite sources naturally in text
- Add relevant statistics or quotes
- Include key terminology and definitions
- Use bullet points for lists where appropriate

OUTPUT FORMAT:
Write the complete article in plain text/markdown format with clear section markers (##).
Focus on content quality, accuracy, and encyclopedic tone.
Do NOT output HTML - just the article content.`;
  
  return prompt;
}

// STEP 2: Convert to Wikipedia-Style HTML
function generateHTMLPrompt(articleContent: string): string {
  return `Convert the following encyclopedia article into semantic, Wikipedia-style HTML.

ARTICLE CONTENT:
${articleContent}

HTML STRUCTURE REQUIREMENTS:

1. **Container**: Wrap in <article class="wikipedia-article">

2. **Lead Section**: 
   <div class="lead-section">
     <p class="lead-paragraph">First paragraph</p>
     <p>Subsequent lead paragraphs</p>
   </div>

3. **Table of Contents** (auto-generate from sections):
   <nav class="toc">
     <div class="toc-title">Contents</div>
     <ol class="toc-list">
       <li><a href="#section-1">Section Name</a></li>
     </ol>
   </nav>

4. **Content Sections**:
   <section id="section-name" class="article-section">
     <h2 class="section-heading">Section Title</h2>
     <p>Content...</p>
   </section>

5. **Infobox** (if topic has key facts):
   <aside class="infobox">
     <div class="infobox-title">Topic Name</div>
     <table class="infobox-table">
       <tr><th>Label</th><td>Value</td></tr>
     </table>
   </aside>

6. **References Section**:
   <section id="references" class="references-section">
     <h2>References</h2>
     <ol class="reference-list">
       <li id="cite-1"><span class="reference-text">Citation</span></li>
     </ol>
   </section>

7. **See Also Section**:
   <section id="see-also" class="see-also-section">
     <h2>See also</h2>
     <ul class="see-also-list">
       <li><a href="#">Related Topic</a></li>
     </ul>
   </section>

CSS CLASSES TO USE:
- .wikipedia-article (main container)
- .lead-section (introductory paragraphs)
- .lead-paragraph (first paragraph, bold)
- .toc (table of contents)
- .toc-title, .toc-list
- .article-section (each content section)
- .section-heading (h2 headings)
- .infobox (sidebar info box if applicable)
- .infobox-title, .infobox-table
- .figure (for diagrams/images placeholders)
- .figure-caption
- .reference-list (numbered citations)
- .reference-text
- .see-also-list
- .subsection (h3 for subsections)
- .note-box (for important notes)
- .quote-box (for notable quotes)

IMPORTANT RULES:
1. Generate proper semantic HTML5
2. Use ONLY the CSS classes listed above
3. Create an infobox if the topic has key facts (dates, location, type, etc.)
4. Convert markdown lists to proper <ul> or <ol>
5. Make section IDs kebab-case (e.g., id="early-history")
6. Add Wikipedia-style inline citations like <sup class="reference">[1]</sup>
7. Keep the exact content but structure it properly
8. Add meta descriptions where helpful

OUTPUT:
Return ONLY the complete HTML code, no explanations or markdown.
Start with <article class="wikipedia-article"> and end with </article>.`;
}

// Stream Article Generation (Two-Step Process)
async function streamArticle(
  request: EncyclopediaRequest,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
) {
  try {
    // ============= STEP 1: Generate Article Content =============
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'status',
          message: 'Step 1/2: Generating article content...',
          step: 1
        })}\n\n`
      )
    );
    
    const contentPrompt = generateContentPrompt(request);
    let articleContent = '';
    
    const contentStream = await openai.chat.completions.create({
      model: CONTENT_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert encyclopedia writer.' },
        { role: 'user', content: contentPrompt }
      ],
      max_tokens: 2000, // safer token limit
      temperature: 0.7,
      stream: true,
    });
    
    try {
      for await (const chunk of contentStream) {
        // Check if provider returned an error in chunk
        if ('error' in chunk) {
          throw new Error(chunk.error?.message || 'Unknown OpenRouter error (content step)');
        }
        
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          articleContent += content;
          
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                step: 1,
                content
              })}\n\n`
            )
          );
        }
      }
    } catch (streamError) {
      throw new Error(`Error during content streaming: ${streamError instanceof Error ? streamError.message : streamError}`);
    }
    
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'status',
          message: 'Step 1 complete. Article content generated.',
          step: 1,
          complete: true
        })}\n\n`
      )
    );
    
    // ============= STEP 2: Convert to HTML =============
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'status',
          message: 'Step 2/2: Converting to Wikipedia-style HTML...',
          step: 2
        })}\n\n`
      )
    );
    
    const htmlPrompt = generateHTMLPrompt(articleContent);
    
    const htmlStream = await openai.chat.completions.create({
      model: HTML_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert at converting encyclopedia articles into semantic HTML.' },
        { role: 'user', content: htmlPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
      stream: true,
    });
    
    try {
      for await (const chunk of htmlStream) {
        if ('error' in chunk) {
          throw new Error(chunk.error?.message || 'Unknown OpenRouter error (HTML step)');
        }
        
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'content',
                content
              })}\n\n`
            )
          );
        }
      }
    } catch (streamError) {
      throw new Error(`Error during HTML streaming: ${streamError instanceof Error ? streamError.message : streamError}`);
    }
    
    // Final completion
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'done',
          models: { content: CONTENT_MODEL, html: HTML_MODEL },
          success: true,
          metadata: {
            topic: request.topic,
            depth: request.depth,
            style: request.style,
            steps: 2
          }
        })}\n\n`
      )
    );
    
  } catch (error) {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`
      )
    );
  }
}

// Main Route Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = EncyclopediaRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validationResult.error.errors,
        }), { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const request = validationResult.data;
    
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } }
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
      }), { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET handler
export async function GET() {
  return new Response(
    JSON.stringify({
      message: 'Wikipedia-Style Encyclopedia API (Two-Step Generation)',
      process: [
        'Step 1: Generate comprehensive article content',
        'Step 2: Convert to semantic HTML with Wikipedia styling'
      ],
      usage: 'POST to this endpoint with JSON body',
      example: {
        topic: 'Quantum Computing',
        depth: 'standard',
        style: 'academic',
        includeReferences: true,
        sections: ['History', 'Principles', 'Applications', 'Future'],
      },
    }), { headers: { 'Content-Type': 'application/json' } }
  );
}
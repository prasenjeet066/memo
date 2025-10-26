import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth/auth'
import { memoFlow } from "@/lib/workflow";
import "@/lib/workflows/article-publish.workflow";

interface RouteContext {
  params: Promise<{
    slug: string
  }>
}

export async function POST(req: Request, context: RouteContext) {
  try {
    // CRITICAL FIX: Await params in Next.js 15+
    const { slug } = await context.params;
    
    // Get session first
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", success: false }, 
        { status: 401 }
      )
    }

    // Parse body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON body", success: false }, 
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.htmlContent && !body.content) {
      return NextResponse.json(
        { error: "Missing content field", success: false }, 
        { status: 400 }
      )
    }

    if (!body.title) {
      return NextResponse.json(
        { error: "Missing title field", success: false }, 
        { status: 400 }
      )
    }

    // Prepare workflow payload
    const workflowPayload = {
      articleId: slug,
      htmlContent: body.htmlContent || body.content,
      title: body.title,
      summary: body.summary || '',
      categories: Array.isArray(body.categories) ? body.categories : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      references: Array.isArray(body.references) ? body.references : [],
      externalLinks: Array.isArray(body.externalLinks) ? body.externalLinks : [],
      infobox: body.infobox || undefined,
      author: session.user.username || session.user.name,
      created_by: session.user.id,
      created_by_username: session.user.username || session.user.name,
    };

    console.log(`📤 Sending article to workflow: ${workflowPayload.title}`);
    
    // Trigger the workflow
    const results = await memoFlow.send("article.submitted", workflowPayload);
    
    console.log(`✅ Workflow completed for article: ${slug}`);
    
    return NextResponse.json({
      success: true,
      message: "Article submitted successfully for AI review",
      results,
      articleId: slug,
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("❌ Workflow execution failed:", error);
    
    // Provide different error messages based on error type
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error.message?.includes("Unauthorized")) {
      errorMessage = "Authentication failed";
      statusCode = 401;
    } else if (error.message?.includes("validation")) {
      errorMessage = "Validation error: " + error.message;
      statusCode = 400;
    } else if (error.message?.includes("duplicate")) {
      errorMessage = "Article with this slug already exists";
      statusCode = 409;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: statusCode }
    );
  }
}
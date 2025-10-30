import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth/auth';
import { inngest } from "@/lib/inngest/client";

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", success: false }, 
        { status: 401 }
      );
    }

    // Parse body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON body", success: false }, 
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.htmlContent && !body.content) {
      return NextResponse.json(
        { error: "Missing content field", success: false }, 
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { error: "Missing title field", success: false }, 
        { status: 400 }
      );
    }

    // Prepare workflow payload
    const eventPayload = {
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
      slug,
      // Include articleId if updating existing article
      articleId: body.articleId || undefined,
      // Include edit summary for updates
      editSummary: body.editSummary || undefined,
      isMinorEdit: body.isMinorEdit !== undefined ? body.isMinorEdit : false,
    };
    
    console.log(`📤 Sending article to Inngest: ${eventPayload.title}`);
    console.log(`🆔 Article ID: ${eventPayload.articleId || 'NEW'}`);
    
    // Send event to Inngest
    const { ids } = await inngest.send({
      name: "article/submitted",
      data: eventPayload,
    });
    
    console.log(`✅ Event sent to Inngest with ID: ${ids[0]}`);
    
    // Return success response immediately
    // The actual processing will happen asynchronously via Inngest
    return NextResponse.json({
      success: true,
      message: body.articleId ? "Article update queued" : "Article creation queued",
      eventId: ids[0],
      articleId: body.articleId || slug,
      slug: slug,
    }, { status: 202 }); // 202 Accepted for async processing
    
  } catch (error: any) {
    console.error("❌ Failed to send event to Inngest:", error);
    
    // Provide different error messages based on error type
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error.message?.includes("Unauthorized")) {
      errorMessage = "Authentication failed";
      statusCode = 401;
    } else if (error.message?.includes("validation")) {
      errorMessage = "Validation error: " + error.message;
      statusCode = 400;
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
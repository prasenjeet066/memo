import { NextResponse } from "next/server";
import { memoFlow } from "@/lib/workflow"; // your MemoFlow instance
import "@/lib/workflows/article-publish.workflow"; // the file containing your workflow definition

export async function POST(req: Request) {
  try {
    let body = await req.json();
    
    // Example body:
    
    body = {
      "articleId": "123",
      "htmlContent": "<p>Hello world</p>",
      "author": "Alice",
      "title": "My Article",
      "category": "Tech"
    }
    // Trigger the workflow
    const results = await memoFlow.send("article.submitted", body);
    
    return NextResponse.json({
      success: true,
      message: "AI Article Review Workflow executed",
      results,
    });
  } catch (error: any) {
    console.error("Workflow execution failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
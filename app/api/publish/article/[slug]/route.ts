import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import {authOptions} from '@/lib/auth/auth'
import { memoFlow } from "@/lib/workflow"; // your MemoFlow instance
import "@/lib/workflows/article-publish.workflow"; // the file containing your workflow definition

export async function POST(req: Request) {
  try {
    let body = await req.json();
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Example body:
    
    // Trigger the workflow
    const results = await memoFlow.send("article.submitted", {...body, created_by_username:session.user.username ,
      created_by : session.user.id,
    });
    
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
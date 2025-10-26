import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth/auth'
import { RecordDAL } from '@/lib/dal/record.dal';


export async function POST(req: Request, context: RouteContext) {
  const { slug } = await context.params;
  
  // Get session first
  const session = await getServerSession(authOptions)
  
  /**if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 })
  }**/
  
  try {
    let record = await RecordDAL.findBySlug(slug);
    if (record !== null) {
      return NextResponse.json({
        data: record
      })
    }
    
  } catch (e) {
    return NextResponse.json({
      status: 5000,
      error: e
    })
  }
}
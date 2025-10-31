import { NextResponse } from "next/server";
import { RecordDAL } from '@/lib/dal/record.dal';
import { inngest } from "@/lib/inngest/client";
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/lib/auth/auth'
/**
 * For Ai use for writing a new record or fact check and rewrite or update 
 * @package Web , 
 */


export async function GET(req: Request, context: RouteContext) {
 const { slug } = await context.params;
 if (slug.trim() !== '') {
  const session = await getServerSession(authOptions)
  try {
   /**
    * check that any record already exist or not
    */
   let res = await RecordDAL.findBySlug(slug.trim());
   
   if (res === null || session?.user) {
    
    // that means - not record found 
    const res__iti = await inngest.send({
     name: "article/ai/worker",
     data: {
      slug,
      userid : session.user.id,
      username: session.user.username
     },
    });
    return NextResponse.json(res__iti)
   }
   
  } catch (e) {
   return NextResponse.json({ error: 'Error' })
  }
 }
 
}
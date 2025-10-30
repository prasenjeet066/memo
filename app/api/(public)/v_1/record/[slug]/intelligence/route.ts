import { NextResponse } from "next/server";
import { RecordDAL } from '@/lib/dal/record.dal';
import { inngest } from "@/lib/inngest/client";

/**
 * For Ai use for writing a new record or fact check and rewrite or update 
 * @package Web , 
 */


export async function GET(req: Request, context: RouteContext) {
 const { slug } = await context.params;
 if (slug.trim() !== '') {
  try {
   /**
    * check that any record already exist or not
    */
   let res = await RecordDAL.findBySlug(slug.trim());
   
   if (res === null) {
    // that means - not record found 
    const res__iti = await inngest.send({
     name: "article/ai/worker",
     data: {
      slug
     },
    });
    return NextResponse.json(res__iti)
   }
   
  } catch (e) {
   return NextResponse.json({ error: 'Error' })
  }
 }
 
}
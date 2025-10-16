import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest , {params}) {
  
  const slug = params.slug;
  if (slug || slug.trim()!=='') {
    
  }
  
}

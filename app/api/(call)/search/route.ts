import { NextResponse } from "next/server";

export const runtime = "edge"; // faster and cheaper

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  
  if (!query) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }
  
  const apiKey = 'AIzaSyBn6PaORaim9aC7BSIY0UrLM7Kb2Mdigvc';
  const cseId = 'f62f4483bced94919';
  
  if (!apiKey || !cseId) {
    return NextResponse.json({ error: "Missing Google API credentials" }, { status: 500 });
  }
  
  const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(
    query
  )}`;
  
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Search failed" }, { status: res.status });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Request failed", details: String(error) }, { status: 500 });
  }
}
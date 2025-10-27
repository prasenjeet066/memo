import { createCanvas, loadImage } from "canvas";
import { Delaunay } from "d3-delaunay";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let imageUrl =
      "https://www.pngitem.com/pimgs/m/333-3332655_lionel-messi-png-shot-transparent-png.png";
    
    const img = await loadImage(imageUrl);
    const WIDTH = img.width;
    const HEIGHT = img.height;
    const MAX_POINTS = 9000 + (HEIGHT * WIDTH);
    
    // 🔹 Load and process image
    const imgCanvas = createCanvas(WIDTH, HEIGHT);
    const imgCtx = imgCanvas.getContext("2d");
    imgCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    
    const data = imgCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
    
    // 🔹 SVG canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    
    const points = [];
    for (let i = 0; i < MAX_POINTS; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      const idx = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
      const [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (Math.random() > Math.max(0.2, brightness)) points.push([x, y]);
    }
    
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
    for (let i = 0; i < points.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;
      
      const [cx, cy] = points[i];
      const idx = (Math.floor(cy) * WIDTH + Math.floor(cx)) * 4;
      const [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Skip bright points
      if (brightness > 0.7) continue;
      
      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) ctx.lineTo(cell[j][0], cell[j][1]);
      ctx.closePath();
      
      ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 🔹 Create a ReadableStream from the SVG output
    const svgBuffer = canvas.toBuffer('image/png');
    
    
    
    return new Response(svgBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("Voronoi Error:", err);
    return new Response("⚠️ Error generating Voronoi art", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
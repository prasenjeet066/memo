import { createCanvas, loadImage } from "canvas";
import { Delaunay } from "d3-delaunay";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    
    if (!imageUrl) {
      return new Response("❌ Missing image URL", { status: 400 });
    }
    
    const MAX_POINTS = 800000;
    const WIDTH = 800;
    const HEIGHT = 800;
    
    const img = await loadImage(imageUrl);
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    
    // ✅ ব্যাকগ্রাউন্ড transparent রাখতে fillRect দরকার নেই
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    const aspect = img.width / img.height;
    let drawWidth = WIDTH;
    let drawHeight = WIDTH / aspect;
    
    if (drawHeight > HEIGHT) {
      drawHeight = HEIGHT;
      drawWidth = HEIGHT * aspect;
    }
    
    const offsetX = (WIDTH - drawWidth) / 2;
    const offsetY = (HEIGHT - drawHeight) / 2;
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const points = [];
    const data = imageData.data;
    
    for (let i = 0; i < MAX_POINTS; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      const idx = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
      
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      if (Math.random() > brightness) points.push([x, y]);
    }
    
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
    // 🔹 শুধু আউটলাইন আঁকব
    for (let i = 0; i < points.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;
      
      const [cx, cy] = points[i];
      const idx = (Math.floor(cy) * WIDTH + Math.floor(cx)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // 🔸 আউটলাইনের রঙ ইমেজের পিক্সেল অনুযায়ী
      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      ctx.closePath();
      
      ctx.strokeStyle = `black`; // হালকা ট্রান্সপারেন্ট লাইন
      ctx.lineWidth = 0.5; // লাইন পাতলা রাখো
      ctx.stroke();
    }
    
    const buffer = canvas.toBuffer("image/png");
    return new Response(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    console.error("Voronoi Error:", err);
    return new Response("⚠️ Error generating Voronoi art", { status: 500 });
  }
}
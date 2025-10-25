import sharp from "sharp";
import { createCanvas, loadImage } from "canvas";
import { Delaunay } from "d3-delaunay";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
const store = {
  "https://www.pmindia.gov.in/wp-content/uploads/2025/12/01.jpg": {
    tags: ['pm modi']
  },
  'https://www.kindpng.com/picc/m/490-4906364_latest-traditional-indian-jewellery-hd-png-download.png': {
    tags: ['indian', 'indian girl', 'indian tradition']
  },
  
  'https://www.pngitem.com/pimgs/m/333-3332655_lionel-messi-png-shot-transparent-png.png': {
    tags: ['messi']
  }
  
}
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let imageUrl = searchParams.get("url");
    
    if (!imageUrl) {
      let urls = Object.keys(store);
      imageUrl = urls[urls.length - 1] //urls[Math.floor(Math.random() * urls.length)];
    }
    
    const MAX_POINTS = 8000000;
    
    // 🔹 Load image
    const img = await loadImage(imageUrl);
    const WIDTH = img.width;
    const HEIGHT = img.height;
    
    // 🔹 Prepare image canvas
    const imgCanvas = createCanvas(WIDTH, HEIGHT);
    const imgCtx = imgCanvas.getContext("2d");
    
    const aspect = img.width / img.height;
    let drawWidth = WIDTH;
    let drawHeight = WIDTH / aspect;
    
    if (drawHeight > HEIGHT) {
      drawHeight = HEIGHT;
      drawWidth = HEIGHT * aspect;
    }
    
    const offsetX = (WIDTH - drawWidth) / 2;
    const offsetY = (HEIGHT - drawHeight) / 2;
    
    imgCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    const imageData = imgCtx.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data;
    
    // 🔹 Output canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // 🔹 Sample points (top dense, bottom half)
    const points = [];
    for (let i = 0; i < MAX_POINTS; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      
      const idx = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // 🔸 নিচের দিকে নামলে পয়েন্ট ধীরে ধীরে অর্ধেকে নামবে
      // top → full density (1.0)
      // bottom → half density (0.5)
      const falloff = 1.0 - 0.09 * (y / HEIGHT);
      
      // prefer dark pixels; lower falloff = fewer points
      if (Math.random() > brightness / falloff) {
        points.push([x, y]);
      }
    }
    
    // 🔹 Create Voronoi diagram
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
    // 🔹 Draw cells
    for (let i = 0; i < points.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;
      
      const [cx, cy] = points[i];
      const idx = (Math.floor(cy) * WIDTH + Math.floor(cx)) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      ctx.closePath();
      
      // 🔸 Dark → color, Light → grayscale
      if (brightness < 1) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
      } else {
        const gray = Math.floor(brightness * 255);
        ctx.strokeStyle = `rgba(${gray}, ${gray}, ${gray}, 0.6)`;
      }
      
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 🔹 Export PNG with metadata
    const buffer = canvas.toBuffer("image/png");
    const updatedBuffer = await sharp(buffer)
      .withMetadata({
        copyright: "2025 Sistorica. All rights reserved.",
        artist: "Prasenjeet H.",
        description: "Sistorica platform",
      })
      .png()
      .toBuffer();
    
    return new Response(updatedBuffer, {
      status: 200,
      headers: { "Content-Type": "image/png", ...corsHeaders },
    });
  } catch (err) {
    console.error("Voronoi Error:", err);
    return new Response("⚠️ Error generating Voronoi art", {
      status: 500,
      headers: corsHeaders,
    });
  }
}
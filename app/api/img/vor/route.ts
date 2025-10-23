import { createCanvas, loadImage } from "canvas";
import { Delaunay } from "d3-delaunay";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  
  if (!url) {
    return new Response("Missing image URL", { status: 400 });
  }
  
  const width = 800;
  const height = 600;
  const maxPoints = 50000;
  
  try {
    const img = await loadImage(url);
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const points = [];
    let added = 0;
    let tries = 60000;
    
    while (added < maxPoints && tries > 0) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      if (brightness > 0 && Math.random() > brightness) {
        points.push([x, y]);
        added++;
      }
      tries--;
    }
    
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    
    ctx.clearRect(0, 0, width, height);
    
    points.forEach((p, i) => {
      const cell = voronoi.cellPolygon(i);
      if (!cell) return;
      const cx = Math.floor(p[0]);
      const cy = Math.floor(p[1]);
      const idx = (cy * width + cx) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Keep only cells where the center pixel is dark
      if (brightness < 0.5) {
        ctx.fillStyle = `none`;
        
        ctx.beginPath();
        ctx.moveTo(cell[0][0], cell[0][1]);
        
        for (let j = 1; j < cell.length; j++) {
          ctx.lineTo(cell[j][0], cell[j][1]);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
    
    const buffer = canvas.toBuffer("image/png");
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error generating Voronoi art", { status: 500 });
  }
}
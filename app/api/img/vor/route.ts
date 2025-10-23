import { createCanvas, loadImage } from "canvas";
import { Delaunay } from "d3-delaunay";

export default async function handler(req, res) {
  export default async function handler(req, res) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { url } = req.query;
    if (!url) return res.status(400).send("Missing image URL");
    
    // ... rest of your code
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
    
    // Draw colored Voronoi
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
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      
      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      ctx.closePath();
      ctx.fill();
    });
    
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating Voronoi art");
  }
}
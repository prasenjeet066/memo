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

// Helper: Convert hex to RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Helper: Compute Euclidean distance between two RGB colors
function colorDistance(c1, c2) {
  return Math.sqrt(
    (c1[0] - c2[0]) ** 2 +
    (c1[1] - c2[1]) ** 2 +
    (c1[2] - c2[2]) ** 2
  );
}

// Map a color to nearest in visibleColors
function mapToVisibleColor(r, g, b, visibleColors) {
  const rgbColors = visibleColors.map(hexToRgb);
  let minDist = Infinity;
  let closest = rgbColors[0];
  for (let color of rgbColors) {
    const dist = colorDistance([r, g, b], color);
    if (dist < minDist) {
      minDist = dist;
      closest = color;
    }
  }
  return closest;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    
    if (!imageUrl) {
      return new Response("❌ Missing image URL", {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    const WIDTH = 800;
    const HEIGHT = 800;
    const MAX_POINTS = 900000;
    
    const img = await loadImage(imageUrl);
    
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
    
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    const points = [];
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
    
    // 🔹 Predefined bright/visible colors
    const visibleColors = [
      "#FF4C4C", // red
      "#4CFF4C", // green
      "#4C4CFF", // blue
      "#FFD700", // gold
      "#FF69B4", // hotpink
      "#00FFFF", // cyan
      "#FFA500", // orange
      "#800080", // purple
    ];
    
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
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
      
      if (brightness < 0.5) {
        // Dark pixel → map to nearest visible color
        const [vr, vg, vb] = mapToVisibleColor(r, g, b, visibleColors);
        ctx.strokeStyle = `rgba(${vr}, ${vg}, ${vb}, 0.9)`;
      } else {
        const gray = Math.floor(brightness * 255);
        ctx.strokeStyle = `rgba(${gray}, ${gray}, ${gray}, 0.6)`;
      }
      
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
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
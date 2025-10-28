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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Enhanced parameters with defaults
    const imageUrl = searchParams.get("url") || 
      "https://www.pngitem.com/pimgs/m/333-3332655_lionel-messi-png-shot-transparent-png.png";
    const pointDensity = parseInt(searchParams.get("density") || "1000000");
    const style = searchParams.get("style") || "stroke"; // stroke, fill, mixed, stipple
    const colorMode = searchParams.get("color") || "original"; // original, grayscale, inverted, vibrant
    const edgeDetection = searchParams.get("edges") === "true";
    const addWatermark = searchParams.get("watermark") !== "false";
    const watermarkText = searchParams.get("watermarkText") || "Sistorica";
    const quality = searchParams.get("quality") || "high"; // low, medium, high
    
    // Load image
    const img = await loadImage(imageUrl);
    const WIDTH = img.width;
    const HEIGHT = img.height;
    
    // Adaptive point count based on image size and quality
    const basePoints = Math.min(pointDensity, 2000000);
    const MAX_POINTS = quality === "low" ? basePoints * 0.5 : 
                       quality === "medium" ? basePoints * 0.75 : basePoints;
    
    // Process source image
    const imgCanvas = createCanvas(WIDTH, HEIGHT);
    const imgCtx = imgCanvas.getContext("2d");
    imgCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    
    // Optional watermark
    if (addWatermark) {
      const fontSize = Math.max(24, Math.min(WIDTH, HEIGHT) * 0.08);
      imgCtx.font = `bold ${fontSize}pt Sans-serif`;
      imgCtx.textAlign = "center";
      imgCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
      imgCtx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      imgCtx.lineWidth = 2;
      imgCtx.strokeText(watermarkText, WIDTH / 2, HEIGHT - fontSize / 2);
      imgCtx.fillText(watermarkText, WIDTH / 2, HEIGHT - fontSize / 2);
    }
    
    const imageData = imgCtx.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data;
    
    // Edge detection preprocessing (optional)
    let edgeMap: number[] = [];
    if (edgeDetection) {
      edgeMap = detectEdges(data, WIDTH, HEIGHT);
    }
    
    // Generate points with improved distribution
    const points: [number, number][] = [];
    const colors: [number, number, number][] = [];
    
    for (let i = 0; i < MAX_POINTS; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      const idx = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
      
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];
      const a = data[idx + 3];
      
      // Skip fully transparent pixels
      if (a < 10) continue;
      
      // Calculate brightness
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Edge-aware sampling: place more points on edges
      let threshold = Math.max(0.15, brightness);
      if (edgeDetection && edgeMap[Math.floor(y) * WIDTH + Math.floor(x)] > 100) {
        threshold *= 0.3; // Increase point density on edges
      }
      
      if (Math.random() > threshold) {
        // Apply color modes
        if (colorMode === "grayscale") {
          const gray = Math.round(brightness * 255);
          r = g = b = gray;
        } else if (colorMode === "inverted") {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        } else if (colorMode === "vibrant") {
          // Enhance saturation
          const max = Math.max(r, g, b);
          if (max > 0) {
            r = Math.min(255, r * (255 / max) * 0.9);
            g = Math.min(255, g * (255 / max) * 0.9);
            b = Math.min(255, b * (255 / max) * 0.9);
          }
        }
        
        points.push([x, y]);
        colors.push([r, g, b]);
      }
    }
    
    // Create Voronoi diagram
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
    // Render output
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    
    // Background
    ctx.fillStyle = "none";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Render cells based on style
    for (let i = 0; i < points.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;
      
      const [r, g, b] = colors[i];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      ctx.closePath();
      
      // Apply rendering style
      if (style === "fill") {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness > 0.95 ? 0.3 : 0.95})`;
        ctx.fill();
      } else if (style === "stroke") {
        ctx.strokeStyle = brightness < 0.95 
          ? `rgba(${r}, ${g}, ${b}, 0.85)` 
          : `rgba(${r}, ${g}, ${b}, 0.25)`;
        ctx.lineWidth = brightness > 0.7 ? 0.5 : 1;
        ctx.stroke();
      } else if (style === "mixed") {
        // Fill with lighter color
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness > 0.9 ? 0.15 : 0.4})`;
        ctx.fill();
        // Stroke with darker color
        ctx.strokeStyle = `rgba(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)}, 0.7)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (style === "stipple") {
        // Draw a small dot at each point instead of full cells
        const [px, py] = points[i];
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.beginPath();
        ctx.arc(px, py, brightness > 0.8 ? 0.5 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Generate output buffer
    const outputBuffer = canvas.toBuffer("image/png");
    
    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "Content-Length": outputBuffer.length.toString(),
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("Voronoi Error:", err);
    return new Response(
      JSON.stringify({ 
        error: "Error generating Voronoi art", 
        message: err instanceof Error ? err.message : "Unknown error" 
      }), 
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * Simple edge detection using Sobel operator
 */
function detectEdges(data: Uint8ClampedArray, width: number, height: number): number[] {
  const edges = new Array(width * height).fill(0);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Get grayscale values of surrounding pixels
      const getGray = (dx: number, dy: number) => {
        const i = ((y + dy) * width + (x + dx)) * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };
      
      // Sobel operators
      const gx = 
        -1 * getGray(-1, -1) + 1 * getGray(1, -1) +
        -2 * getGray(-1, 0) + 2 * getGray(1, 0) +
        -1 * getGray(-1, 1) + 1 * getGray(1, 1);
      
      const gy = 
        -1 * getGray(-1, -1) - 2 * getGray(0, -1) - 1 * getGray(1, -1) +
        1 * getGray(-1, 1) + 2 * getGray(0, 1) + 1 * getGray(1, 1);
      
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  return edges;
}
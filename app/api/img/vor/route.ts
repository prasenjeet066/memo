import { createCanvas, loadImage } from "canvas";
import { Delaunay } from "d3-delaunay";
import type { NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface VoronoiConfig {
  imageUrl: string;
  maxPoints: number;
  minBrightness: number;
  maxBrightness: number;
  style: 'filled' | 'outlined' | 'mixed' | 'gradient';
  colorMode: 'original' | 'grayscale' | 'inverted' | 'enhanced';
  lineWidth: number;
  opacity: number;
  backgroundColor: string;
  edgeDetection: boolean;
  adaptiveDensity: boolean;
  cellSize: 'adaptive' | 'uniform';
}

function getConfig(searchParams: URLSearchParams): VoronoiConfig {
  const imageUrl = searchParams.get("url") ||
    "https://www.pngitem.com/pimgs/m/333-3332655_lionel-messi-png-shot-transparent-png.png";
  
  return {
    imageUrl,
    maxPoints: parseInt(searchParams.get("points") || "50000"),
    minBrightness: parseFloat(searchParams.get("minBright") || "0.2"),
    maxBrightness: parseFloat(searchParams.get("maxBright") || "0.8"),
    style: (searchParams.get("style") as VoronoiConfig['style']) || "outlined",
    colorMode: (searchParams.get("colorMode") as VoronoiConfig['colorMode']) || "original",
    lineWidth: parseFloat(searchParams.get("lineWidth") || "1"),
    opacity: parseFloat(searchParams.get("opacity") || "0.9"),
    backgroundColor: searchParams.get("bg") || "transparent",
    edgeDetection: searchParams.get("edges") === "true",
    adaptiveDensity: searchParams.get("adaptive") !== "false",
    cellSize: (searchParams.get("cellSize") as VoronoiConfig['cellSize']) || "adaptive"
  };
}

function detectEdges(data: Uint8ClampedArray, width: number, height: number): number[][] {
  const edges: number[][] = [];
  const threshold = 30;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const curr = data[idx];
      
      const right = data[idx + 4];
      const down = data[idx + width * 4];
      
      if (Math.abs(curr - right) > threshold || Math.abs(curr - down) > threshold) {
        edges.push([x, y]);
      }
    }
  }
  
  return edges;
}

function processColor(r: number, g: number, b: number, mode: VoronoiConfig['colorMode']): [number, number, number] {
  switch (mode) {
    case 'grayscale': {
      const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
      return [gray, gray, gray];
    }
    case 'inverted':
      return [255 - r, 255 - g, 255 - b];
    case 'enhanced':
      return [
        Math.min(255, r * 1.2),
        Math.min(255, g * 1.2),
        Math.min(255, b * 1.2)
      ];
    default:
      return [r, g, b];
  }
}

function calculateAdaptiveDensity(brightness: number, edgeWeight: number): number {
  // More points in dark areas and edges
  const brightnessFactor = 1 - brightness;
  const densityScore = (brightnessFactor * 0.7) + (edgeWeight * 0.3);
  return Math.pow(densityScore, 2); // Square for more dramatic effect
}

export async function GET(request: NextRequest) {
  try {
    const config = getConfig(request.nextUrl.searchParams);
    
    // Load and process image
    const img = await loadImage(config.imageUrl);
    const WIDTH = img.width;
    const HEIGHT = img.height;
    
    const imgCanvas = createCanvas(WIDTH, HEIGHT);
    const imgCtx = imgCanvas.getContext("2d");
    imgCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    
    const imageData = imgCtx.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data;
    
    // Edge detection
    const edgeMap = new Set < string > ();
    if (config.edgeDetection) {
      const edges = detectEdges(data, WIDTH, HEIGHT);
      edges.forEach(([x, y]) => edgeMap.add(`${x},${y}`));
    }
    
    // Generate points with adaptive density
    const points: [number, number][] = [];
    const attempts = config.maxPoints * 3; // More attempts for better distribution
    
    for (let i = 0; i < attempts && points.length < config.maxPoints; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      const idx = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
      
      const [r, g, b, a] = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
      
      // Skip transparent pixels
      if (a < 10) continue;
      
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Brightness filtering
      if (brightness < config.minBrightness || brightness > config.maxBrightness) {
        continue;
      }
      
      // Adaptive density calculation
      let acceptProbability = 1;
      if (config.adaptiveDensity) {
        const isEdge = edgeMap.has(`${Math.floor(x)},${Math.floor(y)}`);
        const edgeWeight = isEdge ? 1 : 0;
        acceptProbability = calculateAdaptiveDensity(brightness, edgeWeight);
      }
      
      if (Math.random() < acceptProbability) {
        points.push([x, y]);
      }
    }
    
    // Add corner points for better boundary handling
    points.push([0, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH, HEIGHT]);
    
    // Generate Voronoi diagram
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
    // Render canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    
    // Background
    if (config.backgroundColor !== "transparent") {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    // Render cells
    for (let i = 0; i < points.length - 4; i++) { // Exclude corner points
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;
      
      const [cx, cy] = points[i];
      const idx = (Math.floor(cy) * WIDTH + Math.floor(cx)) * 4;
      let [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]];
      
      [r, g, b] = processColor(r, g, b, config.colorMode);
      
      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      ctx.closePath();
      
      // Style application
      switch (config.style) {
        case 'filled':
          ctx.fillStyle = `rgba(${r},${g},${b},${config.opacity})`;
          ctx.fill();
          break;
          
        case 'outlined':
          ctx.strokeStyle = `rgba(${r},${g},${b},${config.opacity})`;
          ctx.lineWidth = config.lineWidth;
          ctx.stroke();
          break;
          
        case 'mixed':
          ctx.fillStyle = `rgba(${r},${g},${b},${config.opacity * 0.3})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${r},${g},${b},${config.opacity})`;
          ctx.lineWidth = config.lineWidth;
          ctx.stroke();
          break;
          
        case 'gradient': {
          // Calculate cell center
          const centerX = cell.reduce((sum, p) => sum + p[0], 0) / cell.length;
          const centerY = cell.reduce((sum, p) => sum + p[1], 0) / cell.length;
          const radius = Math.sqrt(
            Math.pow(cell[0][0] - centerX, 2) + Math.pow(cell[0][1] - centerY, 2)
          );
          
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
          );
          gradient.addColorStop(0, `rgba(${r},${g},${b},${config.opacity})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
          
          ctx.fillStyle = gradient;
          ctx.fill();
          break;
        }
      }
    }
    
    const buffer = canvas.toBuffer('image/png');
    
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("Voronoi Error:", err);
    return new Response(
      JSON.stringify({
        error: "Error generating Voronoi art",
        message: err instanceof Error ? err.message : String(err)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  }
}
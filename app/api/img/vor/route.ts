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
    maxPoints: parseInt(searchParams.get("points") || "5000"),
    minBrightness: parseFloat(searchParams.get("minBright") || "0"),
    maxBrightness: parseFloat(searchParams.get("maxBright") || "1"),
    style: (searchParams.get("style") as VoronoiConfig['style']) || "filled",
    colorMode: (searchParams.get("colorMode") as VoronoiConfig['colorMode']) || "original",
    lineWidth: parseFloat(searchParams.get("lineWidth") || "0.5"),
    opacity: parseFloat(searchParams.get("opacity") || "1"),
    backgroundColor: searchParams.get("bg") || "#ffffff",
    edgeDetection: searchParams.get("edges") === "true",
    adaptiveDensity: searchParams.get("adaptive") === "true",
    cellSize: (searchParams.get("cellSize") as VoronoiConfig['cellSize']) || "uniform"
  };
}

function detectEdges(data: Uint8ClampedArray, width: number, height: number): Set<string> {
  const edges = new Set<string>();
  const threshold = 40;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const curr = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
      const down = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
      
      if (Math.abs(curr - right) > threshold || Math.abs(curr - down) > threshold) {
        edges.add(`${x},${y}`);
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
        Math.min(255, Math.floor(r * 1.3)),
        Math.min(255, Math.floor(g * 1.3)),
        Math.min(255, Math.floor(b * 1.3))
      ];
    default:
      return [r, g, b];
  }
}

function calculateAdaptiveDensity(brightness: number, isEdge: boolean): number {
  // Higher probability for darker areas and edges
  const brightnessFactor = 1 - brightness;
  const edgeFactor = isEdge ? 0.95 : 0;
  return Math.max(brightnessFactor * 0.6 + edgeFactor, 0.1);
}

function poissonDiskSampling(
  width: number, 
  height: number, 
  minDist: number, 
  maxPoints: number,
  data: Uint8ClampedArray,
  config: VoronoiConfig,
  edgeMap: Set<string>
): [number, number][] {
  const points: [number, number][] = [];
  const cellSize = minDist / Math.SQRT2;
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);
  const grid: number[][] = Array(gridW * gridH).fill(null).map(() => []);
  
  const k = 30; // attempts per point
  const active: [number, number][] = [];
  
  // Start with random point
  const startX = Math.random() * width;
  const startY = Math.random() * height;
  points.push([startX, startY]);
  active.push([startX, startY]);
  
  const gridX = Math.floor(startX / cellSize);
  const gridY = Math.floor(startY / cellSize);
  grid[gridY * gridW + gridX].push(0);
  
  while (active.length > 0 && points.length < maxPoints) {
    const randIdx = Math.floor(Math.random() * active.length);
    const [px, py] = active[randIdx];
    
    let found = false;
    
    for (let i = 0; i < k; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minDist * (1 + Math.random());
      const nx = px + radius * Math.cos(angle);
      const ny = py + radius * Math.sin(angle);
      
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      
      const gx = Math.floor(nx / cellSize);
      const gy = Math.floor(ny / cellSize);
      
      // Check neighboring cells
      let valid = true;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const checkX = gx + dx;
          const checkY = gy + dy;
          
          if (checkX < 0 || checkX >= gridW || checkY < 0 || checkY >= gridH) continue;
          
          const cell = grid[checkY * gridW + checkX];
          for (const idx of cell) {
            const [ex, ey] = points[idx];
            const dist = Math.sqrt((nx - ex) ** 2 + (ny - ey) ** 2);
            if (dist < minDist) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }
        if (!valid) break;
      }
      
      if (valid) {
        // Check brightness and transparency
        const dataIdx = (Math.floor(ny) * width + Math.floor(nx)) * 4;
        const [r, g, b, a] = [data[dataIdx], data[dataIdx + 1], data[dataIdx + 2], data[dataIdx + 3]];
        
        if (a < 10) continue;
        
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        if (brightness < config.minBrightness || brightness > config.maxBrightness) continue;
        
        // Adaptive density check
        if (config.adaptiveDensity) {
          const isEdge = edgeMap.has(`${Math.floor(nx)},${Math.floor(ny)}`);
          const acceptProb = calculateAdaptiveDensity(brightness, isEdge);
          if (Math.random() > acceptProb) continue;
        }
        
        points.push([nx, ny]);
        active.push([nx, ny]);
        grid[gy * gridW + gx].push(points.length - 1);
        found = true;
        break;
      }
    }
    
    if (!found) {
      active.splice(randIdx, 1);
    }
  }
  
  return points;
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
    let edgeMap = new Set<string>();
    if (config.edgeDetection) {
      edgeMap = detectEdges(data, WIDTH, HEIGHT);
    }
    
    // Generate points
    let points: [number, number][];
    
    if (config.cellSize === 'uniform') {
      // Use Poisson disk sampling for uniform distribution
      const minDist = Math.sqrt((WIDTH * HEIGHT) / config.maxPoints) * 0.8;
      points = poissonDiskSampling(WIDTH, HEIGHT, minDist, config.maxPoints, data, config, edgeMap);
    } else {
      // Adaptive/random distribution
      points = [];
      const attempts = config.maxPoints * 5;
      
      for (let i = 0; i < attempts && points.length < config.maxPoints; i++) {
        const x = Math.random() * WIDTH;
        const y = Math.random() * HEIGHT;
        const idx = (Math.floor(y) * WIDTH + Math.floor(x)) * 4;
        
        const [r, g, b, a] = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
        
        if (a < 10) continue;
        
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        if (brightness < config.minBrightness || brightness > config.maxBrightness) continue;
        
        let acceptProbability = 1;
        if (config.adaptiveDensity) {
          const isEdge = edgeMap.has(`${Math.floor(x)},${Math.floor(y)}`);
          acceptProbability = calculateAdaptiveDensity(brightness, isEdge);
        }
        
        if (Math.random() < acceptProbability) {
          points.push([x, y]);
        }
      }
    }
    
    // Add boundary points for better edge handling
    const margin = 5;
    points.push(
      [margin, margin], 
      [WIDTH - margin, margin], 
      [margin, HEIGHT - margin], 
      [WIDTH - margin, HEIGHT - margin]
    );
    
    // Generate Voronoi diagram
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, WIDTH, HEIGHT]);
    
    // Render canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    
    // Set high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Background
    if (config.backgroundColor !== "transparent") {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    // Render cells (exclude last 4 boundary points)
    for (let i = 0; i < points.length - 4; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell || cell.length < 3) continue;
      
      const [cx, cy] = points[i];
      const idx = (Math.floor(cy) * WIDTH + Math.floor(cx)) * 4;
      let [r, g, b] = [data[idx] || 0, data[idx + 1] || 0, data[idx + 2] || 0];
      
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
          ctx.fillStyle = `rgba(${r},${g},${b},${config.opacity * 0.4})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${Math.floor(r * 0.7)},${Math.floor(g * 0.7)},${Math.floor(b * 0.7)},${config.opacity})`;
          ctx.lineWidth = config.lineWidth;
          ctx.stroke();
          break;
          
        case 'gradient': {
          const centerX = cell.reduce((sum, p) => sum + p[0], 0) / cell.length;
          const centerY = cell.reduce((sum, p) => sum + p[1], 0) / cell.length;
          
          const maxDist = Math.max(...cell.map(p => 
            Math.sqrt((p[0] - centerX) ** 2 + (p[1] - centerY) ** 2)
          ));
          
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxDist
          );
          gradient.addColorStop(0, `rgba(${r},${g},${b},${config.opacity})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},${config.opacity * 0.2})`);
          
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
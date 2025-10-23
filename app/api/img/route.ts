import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import safeParser from "postcss-safe-parser";

let cssRootCache: postcss.Root | null = null;
let registeredFonts = new Set < string > ();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const iconParam = searchParams.get("icon") || "fas fa-question";
    const sizeParam = searchParams.get("size") || "512x512";
    const [width, height] = sizeParam.split("x").map(Number);
    
    // --- Parse style prefix + icon name ---
    const [prefix, iconNameRaw] = iconParam.trim().split(/\s+/);
    const iconName = iconNameRaw?.replace(/^fa-/, "") || "question";
    const style = prefix?.replace(/^fa-/, "") || "solid"; // fas, fab, far
    
    // --- Choose font file based on style ---
    const fontDir = path.join(process.cwd(), "public", "icon", "webfonts");
    const fontMap: Record < string, string > = {
      brands: "fa-brands-400.ttf",
      solid: "fa-solid-900.ttf",
      regular: "fa-regular-400.ttf", // optional, if exists
    };
    
    const fontFile = fontMap[style] || fontMap["solid"];
    const fontPath = path.join(fontDir, fontFile);
    
    if (fs.existsSync(fontPath) && !registeredFonts.has(style)) {
      registerFont(fontPath, { family: `FA-${style}` });
      registeredFonts.add(style);
    }
    
    // --- Load CSS once ---
    const cssPath = path.join(process.cwd(), "public", "icon", "css", "all.min.css");
    let unicode = "\uF128"; // fallback (fa-question-circle)
    
    if (fs.existsSync(cssPath)) {
      if (!cssRootCache) {
        const cssText = fs.readFileSync(cssPath, "utf8");
        cssRootCache = postcss.parse(cssText, { parser: safeParser });
      }
      
      const targetSelector = `.${prefix}.fa-${iconName}::before`;
      cssRootCache.walkRules(targetSelector, (rule) => {
        rule.walkDecls("content", (decl) => {
          if (decl.value) {
            const cleaned = decl.value.replace(/["']/g, "");
            unicode = cleaned.replace(/\\([0-9a-fA-F]+)/g, (_, hex) =>
              String.fromCharCode(parseInt(hex, 16))
            );
          }
        });
      });
    }
    
    // --- Draw icon ---
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.floor(width * 0.6)}px "FA-${style}"`;
    ctx.fillText(unicode, width / 2, height / 2);
    
    const pngBuffer = canvas.toBuffer("image/png");
    
    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${iconName}.png"`,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (err) {
    console.error("❌ Icon generation failed:", err);
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8d7da";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#721c24";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Error", 128, 128);
    return new Response(canvas.toBuffer("image/png"), {
      status: 500,
      headers: { "Content-Type": "image/png" },
    });
  }
}
import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import safeParser from "postcss-safe-parser";

let cssRootCache: postcss.Root | null = null;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const iconParam = searchParams.get("icon") || "fa-question";
    const sizeParam = searchParams.get("size") || "512x512";
    const [width, height] = sizeParam.split("x").map(Number);
    
    // --- Parse icon ---
    const iconName = iconParam.replace("fa-", "");
    
    // --- Load CSS ---
    const cssPath = path.join(process.cwd(), "public", "icon", "css", "all.min.css");
    let unicode = "\uF128"; // fallback = question-circle
    
    if (fs.existsSync(cssPath)) {
      if (!cssRootCache) {
        const cssText = fs.readFileSync(cssPath, "utf8");
        cssRootCache = postcss.parse(cssText, { parser: safeParser });
      }
      
      const targetSelector = `.fa-${iconName}::before`;
      cssRootCache.walkRules(targetSelector, (rule) => {
        rule.walkDecls("content", (decl) => {
          if (decl.value) {
            const cleaned = decl.value.replace(/["']/g, "");
            // Convert "\f007" → actual unicode character
            unicode = String.fromCharCode(parseInt(cleaned.replace("\\f", ""), 16));
          }
        });
      });
    }
    
    // --- Load any Font Awesome font dynamically ---
    const fontDir = path.join(process.cwd(), "public", "icon", "webfonts");
    const fontFiles = fs.readdirSync(fontDir).filter((f) => f.endsWith(".ttf"));
    if (fontFiles.length > 0) {
      registerFont(path.join(fontDir, fontFiles[0]), { family: "FA" });
    } else {
      console.warn("⚠️ No Font Awesome font found");
    }
    
    // --- Draw icon ---
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.floor(width * 0.6)}px "FA"`;
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
    console.error("❌ Error generating icon:", err);
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8d7da";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#721c24";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Error", 128, 128);
    return new Response(canvas.toBuffer("image/png"), { status: 500, headers: { "Content-Type": "image/png" } });
  }
}
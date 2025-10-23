import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import safeParser from "postcss-safe-parser";

let cssRootCache: postcss.Root | null = null;
const registeredFonts = new Set<string>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const iconParam = searchParams.get("icon") || "fas fa-question";
    const sizeParam = searchParams.get("size") || "512x512";
    const debugMode = searchParams.get("debug") === "true";
    const color = searchParams.get("color") || "#111111";
    const bg = searchParams.get("bg") || "#ffffff";

    const [width, height] = sizeParam.split("x").map(Number);

    // --- Parse prefix + icon name ---
    const [prefix, iconNameRaw] = iconParam.trim().split(/\s+/);
    const iconName = iconNameRaw?.replace(/^fa-/, "") || "question";
    const style = prefix?.replace(/^fa-/, "") || "solid"; // e.g., fas -> solid

    // --- Font mapping ---
    const fontDir = path.join(process.cwd(), "public", "icon", "webfonts");
    const fontMap: Record<string, string> = {
      brands: "fa-brands-400.ttf",
      solid: "fa-solid-900.ttf",
      regular: "fa-regular-400.ttf",
    };
    const fontFile = fontMap[style] || fontMap["solid"];
    const fontPath = path.join(fontDir, fontFile);

    // --- Register font once ---
    if (fs.existsSync(fontPath) && !registeredFonts.has(style)) {
      registerFont(fontPath, { family: `FA-${style}` });
      registeredFonts.add(style);
    }

    // --- Load CSS once ---
    const cssPath = path.join(process.cwd(), "public", "icon", "css", "fontawesome.css");
    let unicode = "\uf128"; // fallback to question mark

    if (fs.existsSync(cssPath)) {
      if (!cssRootCache) {
        const cssText = fs.readFileSync(cssPath, "utf8");
        cssRootCache = postcss.parse(cssText, { parser: safeParser });
      }

      cssRootCache.walkRules((rule) => {
        if (rule.selector.includes(`fa-${iconName}`) && rule.selector.includes("::before")) {
          rule.walkDecls("content", (decl) => {
            if (decl.value) {
              unicode = decl.value.replace(/["'\\]/g, "").trim();
            }
          });
        }
      });
    }

    // --- Debug Mode ---
    if (debugMode) {
      return new Response(
        JSON.stringify(
          {
            icon: iconParam,
            style,
            fontFile,
            iconName,
            unicode,
          },
          null,
          2
        ),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Draw icon ---
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = color;
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
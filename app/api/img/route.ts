import { NextResponse } from "next/server";
import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import postcss from "postcss";
import safeParser from "postcss-safe-parser";

// ✅ Optional: cache parsed CSS in memory for speed
let cssRootCache: postcss.Root | null = null;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const iconParam = searchParams.get("icon") || "fa-solid fa-question";
    const sizeParam = searchParams.get("size") || "512x512";
    const [width, height] = sizeParam.split("x").map(Number);

    // --- Parse icon class (e.g. fa-solid fa-user) ---
    const parts = iconParam.split(" ");
    const stylePart = parts.find((p) =>
      ["fa-solid", "fa-regular", "fa-brands"].includes(p)
    );
    const iconPart = parts.find(
      (p) => p.startsWith("fa-") && !["fa-solid", "fa-regular", "fa-brands"].includes(p)
    );

    const style = stylePart?.replace("fa-", "") || "solid";
    const iconName = iconPart?.replace("fa-", "") || "question";

    // --- Resolve Font Awesome TTF file ---
    const fontFileMap: Record<string, string> = {
      solid: "fa-solid-900.ttf",
      regular: "fa-regular-400.ttf",
      brands: "fa-brands-400.ttf",
    };
    const fontFile = fontFileMap[style] || fontFileMap.solid;

    const fontPath = path.join(process.cwd(), "public", "icon", "webfonts", fontFile);
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: "Font Awesome 6 Pro" });
    } else {
      console.warn("⚠️ Font not found:", fontPath);
    }

    // --- Parse unicode using PostCSS ---
    const cssPath = path.join(process.cwd(), "public", "icon", "css", "all.min.css");
    let unicode = "\uf128"; // fallback = question-circle

    if (fs.existsSync(cssPath)) {
      try {
        if (!cssRootCache) {
          const cssText = fs.readFileSync(cssPath, "utf8");
          cssRootCache = postcss.parse(cssText, { parser: safeParser });
        }

        const targetSelector = `.fa-${iconName}:before`;

        cssRootCache.walkRules(targetSelector, (rule) => {
          rule.walkDecls("content", (decl) => {
            if (decl.value) {
              const cleaned = decl.value.replace(/["']/g, ""); // remove quotes
              try {
                unicode = JSON.parse(`"${cleaned}"`); // decode \f007 → actual char
              } catch {
                console.warn(`⚠️ Failed to decode unicode for ${iconName}`);
              }
            }
          });
        });

        if (unicode === "\uf128") {
          console.warn(`⚠️ Icon "${iconName}" not found in CSS`);
        }
      } catch (err) {
        console.error("❌ Failed to parse Font Awesome CSS:", err);
      }
    } else {
      console.warn("⚠️ CSS file not found:", cssPath);
    }

    // --- Draw icon onto canvas ---
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Icon glyph
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.floor(width * 0.6)}px "Font Awesome 6 Pro"`;
    ctx.fillText(unicode, width / 2, height / 2);

    // --- Output as PNG ---
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

    // Return a fallback error image
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8d7da";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#721c24";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Error", 128, 128);

    const buffer = canvas.toBuffer("image/png");
    return new Response(buffer, {
      headers: { "Content-Type": "image/png" },
      status: 500,
    });
  }
}
import { NextResponse } from "next/server";
import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";

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

    // --- Resolve font file ---
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

    // --- Parse unicode from local CSS ---
    const cssPath = path.join(process.cwd(), "public", "icon", "css", "all.min.css");
    let unicode = "\uf128"; // fallback = question-circle

    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, "utf8");
      // Match e.g. .fa-user:before{content:"\f007"}
      const regex = new RegExp(
        `\\.fa-${iconName}:before\\s*\\{[^}]*content:"(\\\\[a-fA-F0-9]+)"`,
        "i"
      );
      const match = css.match(regex);
      if (match) {
        unicode = JSON.parse(`"${match[1]}"`); // convert \f007 → actual char
      } else {
        console.warn(`⚠️ Icon "${iconName}" not found in CSS`);
      }
    } else {
      console.warn("⚠️ CSS file not found:", cssPath);
    }

    // --- Draw icon ---
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // Icon
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.floor(width * 0.6)}px "Font Awesome 6 Pro"`;
    ctx.fillText(unicode, width / 2, height / 2);

    // --- Output PNG ---
    const pngBuffer = canvas.toBuffer("image/png");

    // ✅ Return as proper binary response
    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${iconName}.png"`,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (err) {
    console.error("❌ Error generating icon:", err);

    // Return a simple error PNG instead of .bin or text
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8d7da";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#721c24";
    ctx.font = '20px sans-serif';
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
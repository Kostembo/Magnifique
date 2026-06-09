import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("v") === "dark" ? "logo-dark.png" : "logo-light.png";
  const filePath = path.join(process.cwd(), "public", variant);
  const file = await readFile(filePath);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

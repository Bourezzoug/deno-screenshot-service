import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";

const API_KEY = Deno.env.get("API_KEY") || "your-secret-key-change-this";

async function handler(req: Request): Promise<Response> {
  // --- START OF NEW CODE ---
  // Handle Deno Deploy's health check
  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname === "/") {
    return new Response("Service is healthy", { status: 200 });
  }
  // --- END OF NEW CODE ---


  // Only accept POST requests for screenshotting
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Simple API Key authentication
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { html } = await req.json();

    if (!html) {
      return new Response("HTML content is required", { status: 400 });
    }

    const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshotBuffer = await page.screenshot({ type: "png" });
    await browser.close();

    return new Response(screenshotBuffer, {
      headers: { "Content-Type": "image/png" },
    });

  } catch (error) {
    console.error(error);
    return new Response("Failed to generate screenshot", { status: 500 });
  }
}

// The port is automatically handled by Deno Deploy, so we don't need to specify it.
serve(handler);
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";

const API_KEY = Deno.env.get("API_KEY") || "your-secret-key-change-this";

async function handler(req: Request): Promise<Response> {
  // Only accept POST requests
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
        args: ["--no-sandbox"], // Required for the Deno Deploy environment
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set the HTML content and wait for it to be fully loaded
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

serve(handler);
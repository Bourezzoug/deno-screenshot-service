import puppeteer from "https://deno.land/x/puppeteer@22.7.1/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const API_KEY = Deno.env.get("API_KEY") || "your-secret-key-change-this";

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check for Deno Deploy Warm Up
  if (req.method === "GET" && url.pathname === "/") {
    return new Response("Service is healthy and ready.", { status: 200 });
  }

  // Only allow POST requests for screenshotting
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // API Key authentication
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
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
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
    console.error("Error generating screenshot:", error);
    return new Response("Failed to generate screenshot", { status: 500 });
  }
}

// The crucial change is here: explicitly listen on hostname '0.0.0.0'
serve(handler, {
  hostname: "0.0.0.0",
});
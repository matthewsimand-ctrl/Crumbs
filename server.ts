import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { ApifyClient } from "apify-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_KEY,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Apify Instacart Scraper Proxy Route
  app.post("/api/deals/search", async (req, res) => {
    try {
      const { query, zipCode, retailers } = req.body;
      if (!query || !zipCode || !retailers) {
        return res.status(400).json({ error: "Query, zipCode, and retailers are required" });
      }

      const input = {
        queries: [query],
        zipCode: zipCode,
        retailers: retailers,
        maxItems: 10,
        includeOutOfStock: false,
      };

      console.log(`Running Apify Instacart Scraper for: ${query} in ${zipCode}`);
      const run = await apifyClient.actor("apify/instacart-scraper").call(input);
      
      console.log(`Apify run started: ${run.id}. Waiting for dataset...`);
      const dataset = await apifyClient.dataset(run.defaultDatasetId);
      const { items } = await dataset.listItems();
      
      console.log(`Apify returned ${items.length} items`);
      res.json(items);
    } catch (error) {
      console.error("Apify proxy error details:", error);
      res.status(500).json({ error: "Failed to fetch deals from Instacart" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

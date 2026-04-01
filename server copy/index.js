import express from "express";
import cors from "cors";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { generateOutingPlans, getPlannerMeta } from "./planner.js";

const app = express();
const port = process.env.PORT || 8080;
const host = process.env.HOST || "127.0.0.1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "outing-planner-api" });
});

app.get("/api/meta", (_req, res) => {
  res.json(getPlannerMeta());
});

app.post("/api/plans", (req, res) => {
  try {
    const plans = generateOutingPlans(req.body);
    res.json(plans);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to generate plans."
    });
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, host, () => {
  console.log(`Outing planner API running on http://${host}:${port}`);
});

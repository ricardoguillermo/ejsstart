// src/routes/media.js
import { Router } from "express";
import multer from "multer";
import fetch from "node-fetch"; // (ok en Node 22; si no lo usás, podés quitarlo)
import path from "path";
import mime from "mime-types";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// === ENV / Config ===
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE; // p.ej. museo-media
const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY; // Storage Password (NO la API Key global)
const STORAGE_HOST = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com"; // o br.storage.bunnycdn.com
const PULL_HOST = process.env.BUNNY_PULLZONE_HOST || ""; // p.ej. museo-cdn.b-cdn.net (sin https)
const BASE_PREFIX = (process.env.BUNNY_BASE_PATH || "media").replace(
  /^\/+|\/+$/g,
  ""
); // "media" fijo

function safeName(name) {
  return name.replace(/\s+/g, "_").replace(/[^A-Za-z0-9._-]+/g, "");
}

// ========================= UPLOAD =========================
// POST /api/upload-bunny
router.post("/api/upload-bunny", upload.single("file"), async (req, res) => {
  try {
    const { STORAGE_ZONE, ACCESS_KEY, STORAGE_HOST, PULL_HOST } = cfg();

    if (!req.file) return res.status(400).json({ ok: false, error: "No file" });

    // 👉 Validaciones fuertes de ENV (te avisa si falta algo)
    if (!STORAGE_ZONE || !ACCESS_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Missing ENV",
        details: {
          BUNNY_STORAGE_ZONE: !!STORAGE_ZONE,
          BUNNY_ACCESS_KEY: !!ACCESS_KEY,
          BUNNY_STORAGE_HOST: STORAGE_HOST,
        },
      });
    }

    const { folder = "", subdir = "", customName = "" } = req.body;

    const ext = path.extname(req.file.originalname);
    const base = customName
      ? safeName(customName)
      : `${Date.now()}-${safeName(req.file.originalname)}`;
    const finalName = base.endsWith(ext) ? base : ext ? base + ext : base;

    // media/<folder>/<subdir>/<name>
    const parts = [BASE_PREFIX, folder, subdir]
      .filter(Boolean)
      .map((s) => s.replace(/^\/+|\/+$/g, ""));
    const destPath = (parts.length ? parts.join("/") + "/" : "") + finalName;

    const ct = mime.lookup(finalName) || "application/octet-stream";
    const url = `https://${STORAGE_HOST}/${encodeURIComponent(
      STORAGE_ZONE
    )}/${destPath}`;

    // 🔎 LOGS
    console.log("[BUNNY UPLOAD]", {
      host: STORAGE_HOST,
      zone: STORAGE_ZONE,
      path: destPath,
      url,
      hasKey: !!ACCESS_KEY,
      contentType: ct,
    });

    const r = await fetch(url, {
      method: "PUT",
      headers: { AccessKey: ACCESS_KEY, "Content-Type": ct },
      body: req.file.buffer,
    });

    const bodyText = await r.text().catch(() => "");
    if (!r.ok) {
      console.error("[BUNNY UPLOAD ERROR]", r.status, bodyText);
      return res.status(502).json({
        ok: false,
        error: "Bunny upload failed",
        status: r.status,
        bunnyBody: bodyText,
        debug: {
          url,
          host: STORAGE_HOST,
          zone: STORAGE_ZONE,
          hasKey: !!ACCESS_KEY,
        },
      });
    }

    // cdnUrl SIN “doble https”
    const pullHost = String(PULL_HOST)
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    const cdnUrl = pullHost ? `https://${pullHost}/${destPath}` : null;

    return res.json({
      ok: true,
      name: finalName,
      path: destPath,
      cdnUrl,
      contentType: ct,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ========================= LIST =========================
// GET /api/bunny/list?prefix=media/img&recursive=1&search=foo
router.get("/api/bunny/list", async (req, res) => {
  try {
    const { STORAGE_ZONE, ACCESS_KEY, STORAGE_HOST, PULL_HOST } = cfg();

    const prefixRaw = (req.query.prefix || "media").toString();
    const prefix = prefixRaw.replace(/^\/+|\/+$/g, "") + "/";
    const recursive = req.query.recursive === "1";
    const q = (req.query.search || "").toLowerCase();

    const url = `https://${STORAGE_HOST}/${encodeURIComponent(
      STORAGE_ZONE
    )}/${prefix}?list=true${recursive ? "&recursive=true" : ""}`;
    console.log("[BUNNY LIST]", {
      host: STORAGE_HOST,
      zone: STORAGE_ZONE,
      prefix,
      recursive,
      url,
      hasKey: !!ACCESS_KEY,
    });

    const r = await fetch(url, {
      headers: { AccessKey: ACCESS_KEY, Accept: "application/json" },
    });
    const text = await r.text();
    if (!r.ok) {
      console.error("[BUNNY LIST ERROR]", r.status, text);
      return res.status(r.status).json({
        ok: false,
        error: "List failed",
        status: r.status,
        body: text,
        debug: { prefix },
      });
    }

    // Soportar ambos formatos de Bunny: array o { Items: [...] }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = [];
    }
    const itemsRaw = Array.isArray(data) ? data : data.Items || [];

    let files = itemsRaw
      .filter((x) => !x.IsDirectory)
      .map((x) => ({
        objectName: x.ObjectName,
        length: x.Length ?? x.Size ?? 0,
        lastChanged: x.LastChanged || x.DateCreated || null,
      }));

    if (q) files = files.filter((f) => f.objectName.toLowerCase().includes(q));

    return res.json({ ok: true, prefix, count: files.length, files });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ========================= DELETE =========================
// DELETE /api/bunny?path=media/img/Leon.jpg
router.delete("/api/bunny", async (req, res) => {
  try {
    const { STORAGE_ZONE, ACCESS_KEY, STORAGE_HOST, PULL_HOST } = cfg();

    const pathToDelete = (req.query.path || "").replace(/^\/+|\/+$/g, "");
    if (!pathToDelete)
      return res.status(400).json({ ok: false, error: "Missing path" });

    const url = `https://${STORAGE_HOST}/${encodeURIComponent(
      STORAGE_ZONE
    )}/${pathToDelete}`;
    const r = await fetch(url, {
      method: "DELETE",
      headers: { AccessKey: ACCESS_KEY },
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return res
        .status(r.status)
        .json({ ok: false, error: "Delete failed", body: t });
    }
    return res.json({ ok: true, deleted: pathToDelete });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

function cfg() {
  return {
    STORAGE_ZONE: process.env.BUNNY_STORAGE_ZONE,
    ACCESS_KEY: process.env.BUNNY_ACCESS_KEY,
    STORAGE_HOST: process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com",
    PULL_HOST: process.env.BUNNY_PULLZONE_HOST || "",
  };
}

export default router;

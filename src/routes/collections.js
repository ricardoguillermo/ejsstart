import { Router } from "express";
import path from "path";
import { createCollectionsAPI } from "../lib/collections.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const DATA_DIR = process.env.DATA_DIR || "/var/data";
const api = createCollectionsAPI({ dataDir: DATA_DIR });

await api.init();

// LISTAR nombres
router.get("/api/collections", requireAuth, async (req, res) => {
  const list = await api.listCollections();
  const current = await api.getCurrentName();
  res.json({ ok: true, list, current });
});

// LEER
router.get("/api/collections/:name", requireAuth, async (req, res) => {
  try {
    const data = await api.loadCollection(req.params.name);
    res.json({ ok: true, name: req.params.name, data });
  } catch (e) {
    res.status(404).json({ ok: false, error: "Not found" });
  }
});

// GUARDAR (reemplaza)
router.post("/api/collections/:name", requireAuth, async (req, res) => {
  try {
    await api.saveCollection(req.params.name, req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// CAMBIAR colección activa
router.post("/api/collections/:name/use", requireAuth, async (req, res) => {
  await api.setCurrentName(req.params.name);
  res.json({ ok: true });
});

// POST /api/collections/:name/items   body: { id,title,category,description,imageUrl }
router.post("/api/collections/:name/items", async (req, res) => {
  try {
    const name = req.params.name;
    const coll = await api.loadCollection(name).catch(() => ({ items: [] }));
    const item = req.body || {};
    if (!item.id || !item.title)
      return res
        .status(400)
        .json({ ok: false, error: "id y title son requeridos" });

    coll.items = Array.isArray(coll.items) ? coll.items : [];
    // evitar duplicado por id
    if (coll.items.some((x) => String(x.id) === String(item.id))) {
      return res.status(409).json({ ok: false, error: "ID duplicado" });
    }
    coll.items.push(item);
    await api.saveCollection(name, coll);
    res.json({ ok: true, added: item.id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;

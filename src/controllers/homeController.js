// src/controllers/homeController.js
import { createCollectionsAPI } from "../lib/collections.js";

const DATA_DIR = process.env.DATA_DIR || "/var/data";
const api = createCollectionsAPI({ dataDir: DATA_DIR });
await api.init();

const pullRaw = process.env.BUNNY_PULLZONE_HOST || "";
const cdnHost = pullRaw.replace(/^https?:\/\//, "").replace(/\/+$/, "");

export async function home(req, res) {
  // 👇 Garantiza nombre válido y colección existente
  let current = await api.getCurrentName();
  if (!current) {
    current = "default";
    await api.setCurrentName(current);
  }
  const coll = await api.loadCollection(current); // { items: [] }

  const q = (req.query.q || "").trim().toLowerCase();
  const cat = (req.query.category || "").trim();

  let items = Array.isArray(coll.items) ? coll.items : [];
  if (q)
    items = items.filter(
      (it) =>
        (it.title || "").toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q) ||
        (Array.isArray(it.tags)
          ? it.tags.join(" ").toLowerCase().includes(q)
          : false)
    );
  if (cat)
    items = items.filter((it) => String(it.category || "") === String(cat));

  const categories = [
    ...new Set(items.map((it) => it.category).filter(Boolean)),
  ].sort();

  res.render("index", {
    title: `Catálogo — ${current}`,
    q: req.query.q || "",
    categories,
    query: { category: cat },
    items,
    cdnHost,
  });
}

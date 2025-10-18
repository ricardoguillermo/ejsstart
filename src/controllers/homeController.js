import path from "path";
import { createCollectionsAPI } from "../lib/collections.js";

const DATA_DIR = process.env.DATA_DIR || "/var/data";
const api = createCollectionsAPI({ dataDir: DATA_DIR });
await api.init();

export async function home(req, res) {
  const q = (req.query.q || "").trim().toLowerCase();
  const cat = (req.query.category || "").trim();

  const current = await api.getCurrentName();
  const coll = await api.loadCollection(current); // { items: [...] }

  let items = Array.isArray(coll.items) ? coll.items : [];
  if (q)
    items = items.filter(
      (it) =>
        (it.title || "").toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q)
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
  });
}

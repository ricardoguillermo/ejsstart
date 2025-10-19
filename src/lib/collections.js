// src/lib/collections.js
import fs from "fs/promises";
import path from "path";

export function ensureDir(p) {
  return fs.mkdir(p, { recursive: true }).catch(() => {});
}

export function createCollectionsAPI(opts) {
  const DATA_DIR = opts.dataDir; // ej: /var/data  (en Render) o ./data (local)
  const COLL_DIR = path.join(DATA_DIR, "collections");
  const CURRENT_FILE = path.join(COLL_DIR, "current.txt");

  async function init() {
    await ensureDir(COLL_DIR);

    // Si current.txt no existe o está vacío → crear "default" y setearla activa
    let current = "";
    try {
      current = (await fs.readFile(CURRENT_FILE, "utf8")).trim();
    } catch {
      // no pasa nada: se crea abajo
    }
    if (!current) {
      // Asegurar default.json
      await saveCollection("default", await _safeLoad("default"));
      await fs.writeFile(CURRENT_FILE, "default", "utf8");
    }
  }

  async function listCollections() {
    await ensureDir(COLL_DIR);
    const all = await fs.readdir(COLL_DIR);
    return all
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
  }

  async function _safeLoad(name) {
    // Intenta leer; si no existe, devuelve estructura vacía
    const file = path.join(COLL_DIR, `${name}.json`);
    try {
      const raw = await fs.readFile(file, "utf8");
      return JSON.parse(raw);
    } catch {
      return { items: [] };
    }
  }

  async function loadCollection(name) {
    if (!name) name = "default";
    const data = await _safeLoad(name);
    // Garantizar shape mínima
    if (!data || typeof data !== "object") return { items: [] };
    if (!Array.isArray(data.items)) data.items = [];
    return data;
  }

  async function saveCollection(name, data) {
    if (!name) name = "default";
    const file = path.join(COLL_DIR, `${name}.json`);
    const tmp = file + ".tmp";
    await fs.writeFile(
      tmp,
      JSON.stringify(data || { items: [] }, null, 2),
      "utf8"
    );
    await fs.rename(tmp, file);
  }

  async function getCurrentName() {
    try {
      const txt = (await fs.readFile(CURRENT_FILE, "utf8")).trim();
      return txt || "default"; // <- fallback si está vacío
    } catch {
      return "default";
    }
  }

  async function setCurrentName(name) {
    if (!name) name = "default";
    // Asegurar que exista el archivo de esa colección
    const data = await _safeLoad(name);
    await saveCollection(name, data);
    await fs.writeFile(CURRENT_FILE, name, "utf8");
  }

  return {
    COLL_DIR,
    CURRENT_FILE,
    init,
    listCollections,
    loadCollection,
    saveCollection,
    getCurrentName,
    setCurrentName,
  };
}

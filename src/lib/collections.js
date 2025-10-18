import fs from "fs/promises";
import path from "path";

export function ensureDir(p) {
  return fs.mkdir(p, { recursive: true }).catch(() => {});
}

export function createCollectionsAPI(opts) {
  const DATA_DIR = opts.dataDir; // ej: /var/data
  const COLL_DIR = path.join(DATA_DIR, "collections");
  const CURRENT_FILE = path.join(COLL_DIR, "current.txt");

  async function init() {
    await ensureDir(COLL_DIR);
    try {
      await fs.access(CURRENT_FILE);
    } catch {
      // si no existe elegir la primera colección o crear una vacía
      const list = await listCollections();
      const name = list[0] || "default";
      if (!list.includes("default"))
        await saveCollection("default", { items: [] });
      await fs.writeFile(CURRENT_FILE, name, "utf8");
    }
  }

  async function listCollections() {
    await ensureDir(COLL_DIR);
    const all = await fs.readdir(COLL_DIR);
    return all
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  }

  async function loadCollection(name) {
    const file = path.join(COLL_DIR, `${name}.json`);
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  }

  async function saveCollection(name, data) {
    const file = path.join(COLL_DIR, `${name}.json`);
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, file);
  }

  async function getCurrentName() {
    try {
      return (await fs.readFile(CURRENT_FILE, "utf8")).trim();
    } catch {
      return "default";
    }
  }

  async function setCurrentName(name) {
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

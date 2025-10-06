import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "..", "data");

async function readJSON(filename) {
  const filePath = path.join(dataDir, filename);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeJSON(filename, value) {
  const filePath = path.join(dataDir, filename);
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

export const DB = {
  async getItems() {
    return await readJSON("items.json");
  },
  async saveItems(items) {
    return await writeJSON("items.json", items);
  }
};

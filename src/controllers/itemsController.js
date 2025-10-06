import { DB } from "../lib/db.js";
import { v4 as uuid } from "uuid";

export async function listHome(req, res) {
  const items = await DB.getItems();
  const q = (req.query.q || "").toLowerCase();
  const category = (req.query.category || "").toLowerCase();

  let filtered = items;
  if (q) filtered = filtered.filter(i => (i.title + " " + i.description).toLowerCase().includes(q));
  if (category) filtered = filtered.filter(i => (i.category || "").toLowerCase() === category);

  res.render("index", { title: "Inicio", items: filtered, categories: getCategories(items) });
}

export async function showItem(req, res) {
  const items = await DB.getItems();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).render("404", { title: "No encontrado" });
  res.render("items/show", { title: item.title, item });
}

export async function adminIndex(req, res) {
  const items = await DB.getItems();
  res.render("admin/index", { title: "Admin", items });
}

export async function newItemForm(req, res) {
  res.render("items/form", { title: "Nueva pieza", item: {}, action: "/admin/items" });
}

export async function createItem(req, res) {
  const items = await DB.getItems();
  const { title, category, imageUrl, audioUrl, videoUrl, description, comments } = req.body;
  const item = {
    id: uuid(),
    title,
    category,
    imageUrl,
    audioUrl,
    videoUrl,
    description,
    comments
  };
  items.push(item);
  await DB.saveItems(items);
  res.redirect("/admin");
}

export async function editItemForm(req, res) {
  const items = await DB.getItems();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).render("404", { title: "No encontrado" });
  res.render("items/form", { title: "Editar pieza", item, action: `/admin/items/${item.id}?_method=PUT` });
}

export async function updateItem(req, res) {
  const items = await DB.getItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).render("404", { title: "No encontrado" });
  const { title, category, imageUrl, audioUrl, videoUrl, description, comments } = req.body;
  items[idx] = { ...items[idx], title, category, imageUrl, audioUrl, videoUrl, description, comments };
  await DB.saveItems(items);
  res.redirect("/admin");
}

export async function deleteItem(req, res) {
  const items = await DB.getItems();
  const filtered = items.filter(i => i.id !== req.params.id);
  await DB.saveItems(filtered);
  res.redirect("/admin");
}

function getCategories(items) {
  return Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort();
}

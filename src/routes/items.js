import { Router } from "express";
import { ensureAuth } from "../middleware/auth.js";
import { newItemForm, createItem, editItemForm, updateItem, deleteItem } from "../controllers/itemsController.js";

const router = Router();

router.get("/new", ensureAuth, newItemForm);
router.post("/", ensureAuth, createItem);
router.get("/:id/edit", ensureAuth, editItemForm);
router.put("/:id", ensureAuth, updateItem);
router.delete("/:id", ensureAuth, deleteItem);

export default router;

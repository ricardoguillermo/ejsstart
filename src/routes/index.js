import { Router } from "express";
import { listHome, showItem, adminIndex } from "../controllers/itemsController.js";
import { ensureAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listHome);
router.get("/items/:id", showItem);
router.get("/admin", ensureAuth, adminIndex);

export default router;

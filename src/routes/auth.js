import { Router } from "express";
import { showLogin, login, logout } from "../controllers/authController.js";
import { ensureAuth } from "../middleware/auth.js";

const router = Router();

router.get("/login", showLogin);
router.post("/login", login);
router.post("/logout", ensureAuth, logout);

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/imprimir-qr", requireAuth, (req, res) => {
  res.render("imprimir_qr", { layout: "layout", title: "Imprimir QR" });
});

export default router;

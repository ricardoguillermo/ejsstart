import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/admin", requireAuth, (req, res) => {
  res.render("admin/index", {
    title: "Panel de administración",
    cdnHost: process.env.BUNNY_PULLZONE_HOST || "",
  });
});

export default router;

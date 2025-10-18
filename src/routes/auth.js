import { Router } from "express";

const router = Router();

router.get("/login", (req, res) => {
  res.render("auth/login", {
    title: "Login",
    error: req.query.err ? "Credenciales inválidas" : null,
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const u = process.env.ADMIN_USER || "admin";
  const p = process.env.ADMIN_PASS || "1234";

  if (username === u && password === p) {
    req.session.user = { username };
    const nextUrl = req.query.next || "/";
    return res.redirect(nextUrl);
  }
  res.redirect("/login?err=1");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default router;

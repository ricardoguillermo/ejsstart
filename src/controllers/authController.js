export function showLogin(req, res) {
  res.render("auth/login", { title: "Ingresar" });
}

export function login(req, res) {
  const { username, password } = req.body;
  const u = process.env.ADMIN_USER || "admin";
  const p = process.env.ADMIN_PASS || "changeme";

  if (username === u && password === p) {
    req.session.user = { username: u };
    const next = req.query.next || "/admin";
    return res.redirect(next);
  }
  res.status(401).render("auth/login", { title: "Ingresar", error: "Usuario o clave incorrectos" });
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.redirect("/");
  });
}

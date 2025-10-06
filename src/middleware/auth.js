export function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect("/login?next=" + encodeURIComponent(req.originalUrl || "/admin"));
}

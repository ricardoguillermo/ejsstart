import dotenv from "dotenv";
import express from "express";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";

import { fileURLToPath } from "url";

import { home } from "./controllers/homeController.js";
import imprimirRoutes from "./routes/imprimir.js";
import authRoutes from "./routes/auth.js";

import adminRoutes from "./routes/admin.js";
import mediaRoutes from "./routes/media.js";

import collRoutes from "./routes/collections.js";

// parsers, sesión, etc. ya están

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config(); // carga .env en dev

console.log("[DATA_DIR]", process.env.DATA_DIR || "/var/data");
console.log(
  "[Collections dir]",
  `${process.env.DATA_DIR || "/var/data"}/collections`
);

const app = express();

// EJS + Layouts  ✅ (apunta a src/views)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

// Estáticos  ✅ (apunta a src/public)
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Locals
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  if (res.locals.title === undefined) res.locals.title = "App";
  next();
});

// Rutas
app.use(authRoutes);
app.get("/", home);
app.use(imprimirRoutes);

app.use(adminRoutes);
app.use(mediaRoutes);
app.use(collRoutes);
// (opcional) 404 al final
// app.use((req,res)=> res.status(404).render('404', { title:'No encontrado' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);

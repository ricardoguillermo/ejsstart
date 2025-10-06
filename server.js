import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
import morgan from "morgan";
import methodOverride from "method-override";
import expressLayouts from "express-ejs-layouts";

import indexRoutes from "./src/routes/index.js";
import authRoutes from "./src/routes/auth.js";
import itemsRoutes from "./src/routes/items.js";
import qrRoutes from "./src/routes/qr.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.use(expressLayouts);
app.set("layout", "layout");
app.set("trust proxy", 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", qrRoutes);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

// Expose session user to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.query = req.query || {};
  res.locals.q = req.query.q || "";
  next();
});

// Routes
app.use("/", indexRoutes);
app.use("/", authRoutes);
app.use("/admin/items", itemsRoutes);

// 404
app.use((req, res) => {
  res.status(404).render("404", { title: "No encontrado" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

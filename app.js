require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

// SETTING PATH VIEW (BIAR GAK 403)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "vault-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);

// DATABASE CONNECTION (SERVERLESS FRIENDLY)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;

    // Auto-seed admin
    const User =
      mongoose.models.User ||
      mongoose.model(
        "User",
        new mongoose.Schema({
          username: { type: String, unique: true },
          password: { type: String },
        }),
      );
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const hash = await bcrypt.hash("admin123", 10);
      await User.create({ username: "admin", password: hash });
    }
  } catch (err) {
    console.error("DB Error:", err.message);
  }
};

// MODELS
const Entry =
  mongoose.models.Entry ||
  mongoose.model(
    "Entry",
    new mongoose.Schema({
      category: String,
      name: String,
      url: String,
      description: String,
    }),
  );
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema({ username: String, password: { type: String } }),
  );

// MIDDLEWARE UNTUK CONNECT DB SETIAP REQUEST
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- ROUTES ---
app.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";
    const filter = q
      ? {
          $or: [
            { name: new RegExp(q, "i") },
            { description: new RegExp(q, "i") },
            { category: new RegExp(q, "i") },
          ],
        }
      : {};
    const entries = await Entry.find(filter).sort({ category: 1 });
    const categories = [...new Set(entries.map((e) => e.category))];
    res.render("index", { entries, categories, q, admin: req.session.adminId });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.get("/login", (req, res) => res.render("login", { error: null }));

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.adminId = user._id;
    res.redirect("/admin");
  } else {
    res.render("login", { error: "Gagal Login" });
  }
});

app.get("/admin", async (req, res) => {
  if (!req.session.adminId) return res.redirect("/login");
  const q = req.query.q || "";
  const filter = q
    ? {
        $or: [
          { name: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
        ],
      }
    : {};
  const entries = await Entry.find(filter).sort({ _id: -1 });
  res.render("admin", { entries, q });
});

app.post("/admin/add", async (req, res) => {
  if (req.session.adminId) await Entry.create(req.body);
  res.redirect("/admin");
});

app.post("/admin/edit", async (req, res) => {
  if (req.session.adminId) {
    const { id, ...data } = req.body;
    await Entry.findByIdAndUpdate(id, data);
  }
  res.redirect("/admin");
});

app.post("/admin/delete/:id", async (req, res) => {
  if (req.session.adminId) await Entry.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// UNTUK VERCEL
module.exports = app;

// UNTUK LOKAL
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => console.log("http://localhost:3000"));
}

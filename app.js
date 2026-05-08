require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();

// Database Connection & Auto-Create Admin
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({ username: "admin", password: hashedPassword });
      console.log("Admin account created: admin / admin123");
    }
  })
  .catch((err) => console.log(err));

// Schema
const Entry = mongoose.model(
  "Entry",
  new mongoose.Schema({
    category: String,
    name: String,
    url: String,
    description: String,
  }),
);
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
  }),
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);

// Routes
app.get("/", async (req, res) => {
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
});

app.get("/login", (req, res) => res.render("login", { error: null }));
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.adminId = user._id;
    res.redirect("/admin");
  } else {
    res.render("login", { error: "Salah!" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));

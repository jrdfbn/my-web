require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

app.set("trust proxy", 1);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const mongoUrl = process.env.MONGODB_URI;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "vault-secret-super",
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: mongoUrl }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: true,
      sameSite: "none",
    },
  }),
);

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
    new mongoose.Schema({
      username: { type: String, unique: true },
      password: { type: String },
    }),
  );

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(mongoUrl);
    isConnected = true;

    // --- AUTO-SEED SEMUA DATA URL DARI MARKDOWN ---
    const count = await Entry.countDocuments();
    if (count === 0) {
      const initialData = [
        // Online Tools
        {
          category: "🔗 Online Tools",
          name: "Arena",
          url: "https://arena.ai/?mode=direct",
          description: "Multiple Models / No Sign-Up",
        },
        {
          category: "🔗 Online Tools",
          name: "TTS Online",
          url: "https://www.text-to-speech.online/",
          description: "Text to Speech",
        },
        {
          category: "🔗 Online Tools",
          name: "phrasefix",
          url: "https://phrasefix.com/",
          description: "Text Editor Tool - Case Converter",
        },
        {
          category: "🔗 Online Tools",
          name: "DeDupeList",
          url: "https://dedupelist.com/",
          description: "Remove duplicate lines from a list",
        },
        {
          category: "🔗 Online Tools",
          name: "IT-Tools OTP",
          url: "https://it-tools.tech/otp-generator",
          description: "OTP Generator for developers",
        },
        {
          category: "🔗 Online Tools",
          name: "Change CSV Delimiter",
          url: "https://onlinetools.com/csv/change-csv-delimiter",
          description: "CSV Column Delimiter Changer",
        },
        {
          category: "🔗 Online Tools",
          name: "JSON to Schema",
          url: "https://www.liquid-technologies.com/online-json-to-schema-converter",
          description: "JSON to JSON Schema Converter",
        },
        {
          category: "🔗 Online Tools",
          name: "Dummy JSON",
          url: "https://dummyjson.com/docs",
          description: "Dummy JSON for Testing",
        },
        {
          category: "🔗 Online Tools",
          name: "BentoPDF",
          url: "https://www.bentopdf.com/#tools-header",
          description: "Online PDF Tools",
        },
        {
          category: "🔗 Online Tools",
          name: "Pairdrop",
          url: "https://pairdrop.net/",
          description: "P2P Transfer files across devices",
        },
        {
          category: "🔗 Online Tools",
          name: "MiniQR",
          url: "https://mini-qr-code-generator.vercel.app/",
          description: "Mini QR Code Generator",
        },
        {
          category: "🔗 Online Tools",
          name: "Mockaroo",
          url: "https://mockaroo.com/",
          description: "Data Generator",
        },
        {
          category: "🔗 Online Tools",
          name: "draw.io",
          url: "https://www.drawio.com/",
          description: "Diagramming application",
        },
        {
          category: "🔗 Online Tools",
          name: "Excalidraw",
          url: "https://excalidraw.com/",
          description: "Whiteboard",
        },
        {
          category: "🔗 Online Tools",
          name: "RX Resume",
          url: "https://rxresu.me/",
          description: "Free open-source resume builder",
        },
        {
          category: "🔗 Online Tools",
          name: "Hotkey Cheatsheet",
          url: "https://hotkeycheatsheet.com/",
          description: "Hotkey Cheatsheet",
        },
        {
          category: "🔗 Online Tools",
          name: "LanguageTool",
          url: "https://languagetool.org/",
          description: "Grammar Checker",
        },
        {
          category: "🔗 Online Tools",
          name: "CURL Converter",
          url: "https://curlconverter.com/node-ky/",
          description: "Convert curl to Python/JS",
        },
        {
          category: "🔗 Online Tools",
          name: "Caesium",
          url: "https://caesium.app/",
          description: "Image Compressor",
        },
        {
          category: "🔗 Online Tools",
          name: "Faker",
          url: "https://fakerjs.dev/",
          description: "Generate fake data for testing",
        },
        {
          category: "🔗 Online Tools",
          name: "SmailPro",
          url: "https://smailpro.com/temporary-email",
          description: "Temporary Gmail & Outlook",
        },
        {
          category: "🔗 Online Tools",
          name: "DeepL",
          url: "https://www.deepl.com/en/translator",
          description: "AI-Based Translation",
        },
        {
          category: "🔗 Online Tools",
          name: "CodeImage",
          url: "https://app.codeimage.dev/",
          description: "Manage code snippets beautifully",
        },
        {
          category: "🔗 Online Tools",
          name: "MarkdownToPDF",
          url: "https://www.markdowntopdf.com/",
          description: "Convert markdown to PDF",
        },

        // Desktop Apps
        {
          category: "💻 Desktop Apps",
          name: "DevToys",
          url: "https://devtoys.app/",
          description: "Swiss Army knife for developers",
        },
        {
          category: "💻 Desktop Apps",
          name: "PowerToys",
          url: "https://github.com/microsoft/PowerToys",
          description: "Quality of life utilities",
        },
        {
          category: "💻 Desktop Apps",
          name: "NanaZip",
          url: "https://github.com/M2Team/NanaZip",
          description: "Designed for Windows 11",
        },
        {
          category: "💻 Desktop Apps",
          name: "EarTrumpet",
          url: "https://eartrumpet.app/",
          description: "Volume control for Windows",
        },
        {
          category: "💻 Desktop Apps",
          name: "QuickLook",
          url: "https://github.com/QL-Win/QuickLook",
          description: "macOS Quick Look for Windows",
        },
        {
          category: "💻 Desktop Apps",
          name: "Bulk Crap Uninstaller",
          url: "https://www.bcuninstaller.com/",
          description: "Bulk Uninstallation Tools",
        },
        {
          category: "💻 Desktop Apps",
          name: "LosslessCut",
          url: "https://mifi.no/losslesscut/",
          description: "Lossless Video/Audio Editing",
        },
        {
          category: "💻 Desktop Apps",
          name: "File Converter",
          url: "https://file-converter.io/",
          description: "Convert everything in 2 clicks",
        },
        {
          category: "💻 Desktop Apps",
          name: "ShareX",
          url: "https://getsharex.com/",
          description: "Screen capture & productivity",
        },
        {
          category: "💻 Desktop Apps",
          name: "WizTree",
          url: "https://diskanalyzer.com/",
          description: "Fast Disk Space Analyzer",
        },
        {
          category: "💻 Desktop Apps",
          name: "LocalSend",
          url: "https://localsend.org/",
          description: "File Transfer",
        },

        // Extensions
        {
          category: "🌐 Chrome Extensions",
          name: "Awesome Screen Recorder",
          url: "https://chromewebstore.google.com/",
          description: "Recorder & Screenshot",
        },
        {
          category: "📝 VSCode Extensions",
          name: "Excel Viewer",
          url: "https://marketplace.visualstudio.com/",
          description: "Edit Excel/CSV in Code",
        },
        {
          category: "📝 VSCode Extensions",
          name: "Codeium: AI",
          url: "https://marketplace.visualstudio.com/",
          description: "Free AI coding assistant",
        },

        // Misc
        {
          category: "📦 Misc",
          name: "MAS Windows",
          url: "https://massgrave.dev/",
          description: "Windows & Office activator",
        },
        {
          category: "📦 Misc",
          name: "FK relationships",
          url: "https://rentry.co/RksgcmVsYXRpb25zaGlwcw",
          description: "SQLSERVER FK list",
        },
        {
          category: "📦 Misc",
          name: "iPhone System Data",
          url: "https://rentry.co/ZGVsZXRlIG9yIHNocmluayBpUGhvbmUgU3lzdGVtIERhdGE",
          description: "Shrink iPhone System Data",
        },
        {
          category: "📦 Misc",
          name: "AI Prompts",
          url: "https://rentry.co/cHJvbXB0LTE",
          description: "AI Code Explainer prompts",
        },
      ];
      await Entry.insertMany(initialData);

      const hash = await bcrypt.hash("admin123", 10);
      await User.findOneAndUpdate(
        { username: "admin" },
        { password: hash },
        { upsert: true },
      );
    }
  } catch (err) {
    console.log(err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

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
  const user = await User.findOne({ username: username.toLowerCase() });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.adminId = user._id.toString();
    req.session.save(() => res.redirect("/admin"));
  } else {
    res.render("login", { error: "Username/Password Salah" });
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

module.exports = app;

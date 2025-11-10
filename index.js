const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced CORS Configuration
const corsOptions = {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rest of your code...


// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const MONGODB_URI = "mongodb+srv://12345:12345@news.apblc.mongodb.net/?retryWrites=true&w=majority&appName=News";

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB Atlas");
}).catch(err => {
    console.error("❌ MongoDB Atlas connection error:", err);
});

// News Schema with additional verification fields
const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "No description available" },
    url: { type: String, required: true },
    image: { type: String, default: "/image.png" },
    source: { type: String, default: "Unknown" },
    publishedAt: { type: Date, default: Date.now },
    savedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verificationStatus: { 
        type: String, 
        enum: ['unverified', 'verified', 'suspicious', 'uncertain'],
        default: 'unverified'
    },
    geminiVerification: { type: String, default: null },
    perplexityVerification: { type: String, default: null }
});

const News = mongoose.model("News", newsSchema);

// ============================================
// ROUTES
// ============================================

// Render Home Page
app.get("/", (req, res) => {
    res.render("index");
});

// Get all saved news
app.get("/api/saved-news", async (req, res) => {
    try {
        const savedNews = await News.find().sort({ savedAt: -1 });
        res.json(savedNews);
    } catch (error) {
        console.error("❌ Error fetching saved news:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Save a news article
app.post("/api/saved-news", async (req, res) => {
    try {
        // Check for duplicate news by URL to avoid multiple saves
        const existingNews = await News.findOne({ url: req.body.url });
        if (existingNews) {
            return res.status(200).json({ 
                message: "News already saved", 
                news: existingNews, 
                alreadySaved: true 
            });
        }

        const newNews = new News(req.body);
        const savedNews = await newNews.save();
        res.status(201).json(savedNews);
    } catch (error) {
        console.error("❌ Error saving news:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update verification status of saved news
app.patch("/api/saved-news/:id/verify", async (req, res) => {
    try {
        const { verificationStatus, geminiVerification, perplexityVerification } = req.body;
        
        const updatedNews = await News.findByIdAndUpdate(
            req.params.id,
            {
                verified: verificationStatus === 'verified',
                verificationStatus,
                geminiVerification,
                perplexityVerification
            },
            { new: true }
        );

        if (!updatedNews) {
            return res.status(404).json({ message: "News not found" });
        }

        res.json(updatedNews);
    } catch (error) {
        console.error("❌ Error updating verification:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete a saved news article
app.delete("/api/saved-news/:id", async (req, res) => {
    try {
        const deletedNews = await News.findByIdAndDelete(req.params.id);
        if (!deletedNews) {
            return res.status(404).json({ message: "News not found" });
        }
        res.json({ message: "News deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting news:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get statistics
app.get("/api/stats", async (req, res) => {
    try {
        const totalSaved = await News.countDocuments();
        const verified = await News.countDocuments({ verificationStatus: 'verified' });
        const suspicious = await News.countDocuments({ verificationStatus: 'suspicious' });
        const uncertain = await News.countDocuments({ verificationStatus: 'uncertain' });
        
        res.json({
            totalSaved,
            verified,
            suspicious,
            uncertain,
            unverified: totalSaved - verified - suspicious - uncertain
        });
    } catch (error) {
        console.error("❌ Error fetching stats:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

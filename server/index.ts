import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { generatePdfFromHtml } from "./pdfExport.ts";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "uploads", // Optional: specify a folder in your Cloudinary account
      allowed_formats: ["jpg", "png", "jpeg", "gif"],
      public_id: file.originalname.split('.')[0], // Optional: specify a public ID
    };
  },
});

const upload = multer({ storage });

// Upload endpoint
app.post("/api/upload", upload.single("file"),(req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return the Cloudinary URL for the uploaded file
  console.log("File uploaded to Cloudinary:", req.file);
  res.json({ url: req.file.path, public_id: req.file.filename });
});

app.delete("/api/delete-image", async (req, res) => {
  const { public_id } = req.body;
  if (!public_id) {
    return res.status(400).json({ error: "No public ID provided" });
  }

  try {
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    res.status(500).json({ error: "Failed to delete image from Cloudinary" });
  }
});


// New PDF export endpoint using Puppeteer
app.post("/api/export-pdf", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: "Missing html content in request body" });
    }

    const pdfBuffer = await generatePdfFromHtml(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=export.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});




// chatbot endpoint
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

app.post("/api/chat", async (req, res) => {
  const { messages, notes } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ reply: "Please include a valid message array." });
  }

  // Combine all notes into a summary string
  const notesText = Array.isArray(notes)
    ? notes.map((note) => `- ${note.title}: ${note.markdown}`).join("\n")
    : "No notes provided.";

  // Extract the latest user message
  const latestUserMessage = messages[messages.length - 1]?.content || "";

  const userPrompt = `The user has the following notes:\n${notesText}\n\nBased on the notes, answer the following question:\n"${latestUserMessage}"`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant built into a note-taking app. Use the user's notes along with your general knowledge to answer questions clearly and helpfully. Keep your responses short and focused unless the user specifically asks for more detail—in that case, provide a slightly more in-depth explanation. If the user asks who created you, you can say you were made by Narendra Meloni.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    const data = (await response.json()) as {
      choices: { message: { role: string; content: string } }[];
    };

    let reply = data.choices?.[0]?.message?.content || "No response.";
    reply = reply.replace(/^Bot: <think>[\s\S]*?<\/think>\s*/g, '')
                .replace(/<think>[\s\S]*?<\/think>\s*/g, '')
                .trim();
    res.json({ reply });
  } catch (error) {
    console.error("Groq error:", error);
    res.status(500).json({ reply: "Error contacting Groq." });
  }
});

// this is definitely a good way to check if the server is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
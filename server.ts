import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  app.post("/api/generate-timeline", async (req, res) => {
    try {
      const { idea } = req.body;
      if (!idea) {
        return res.status(400).json({ error: "Project idea is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Generate an IT project management timeline based on the following project idea: "${idea}"`,
        config: {
          systemInstruction: "You are an expert IT project manager. Given a project idea, generate a structured timeline with logical milestones and tasks, along with estimated durations in days. Ensure all task names and milestone names are professional and concise.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              summary: { type: Type.STRING },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          description: { type: Type.STRING },
                          durationDays: { type: Type.NUMBER }
                        },
                        required: ["id", "name", "description", "durationDays"]
                      }
                    }
                  },
                  required: ["id", "name", "description", "tasks"]
                }
              }
            },
            required: ["projectName", "summary", "milestones"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI");
      }

      const timeline = JSON.parse(text);
      res.json(timeline);

    } catch (error: any) {
      console.error("Timeline generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate timeline" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

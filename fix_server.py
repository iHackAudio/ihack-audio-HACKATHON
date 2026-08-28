import re

with open("server.ts", "r") as f:
    content = f.read()

phase5_api = """
  // Phase 5: Cinematic Script Generation
  app.post("/api/pipeline/phase5-generate-script", async (req, res) => {
    try {
      const { generatePhase5CinematicScriptService } = await import("./server/geminiService.ts");
      const { loadStoryBible } = await import("./server/storyBibleManager.ts");
      const bible = loadStoryBible();
      const cpsdDocument = req.body.cpsdDocument;
      if (!cpsdDocument) {
        return res.status(400).json({ error: "No CPSD Document provided" });
      }
      const result = await generatePhase5CinematicScriptService(cpsdDocument, bible);
      res.json(result);
    } catch (err: any) {
      console.error("Phase 5 Script generation failed:", err);
      res.status(500).json({ error: err.message });
    }
  });
"""

if "phase5-generate-script" not in content:
    content = content.replace("// 3.2 Set up HTTP Server and WebSocket", phase5_api + "\n  // 3.2 Set up HTTP Server and WebSocket")

with open("server.ts", "w") as f:
    f.write(content)

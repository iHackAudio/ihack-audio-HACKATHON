import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";

const WORKSPACE_DIR = path.join(process.cwd(), "workspace files");

function resolveWorkspacePath(filename: string): string {
  let relative = filename;
  // Normalize if path explicitly contains "workspace files/" or "workspace files\" prefix
  if (relative.startsWith("workspace files/") || relative.startsWith("workspace files\\")) {
    relative = relative.substring("workspace files/".length);
  }
  const safePath = path.resolve(WORKSPACE_DIR, relative);
  if (!safePath.startsWith(WORKSPACE_DIR)) {
    throw new Error("Path traversal attempt detected");
  }
  return safePath;
}

/**
 * 1. Multimodal PDF Parsing for Manuscripts
 * Uses Gemini's native PDF understanding to convert a PDF manuscript to clean, structured Markdown chapters.
 */
export async function parsePdfManuscript(filename: string, apiKey: string): Promise<string> {
  const targetPath = resolveWorkspacePath(filename);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`File not found: ${filename}`);
  }

  const fileBuffer = fs.readFileSync(targetPath);
  const base64Data = fileBuffer.toString("base64");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data
        }
      },
      "Parse this manuscript completely and extract the text into a clean Markdown document. Preserve chapter headings, paragraphs, and dialogue formatting. Remove any page numbers, headers, or footers. Do not add any filler text or conversational intro."
    ]
  });

  const parsedMarkdown = response.text || "";
  
  const parsedFilename = filename.replace(/\.pdf$/i, "") + "_parsed_script.md";
  const parsedPath = resolveWorkspacePath(parsedFilename);
  fs.writeFileSync(parsedPath, parsedMarkdown, "utf-8");

  return parsedMarkdown;
}

/**
 * 2. Token Counting and Audio Duration Estimator
 * Analyzes the text to count words, characters, estimate Gemini tokens, and calculate audiobook duration.
 */
export async function countScriptTokens(
  filename: string,
  apiKey: string
): Promise<any> {
  const filePath = resolveWorkspacePath(filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filename}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  
  // Standard audiobook pacing is about 155 words per minute
  const wpm = 155;
  const estimatedMinutes = wordCount / wpm;
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = Math.floor(estimatedMinutes % 60);
  const durationStr = `${hours}h ${minutes}m`;

  const ai = new GoogleGenAI({ apiKey });
  let tokenCount = -1;
  try {
    const response = await ai.models.countTokens({
      model: "gemini-3.1-flash-lite",
      contents: content
    });
    tokenCount = response.totalTokens;
  } catch (err: any) {
    console.error("Token counting failed:", err.message);
  }

  const result = {
    filename,
    wordCount,
    charCount,
    estimatedTokens: tokenCount,
    estimatedAudiobookDuration: durationStr,
    wordsPerMinuteAssumption: wpm
  };

  const reportPath = resolveWorkspacePath(filename.replace(/\.md$/, "") + "_metrics.json");
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), "utf-8");

  return result;
}

/**
 * 3. Phonetic Pronunciation Verification
 * Queries Wikidata and the local phonetic dictionary to verify pronunciations of character names, locations, or complex terms.
 */
export async function verifyPronunciation(term: string): Promise<any> {
  try {
    // First, check if term is in local phonetic dictionary if it exists
    const localDictPath = path.resolve(WORKSPACE_DIR, "protocols/Phonetic Dictionary.md");
    if (fs.existsSync(localDictPath)) {
      const dictContent = fs.readFileSync(localDictPath, "utf-8");
      // Simple text search
      const regex = new RegExp(`(?<=\\n|^).*?${term}.*?(?=\\n|$)`, 'i');
      const match = dictContent.match(regex);
      if (match) {
        return {
          term,
          source: "Local Phonetic Dictionary",
          entry: match[0].trim(),
          verified: true
        };
      }
    }

    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      term
    )}&language=en&format=json&origin=*`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Wikidata query failed with status: ${response.status}`);
    }

    const data = await response.json() as any;
    if (!data.search || data.search.length === 0) {
      return {
        term,
        verified: false,
        message: "Not found in local dictionary or Wikidata."
      };
    }

    const match = data.search[0];
    return {
      term,
      verified: true,
      source: "Wikidata",
      wikidataId: match.id,
      label: match.label,
      description: match.description || "No description available.",
      message: `Found in Wikidata: ${match.label} (${match.description}). Ensure standard pronunciation unless specified.`
    };
  } catch (err: any) {
    return {
      term,
      verified: false,
      message: `Error verifying pronunciation: ${err.message}`
    };
  }
}

/**
 * 4. Interactive Teleprompter Generation
 * Transforms a script into an interactive, single-page HTML teleprompter view with adjustable speed and font size.
 */
export async function generateTeleprompterView(
  scriptMarkdown: string,
  outputFilename: string,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are a UX designer building an in-browser teleprompter tool for audiobook narrators. Convert this script into a single-page interactive HTML teleprompter view.

=== SCRIPT ===
${scriptMarkdown}

=== DESIGN AND BEHAVIOR REQUIREMENTS ===
1. **Interactive Controls**: Build a complete, functional teleprompter inside a single HTML file. Include:
   - Play/Pause auto-scroll button.
   - Speed control slider (slower/faster auto-scroll).
   - Font size adjuster (+ / -).
   - Invert colors toggle (Dark mode / Light mode for eye comfort).
2. **Styling**: Use Tailwind CSS (via CDN link). Make the text very large, legible, and centered. Use a high-contrast theme.
3. **Structure**: 
   - A sticky header or floating control bar for the buttons and sliders.
   - The main content area containing the script text, properly formatted with paragraphs.
4. **Self-Contained**: The HTML MUST be complete, valid, and contain all CSS, JavaScript, and styles inline. Do not use external Javascript files (Tailwind CDN is fine: <script src="https://cdn.tailwindcss.com"></script>).

Output ONLY the complete HTML code. Do not wrap in markdown blocks, do not include backticks or conversational replies. Start with <!DOCTYPE html> and end with </html>.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt
  });

  let rawHtml = response.text || "";

  if (rawHtml.startsWith("\`\`\`html")) {
    rawHtml = rawHtml.substring(7);
  }
  if (rawHtml.endsWith("\`\`\`")) {
    rawHtml = rawHtml.substring(0, rawHtml.length - 3);
  }
  rawHtml = rawHtml.trim();

  const outputPath = resolveWorkspacePath(outputFilename);
  fs.writeFileSync(outputPath, rawHtml, "utf-8");

  return rawHtml;
}

/**
 * 5. Write Workspace File (Upload/Create)
 * Creates or overwrites a file in the workspace containing the final script or token report.
 */
export async function writeWorkspaceFile(filename: string, content: string): Promise<any> {
  const targetPath = resolveWorkspacePath(filename);
  
  // Create any non-existing parent directories safely within workspace
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, content, "utf-8");
  return {
    status: "success",
    filename,
    bytesWritten: content.length,
    message: `Successfully created/updated ${filename} in workspace.`
  };
}

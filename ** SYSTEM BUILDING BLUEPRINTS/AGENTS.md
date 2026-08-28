# Jarvis Multi-Agent Audiobook & Scripting Guidelines

This document details the advanced audiobook processing, token counting, pronunciation verification, and teleprompter generation tools added to the Jarvis OS platform. All agents (Jarvis, Agent A, Agent B, and Agent C) have access to these tools within the workspace.

---

## 🎙️ Integrated Audiobook & Scripting Tools

### 1. `parse_pdf_manuscript`
- **Description**: Parses a PDF manuscript in the workspace to clean, structured Markdown chapters offline using multimodal Gemini.
- **Parameters**: 
  - `filename`: (String) The path or name of the PDF manuscript file (e.g. `chapter_1.pdf`).
- **Output**: Writes a parsed Markdown file with `_parsed_script.md` appended to the name and returns the text.

### 2. `count_script_tokens`
- **Description**: Analyzes a script text to count words, estimate Gemini tokens, and calculate projected audiobook duration based on a 155 WPM pace.
- **Parameters**:
  - `filename`: (String) The path or name of the Markdown script file.
- **Output**: Saves a `_metrics.json` file in the workspace containing token counts, word count, and estimated audio duration, and returns the stats.

### 3. `verify_pronunciation`
- **Description**: Queries the local Phonetic Dictionary (in the workspace) and the official live Wikidata API to verify the pronunciation, origin, or description of tricky character names or complex terms.
- **Parameters**:
  - `term`: (String) The name or word to verify.
- **Output**: Returns structured JSON containing match status, local dictionary entries, or Wikidata context.

### 4. `generate_teleprompter_view`
- **Description**: Transforms a structured script into a beautiful, fully interactive, single-page teleprompter HTML file using Tailwind CSS.
- **Parameters**:
  - `scriptMarkdown`: (String) The Markdown content of the script.
  - `outputFilename`: (String) The filename of the HTML output teleprompter (e.g., `teleprompter_view.html`).
- **Output**: Returns and writes a fully self-contained HTML teleprompter with playback, speed controls, and adjustable sizing.

### 5. `write_workspace_file`
- **Description**: Creates or writes content to a file in the workspace (useful for saving final scripts or token reports).
- **Parameters**:
  - `filename`: (String) The relative filename or path to save the file in the workspace.
  - `content`: (String) The content/text or JSON string to write.
- **Output**: Returns status and details of the written file.

### 6. `read_workspace_file`
- **Description**: Reads the text contents of a specific file from the workspace.
- **Parameters**:
  - `filename`: (String) The relative path or name of the file to read.
- **Output**: Returns the raw text content of the file.

### 7. `list_workspace_files`
- **Description**: Lists files and subfolders hierarchically within a directory.
- **Parameters**:
  - `relativeDir`: (String) Optional subdirectory path to list. Defaults to root workspace.
- **Output**: Returns an array of file/folder names.

### 8. `delete_workspace_path`
- **Description**: Deletes a file or directory inside the workspace (safeguarded by Core Shield Integrity).
- **Parameters**:
  - `relativePath`: (String) The path to delete.
- **Output**: Returns status of the deletion.

### 9. `create_workspace_directory`
- **Description**: Creates a new folder or directory in the workspace.
- **Parameters**:
  - `relativePath`: (String) The path of the folder to create.
- **Output**: Returns status of the creation.

### 10. `search_workspace_files`
- **Description**: Performs high-performance searching of workspace files.
- **Parameters**:
  - `query`: (String) The search term.
  - `searchBy`: (String) Search criterion: `"name"` to search filenames, `"content"` to perform text content search.
- **Output**: Returns matching file paths and content snippets.

### 11. `get_file_metadata`
- **Description**: Retrieves metadata stats of a file or folder.
- **Parameters**:
  - `relativePath`: (String) The path to analyze.
- **Output**: Returns size, creation/modification times, extension, and file type details.

---

## 🔄 Recommended Multi-Agent Scripting Pipeline
To process, analyze, and format audiobooks with maximum parallel efficiency, follow this multi-agent pipeline:

1. **Step 1: Intake & PDF Parsing (Agent A - Script Parser)**:
   - Identifies all PDF manuscripts in the workspace.
   - Triggers `parse_pdf_manuscript` in parallel to extract text and format as Markdown.
   - Stores parsed Markdown documents back in the workspace.

2. **Step 2: Analysis & Pronunciation (Agent B - Director)**:
   - Evaluates the parsed script length by triggering `count_script_tokens`.
   - Extracts character names, locations, and rare terms.
   - Triggers `verify_pronunciation` for tricky terms to produce a phonetic guide.

3. **Step 3: Script Formatting & Teleprompter (Agent C - Final Assembler)**:
   - Annotates the script based on the Director's feedback.
   - Triggers `generate_teleprompter_view` to produce a gorgeous interactive teleprompter file ready for recording.
   - Outputs the final summary to Jarvis.

---

## 💡 System Prompts & Execution Tips
- **Multimodal Uploads**: When users upload PDFs, they are saved directly in the workspace. Agents should search for `.pdf` files and immediately parse them.
- **Phonetic Checking**: Always use `verify_pronunciation` if you notice unusual names or sci-fi/fantasy terminology in the manuscript.
- **Interactive Teleprompter**: The HTML tools produced by `generate_teleprompter_view` are static, fully interactive files that can be opened in any browser or displayed directly in the user interface.
- **Protocol Formatting**: When creating or fixing any protocol files (e.g. `protocol1.ts`), you **MUST** consult and follow the guidelines in `PROTOCOL_FIXER.md`. It contains the universal export structure and pipeline requirements.

# iHack Neural Architect: Actionable Functions

This document tracks all parameters supported by the `controlAppUi` tool used by **Jojo** (Assistant) to manage the application state.

## controlAppUi (Logic Parameters)
Use these keys within the `controlAppUi` tool calling function.

| Parameter | Type | Description / Options |
| :--- | :--- | :--- |
| `targetView` | `string` | `HOME`, `QUICK_LAB`, `STUDIO_SYNTHESIS`, `SONIC_FORGE`, `VISUALIZER` |
| `ttsModel` | `string` | `LITE`, `FLASH`, `PRO` (Displayed as F3, F2, P2) |
| `podcastMode` | `string` | `SINGLE` (Solo), `MULTI` (Duo) |
| `scriptingModel`| `string` | `PRO`, `LITE` |
| `selectedVoice` | `string` | Mono voice preset name (e.g., 'Zephyr', 'Leda') |
| `duoEchoVoice` | `string` | Multi-speaker Voice 1 name |
| `duoNoiseVoice` | `string` | Multi-speaker Voice 2 name |
| `scriptText` | `string` | Directly update/rewrite the script editor content |
| `triggerAutoPilot`| `boolean`| Start script generation (Text only) |
| `triggerIgnitePipeline`| `boolean`| Start Audio synthesis/rendering |
| `isSidebarCollapsed`| `boolean`| **Focus Mode**: Toggle Director Panel visibility |
| `toggleLedger` | `boolean`| Show/Hide bottom logs/ledger panel |
| `toggleWorkspace` | `boolean`| Open/Close Collaborative Discussion panel |
| `purgeBackup` | `boolean`| Delete the recovered session data |

## Discussion Management
| Function | Description |
| :--- | :--- |
| `updateDiscussionContext` | Writes notes into the Collaborative Context Board |
| `transferDiscussionContextToApp` | Moves Context Board data into the main Director's Prompt |
| `setPodcastInstructions` | Adds persistent logic to the system instructions |

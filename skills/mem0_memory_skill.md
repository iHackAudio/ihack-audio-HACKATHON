# Mem0 Memory & Context Persistence Skill (`mem0_memory_skill.md`)

This skill defines memory retention, context locking, user preference tracking, and state persistence for the AI Audiobook System.

## Core Memory Principles

1. **Context Locking (Story Bible as Long-term Memory)**:
   - Persist character profiles, tone settings, narrator count, and world rules in `story_bible.json`.
   - Ensure every sub-agent (Writer A, Writer B, Writer C, Script Slots A/B/C) injects the locked Story Bible into its system context.

2. **Incremental Session Memory**:
   - Store user preferences (e.g. auto-speech preference, favorite voice models, character limits per scene) across turns.
   - Maintain a historical turn memory log for bi-directional syncing.

3. **Line Comment Stack Memory**:
   - Store line-based feedback (`#L12: change narrator pitch`) in a persistent comment stack so revisions build upon prior feedback without losing context.

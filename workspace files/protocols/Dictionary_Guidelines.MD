# TTS Pronunciation Dictionary: Guidelines & Logic

## 1. Purpose

This document outlines the principles for creating and maintaining a TTS (Text-to-Speech) pronunciation dictionary. The goal is to produce audio that is clear, accurate, and natural-sounding for specialized content (e.g., medical narration) using a target accent (Australian English).

This dictionary serves as the "single source of truth" for any agent preparing scripts for TTS generation.

---

## 2. Core Philosophy: Articulatory Flow over Syllable Chopping

Our method is based on **articulatory phonetics**—how sounds are physically formed in the mouth. This creates a natural, continuous flow for the TTS engine, avoiding the robotic stutter that comes from breaking words into arbitrary syllables.

-   **Old Method (Incorrect) ❌:** `[HISS] [TER] [EK] [TOH] [MEE]`
    -   *Result:* Creates five separate sound events with unnatural micro-pauses. The TTS engine has to start and stop its synthesis for each bracketed part.

-   **New Method (Correct) ✅:** `[hisstuh rektuhmee]`
    -   *Result:* Creates a single, fluid audio event. The internal space guides the TTS engine to a natural articulatory break point without stopping the flow.

---

## 3. The Three-Layer Logic for Creating Entries

Apply these three filters in order when adding or modifying a dictionary entry.

### Layer 1: Necessity Check (WHEN to Convert)

Not every word needs a phonetic override. A high-quality TTS engine handles common words perfectly.

-   **✅ Convert These:**
    -   **Complex Medical/Technical Terms:** Words that are long, uncommon, or have non-intuitive pronunciations (e.g., `adenomyosis`, `salpingo-oophorectomy`).
    -   **Words Prone to Mispronunciation:** Words where the stress or vowel sound is critical and often missed (e.g., `oestrogen` -> `[eesstruhjuhn]`).
    -   **Acronyms Spoken as Letters:** (e.g., `MRI` -> `[em ar eye]`, `HMB` -> `[aych em bee]`).

-   **❌ Do NOT Convert These:**
    -   **Common Medical Terms:** `fibroids`, `prolapse`, `sarcoma`, `catheterisation`. The TTS engine knows these.
    -   **Common English Words:** `doctor`, `pain`, `bleeding`, `procedure`.
    -   **Acronyms Spoken as Words:** `TENS` (as in "TENS machine"), `ANZJOG`.

### Layer 2: Phonetic Accuracy (HOW to Spell)

All phonetic spellings must be consistent and accurate for the target **Australian English** accent.

-   **Simplicity is Key:** Use a simple, readable phonetic alphabet. No special characters.
-   **Target Accent (AusEng):**
    -   Be non-rhotic. The `-er` sound at the end of a word becomes `-uh` (e.g., `ureter` -> `[yooreetuh]`).
    -   Use `ah` for the 'a' in 'father' and `a` for the 'a' in 'cat'.
    -   Use `ee` for the 'ee' in 'see' and `i` for the 'i' in 'sit'.
-   **Sound, Not Spelling:** Base the phonetic spelling on the spoken sound, not the written letters (e.g., `haemoglobin` -> `[heemuh glohbin]`).

### Layer 3: Articulatory Phrasing (HOW to Group)

This is the most critical rule for ensuring natural flow.

-   **The Single Bracket Rule:** An entire term or a closely-linked phrase must be contained within **one** set of square brackets `[...]`.
    -   *Example:* `[yootuhryn artuhree embohlizayshun]`

-   **Internal Spaces for Natural Pauses:**
    -   Use a space *inside* the brackets to signal a natural break point within a long word.
    -   **Rule for Internal Breaks:** Add a space only where the mouth must fully reset its position. This almost always occurs between two "plosive" consonants (sounds that stop airflow: `p, b, t, d, k, g`).
        -   **Correct:** `[aduhnoh myohsis]` (Break after the `n` closure).
        -   **Correct:** `[myoh mektuhmee]` (Break at the hard `k` sound).
        -   **Incorrect:** `[en doh mee tree ohsis]` (Unnecessary breaks on smooth, continuous sounds).
    -   For multi-word phrases, the existing space between words is sufficient.

### Dictionary Format Example

| Medical Term | Refined TTS Pronunciation | Notes |
| :--- | :--- | :--- |
| endometriosis | `[endoh meetreeohsis]` | Natural break after the plosive `d`. |
| uterine artery embolisation | `[yootuhryn artuhree embohlizayshun]` | Combined into a single breath-group. |
| hysterectomy | `[hisstuh rektuhmee]` | Break at the velar plosive `k`. |
| fibroids | fibroids | Common word; no conversion needed. |

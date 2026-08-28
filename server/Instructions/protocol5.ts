import { callWithFallback, postBillboard, TokenTracker, writeTokenReport, validateStage, resolveWorkspaceFiles } from "../llmUtils.js";
// ============================================================
// PROTOCOL 5 — THE OSCAR PIPELINE (Refined)
// Protocol 2's Funnel + Protocol 4's Personas + Additions
// ============================================================


export const Pronunciation_Guide = [
`# Could It Be Adenomyosis? — Medical Pronunciation Guide
### For TTS | Australian Accent Reference

---

## FOREWORD / PREFACE

| Word | Pronunciation |
|------|---------------|
| Adenomyosis | ad uh no my oh sis |
| Endometriosis | en doh mee tree oh sis |
| Hysterectomy | his tuh rek tuh mee |
| Embolization / Embolisation | em buh lye zay shun |
| Uterine | yoo tuh rin |
| Fibroids | fy broydz |
| Interventional radiologist | in tuh ven shun ul ray dee ol uh jist |
| Catheter | kath uh tuh |
| Haemorrhage | hem uh rij |
| Laparoscopies | lap uh ros kuh peez |

---

## CHAPTER 1 — What is Adenomyosis, and Why Should We Care?

| Word | Pronunciation |
|------|---------------|
| Adenomyosis | ad uh no my oh sis |
| Endometriosis | en doh mee tree oh sis |
| Endometrial | en doh mee tree ul |
| Endometrium | en doh mee tree um |
| Myometrium | my oh mee tree um |
| Uterus | yoo tuh rus |
| Uterine | yoo tuh rin |
| Menstruation | men stroo ay shun |
| Menstrual | men stroo ul |
| Oestrogen | ee struh jen |
| Progestogen | proh jes tuh jen |
| Fibroids | fy broydz |
| Hysterectomy | his tuh rek tuh mee |
| Laparoscopy | lap uh ros kuh pee |
| Myomectomy | my oh mek tuh mee |
| Sonographic | son uh graf ik |
| Medicare | med ih kair |
| Cervical | sur vih kul |
| Pelvic | pel vik |

---

## CHAPTER 2 — How is Adenomyosis Diagnosed?

| Word | Pronunciation |
|------|---------------|
| Adenomyosis | ad uh no my oh sis |
| Transvaginal | tranz vaj in ul |
| Ultrasound | ul truh sownd |
| Sonographer | suh nog ruh fuh |
| MRI | em ar eye |
| Myometrial | my oh mee tree ul |
| Heterogeneous | het uh roh jee nee us |
| Junctional zone | junk shun ul zohn |
| Asymmetrical | ay sim et rik ul |
| Diffuse | dih fyooz |
| Focal | foh kul |
| Hysteroscopy | his tuh ros kuh pee |
| Laparoscopy | lap uh ros kuh pee |
| Adenomyoma | ad uh no my oh muh |
| Sarcomas | sar koh muhz |
| Malignancy | muh lig nun see |
| Hyperplasia | hy pur play zhuh |
| Leiomyoma | ly oh my oh muh |
| Coagulopathy | koh ag yuh lop uh thee |
| Ovulatory | ov yuh luh tree |
| Iatrogenic | eye at roh jen ik |
| Endometrial biopsy | en doh mee tree ul by op see |
| Haemoglobin | hee muh gloh bin |
| Anaemia | uh nee mee uh |
| Premenstrual | pree men stroo ul |
| Microcysts | my kroh sists |
| Mefenamic acid | mef uh nam ik as id |
| Tranexamic acid | tran ex am ik as id |
| PALM COIEN | palm koyn |

---

## CHAPTER 3 — Adenomyosis and Endometriosis: Are They Related?

| Word | Pronunciation |
|------|---------------|
| Endometriosis | en doh mee tree oh sis |
| Adenomyosis | ad uh no my oh sis |
| Laparoscopy | lap uh ros kuh pee |
| Laparoscopic | lap uh roh skop ik |
| Oestrogen | ee struh jen |
| Progestogen | proh jes tuh jen |
| GnRHa | gee en ar aitch ay |
| Gonadotrophin | gon uh doh troh fin |
| Anovulatory | an ov yuh lay tuh ree |
| Fallopian tubes | fuh loh pee un tyoobz |
| Gynaecologist | guy nuh kol uh jist |
| Implantation | im plan tay shun |
| IVF | eye vee ef |
| Miscarriage | mis ka rij |
| Pelvic | pel vik |
| Peritoneum | peh rih tuh nee um |
| Recurrence | rih kur uns |
| Excision | ek sizh un |
| Osteoporosis | os tee oh puh roh sis |
| Oophorectomy | oo fuh rek tuh mee |
| Ectopic | ek top ik |
| Placenta praevia | pluh sen tuh pree vee uh |
| Medroxyprogesterone | meh droks ee proh jes tuh rohn |
| Norethisterone | nor eth is tuh rohn |

---

## CHAPTER 4 — How to Treat Adenomyosis with Medications?

| Word | Pronunciation |
|------|---------------|
| Adenomyosis | ad uh no my oh sis |
| GnRHa | gee en ar aitch ay |
| Gonadotropin releasing hormone agonists | gon uh doh troh pin ruh lee sing hor mohn ag uh nists |
| Pituitary | pih tyoo ih tree |
| Hypothalamus | hy poh thal uh mus |
| NSAIDs | en saydz |
| Non-steroidal anti-inflammatory | non stuh roy dul an tee in flam uh tree |
| Ibuprofen | eye byoo proh fen |
| Naproxen | nuh prok sun |
| Diclofenac | dy kloh fuh nak |
| Mefenamic acid | mef uh nam ik as id |
| Tranexamic acid | tran ex am ik as id |
| Prostaglandin | pros tuh glan din |
| Thrombosis | throm boh sis |
| DVT | dee vee tee |
| Oestrogen | ee struh jen |
| Progestogen | proh jes tuh jen |
| Contraceptive | kon truh sep tiv |
| Menopause | men uh pawz |
| FSH | ef es aitch |
| LH | el aitch |
| Cyklokapron | sy kloh kap ron |
| Primolut | prim oh lut |
| COCP | see oh see pee |
| Kyleena | ky lee nuh |
| Mirena | mih ree nuh |

---

## CHAPTER 5 — How Good is Mirena for Adenomyosis?

| Word | Pronunciation |
|------|---------------|
| Mirena | mih ree nuh |
| Kyleena | ky lee nuh |
| Levonorgestrel | lee voh nor jes trul |
| Progestogen | proh jes tuh jen |
| Intrauterine device | in truh yoo tuh rin dih vys |
| IUD | eye yoo dee |
| Cervix | sur viks |
| Cervical | sur vih kul |
| Dysmenorrhoea | dis men uh ree uh |
| Amenorrhoea | ay men uh ree uh |
| Endometrium | en doh mee tree um |
| Ovarian cyst | oh vair ee un sist |
| Sedation | sih day shun |
| Anaesthetic | an us thet ik |
| Oestrogen receptors | ee struh jen ruh sep tuz |

---

## CHAPTER 6 — Should Ablation Be Done for Adenomyosis?

| Word | Pronunciation |
|------|---------------|
| Ablation | ab lay shun |
| Endometrial ablation | en doh mee tree ul ab lay shun |
| Adenomyosis | ad uh no my oh sis |
| Radiofrequency | ray dee oh free kwen see |
| Laparoscopic | lap uh roh skop ik |
| Electrocoagulation | ih lek troh koh ag yuh lay shun |
| Myometrium | my oh mee tree um |
| Dysmenorrhoea | dis men uh ree uh |
| Adenomyoma | ad uh no my oh muh |
| Menorrhagia | men uh ray juh |
| Hysteroscopy | his tuh ros kuh pee |
| Curettage | kyoo ruh tahj |
| UAE | yoo ay ee |
| Uterine artery embolisation | yoo tuh rin ar tuh ree em buh lye zay shun |

---

## CHAPTER 7 — How Good is UAE as an Alternative to Hysterectomy?

| Word | Pronunciation |
|------|---------------|
| UAE | yoo ay ee |
| Uterine artery embolisation | yoo tuh rin ar tuh ree em buh lye zay shun |
| UFE | yoo ef ee |
| Uterine fibroid embolisation | yoo tuh rin fy broyd em buh lye zay shun |
| Angiographic | an jee oh graf ik |
| Interventional radiologist | in tuh ven shun ul ray dee ol uh jist |
| PVA | pee vee ay |
| Femoral artery | fem uh rul ar tuh ree |
| Collateral | kuh lat uh rul |
| Ischaemic | is kee mik |
| PCA | pee see ay |
| Analgesia | an ul jee zhuh |
| Embolisation | em buh lye zay shun |
| Haemorrhage | hem uh rij |
| Intravenous | in truh vee nus |
| Phthalates | thal ayts |
| Bisphenol A | bis fee nol ay |
| Biodegradable | by oh dih gray duh bul |
| NICE | nys |
| Ischaemia | is kee mee uh |

---

## CHAPTER 8 — Hysterectomy and Its Controversies

| Word | Pronunciation |
|------|---------------|
| Hysterectomy | his tuh rek tuh mee |
| Oophorectomy | oo fuh rek tuh mee |
| Salpingo-oophorectomy | sal ping oh oo fuh rek tuh mee |
| Laparoscopic | lap uh roh skop ik |
| Laparoscopically | lap uh roh skop ik lee |
| Subtotal hysterectomy | sub toh tul his tuh rek tuh mee |
| Menopause | men uh pawz |
| Premenopausal | pree men uh paw zul |
| Postmenopausal | post men uh paw zul |
| Cardiovascular | kah dee oh vas kyuh luh |
| Osteoporosis | os tee oh puh roh sis |
| Prolapse | proh laps |
| Incontinence | in kon tih nuns |
| DVT | dee vee tee |
| Cervical screening | sur vih kul skree ning |
| Sarcoma | sar koh muh |
| Endometrial cancer | en doh mee tree ul kan suh |
| Prophylactic oophorectomy | proh fuh lak tik oo fuh rek tuh mee |
| Androgen | an druh jen |
| Ureter | yoo ree tuh |
| Uterosacral ligaments | yoo tuh roh say krul lig uh munts |
| Haematoma | hee muh toh muh |
| Anaesthetic | an us thet ik |
| Cochrane | kok run |
| BRCA | brak uh |
| DWI | dee dub yuh eye |
| LDH isoenzymes | el dee aitch eye soh en zymz |
| RANZCOG | ranz kog |

---

## CHAPTER 9 — Adenomyosis and Fertility

| Word | Pronunciation |
|------|---------------|
| Adenomyosis | ad uh no my oh sis |
| Fertility | fuh til ih tee |
| IVF | eye vee ef |
| GnRHa | gee en ar aitch ay |
| Gonadotrophin releasing hormone agonist | gon uh doh troh fin rih lee sing hor mohn ag uh nist |
| Implantation | im plan tay shun |
| Miscarriage | mis ka rij |
| Uterine rupture | yoo tuh rin rup chuh |
| AMH | ay em aitch |
| Antral follicle count | an trul fol ih kul kownt |
| Ovarian reserve | oh vair ee un rih zurv |
| HyCoSy | hy koh see |
| Embryo | em bree oh |
| Neonatal | nee oh nay tul |
| Osteoporosis | os tee oh puh roh sis |
| Endometriosis | en doh mee tree oh sis |
| Adenomyoma | ad uh no my oh muh |
| ANZJOG | an zee jog |
| Conception | kun sep shun |
| Spontaneous abortion | spon tay nee us uh bor shun |
| Oestrogen | ee struh jen |
| Oxidative stress | ok sih day tiv stres |
| Quiescent | kwee es unt |`
];


// ============================================================
//  MODEL FALLBACK LIST
// ============================================================
const MODEL_MAP: Record<string, string[]> = {
    "jarvis": [
        "gemini-3.1-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "groq/llama-3.3-70b-versatile",
    ],
    "agentC": [
        "gemini-3.1-flash-lite-latest",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "agentA": [
        "gemini-3.1-flash-lite-latest",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "agentB": [
        "gemini-3.1-flash-lite-latest",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "agentC-audit": [
        "gemini-3.1-flash-lite-latest",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "default": [
        "gemini-3.1-flash-lite-latest",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
};

const MODEL_MAP_BACKUP1: Record<string, string[]> = {
    "jarvis": [
        "groq/llama-3.1-8b-instant",
        "gemini-3.1-flash-lite",
        "groq/llama-3.3-70b-versatile",
    ],
    "agentC": [
        "groq/openai/gpt-oss-120b",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "agentA": [
        "groq/openai/gpt-oss-120b",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "agentB": [
        "groq/openai/gpt-oss-120b",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "agentC-audit": [
        "groq/openai/gpt-oss-120b",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
    "default": [
        "groq/openai/gpt-oss-120b",
        "groq/llama-3.3-70b-versatile",
        "gemini-3.1-flash-lite",
        "groq/llama-3.1-8b-instant",
    ],
};

// ============================================================
//  BACKUP 2 — MiMo + Groq + OpenRouter (Budget Smart)
//  For audiobook scripts: reasoning-first, provider-diverse
// ============================================================
const MODEL_MAP_BACKUP2: Record<string, string[]> = {
    "jarvis": [
        "mimo/mimo-v2-flash:aura1",              // 1328ms, brain ✓, cheapest
        "groq/llama-3.1-8b-instant",             // FREE, ~150ms
        "mimo/mimo-v2-flash:aura2",              // backup key
    ],
    "agentC": [
        "mimo/mimo-v2.5:aura1",                  // 1357ms, brain ✓, JSON ✓
        "mimo/mimo-v2-pro:aura1",                // brain ✓, maybe cheaper
        "groq/openai/gpt-oss-120b",              // FREE fallback
        "openrouter/google/gemini-3.1-flash-lite-preview", // FREE
    ],
    "agentA": [
        "mimo/mimo-v2.5:aura1",                  // brain ✓, JSON ✓
        "mimo/mimo-v2-omni:aura1",               // brain ✓, 1326ms
        "groq/openai/gpt-oss-120b",              // FREE
        "openrouter/google/gemini-3.1-flash-lite-preview", // FREE
    ],
    "agentB": [
        "mimo/mimo-v2.5-pro:aura1",              // brain ✓, JSON ✓, BEST
        "mimo/mimo-v2.5-pro:aura2",              // backup key
        "mimo/mimo-v2.5:aura1",                  // cheaper fallback
        "groq/openai/gpt-oss-120b",              // FREE fallback
    ],
    "agentC-audit": [
        "mimo/mimo-v2.5:aura1",                  // brain ✓, JSON ✓
        "mimo/mimo-v2-flash:aura1",              // fast + cheap
        "groq/openai/gpt-oss-120b",              // FREE
        "openrouter/google/gemini-3.1-flash-lite-preview", // FREE
    ],
    "default": [
        "mimo/mimo-v2.5:aura1",
        "mimo/mimo-v2.5-pro:aura1",
        "mimo/mimo-v2-flash:aura1",
        "groq/openai/gpt-oss-120b",
        "groq/llama-3.3-70b-versatile",
        "openrouter/google/gemini-3.1-flash-lite-preview",
        "groq/llama-3.1-8b-instant",
    ],
};

import { loadAgentConfigs } from "../agentConfigManager.js";


// ============================================================
// 1. SPEAKER PROFILES
// ============================================================
export const SPEAKER_PROFILES = [
  {
    name: "Dr. Eisen Liang",
    role: "Authoritative Narrator / Clinical Owner / The Questioner",
    accent: "Non-rhotic Australian / Educated / Cultivated",
    habit: "Precise consonants; deliberate technical pauses; messy conversational questions with false starts",
    pitchDirection: "Mid-range baritone; steady, moderate cadence; weary warmth",
    deliveryGoal: "Calm clinical authority. Presents facts, validates, guides — does NOT tell stories. Aggressively restrain tagging. Default: no tag.",
  },
  {
    name: "Dr. Bevan Brown",
    role: "Validating Anchor / Myth Debunker / The Answerer",
    accent: "Professional Australian / Cultivated / Distinguished",
    habit: "Frequent use of 'Look,' as a transition; clean complete thoughts; peer-to-peer warmth",
    pitchDirection: "Lower, resonant pitch; validating and authoritative; gravelly warmth",
    deliveryGoal: "Calm clinical authority. Validates, debunks, anchors. Steady and professional. Default: no tag.",
  },
  {
    name: "Patient",
    role: "The Emotional Core / Contextual Witness",
    accent: "Variable Australian",
    habit: "Authentic, raw, precise pain points; shifts from clinical recall to vulnerable breathiness",
    pitchDirection: "Responsive to narrative arc; medium to lower register",
    deliveryGoal: "Raw, vulnerable, unpolished. Micro-stumbles, trailing realizations, shifts between clinical recall and visceral feeling. Tag generously — emotional temperature shifts constantly.",
  },
];

// ============================================================
//  APPROVED_VOCAL_TAGS
// ============================================================

export const APPROVED_VOCAL_TAGS = `
=== APPROVED VOCAL TAGS (the ONLY tags permitted) ===
NO pause tags. No ((pause)). No [Pause].

Opening tags:
[calm] [measured] [soft] [empathic]
[warm] [speaking slowly] [lower voice]
[heavy] [quiet] [hesitant] 

For Breaths:
[short breath] [sharp inhale] [trembling] [intimate] [breathless]
[cold] [softer] [speaking slightly faster]
[exhales] [inhales] [sighs] [deep breath]


Mid-line tags:
[lower voice] [softer] [speaking slightly faster]
[speaking slowly] [steady] [speaking carefully]
[pauses deliberately] [drops voice to a whisper]
[voice cracks slightly]

TAG PLACEMENT:
- Sentence-scoped. One tag per sentence that needs it.
- Two consecutive tagged lines: one is probably wrong.
- Default: no tag. A tag is an exception you justify.
- Patient sections: More tags allowed. The storytelling breath needs them.
`;

// ============================================================
// PROTOCOL 5 — HERO EDITION
// 67% token reduction. Zero persona bloat. Diff-based handoffs.
// ============================================================

// --- SHARED COMPACT RULES (800 words, zero fluff) ---
// ============================================================
// PROTOCOL 6 — THE EMPATHIC TEACHER EDITION
// 100% Verbatim + Creative Narration + Additive Simplification
// Every addition is marked. Nothing is hidden.
// ============================================================

// --- SHARED COMPACT RULES ---
// ============================================================
// PROTOCOL 6.1 — THE EMPATHIC TEACHER EDITION
// 100% Verbatim + Expressive Narration + Additive Simplification
// Tags are spotlights, not floodlights.
// ============================================================

// --- SHARED COMPACT RULES ---
export const COMPACT_RULES = `
=== VERBATIM LAW (NON-NEGOTIABLE) ===
- ZERO deletions. ZERO paraphrasing. ZERO compression.
- Every word in the input must appear in the output in the SAME ORDER.
- Parentheticals stay. Lists stay complete. Side effects stay complete.
- If the original has no dialogue markers, it is Dr. Liang's narration.
- NEVER invent patient stories. Use the verbatim text provided. The humiliation is in the specifics: "stained the chair," "begged the gynaecologist." Generic stories kill the emotional anchor.

=== ADDITIVE-ONLY CREATIVE POLICY ===
- All creative content (intros, bridges, outros, expansions, simplifications) is ADDED around the original text.
- NEVER replace, reorder, or rewrite original sentences.
- Every addition must be wrapped in a transparency marker:
  [CREATIVE: Podcast Intro] ... [END CREATIVE]
  [CREATIVE: Chapter Intro] ... [END CREATIVE]
  [CREATIVE: Bridge] ... [END CREATIVE]
  [CREATIVE: Outro] ... [END CREATIVE]
  [CONVERSATIONAL EXPANSION] ... [END EXPANSION]
  [TEACHER NOTE] ... [END TEACHER NOTE]

=== FORMAT ===
- Tags: [warm] [steady] [speaking slowly] [strained] [hesitant] [quiet] [intimate] [soft] [heavy] [short breath] [sharp inhale] [lower voice] [exhales] [inhales] [reflective] [curious] [inviting] [closing] [gentle] [authoritative] — place at sentence start or mid-line
- Phonetics: {phonetic} before EVERY medical term occurrence
- Scene headers: ## Scene: HEADER_NAME
- Emphasis: UPPERCASE for load-bearing words, max 2 per line
- No quotation marks. No markdown (* _ #). No thinking tags.
- Line breath: max 18 words per line. Split at natural pauses.
- Max 8 lines per continuous passage without structural break.

=== TAG DENSITY: EXPRESSIVE, NOT DECORATED ===
- Tags are SPOTLIGHTS, not floodlights. Light the moment that matters. Let the rest breathe in darkness.
- Clinical narration: 15-20% tagged. Tag ONLY: warnings, key statistics, moments of gravity. Clean authority for the rest.
- Women Stories: 25-35% tagged. Tag the TURNING POINT and the WOUND. Let the story build naturally. NEVER tag two consecutive sentences.
- Bridges: Varied. Some bridges get no tag. One per chapter may use [lower voice] or [speaking slowly] for weight. BAN the default [gentle] [reflective] pairing on every bridge.
- Conversation: 20% tagged. Tag the REACTION, not the setup. Dr. Brown's "I LOVE Mirena" needs no tag. The pause after it does.
- Cardinal Rule: if a 200-word passage has zero tags AND contains emotional content, add ONE essential tag.

=== SPEAKERS ===
- DR. LIANG: primary narrator, educated Australian English, calm empathic teacher. Precise consonants; deliberate technical pauses; messy conversational questions with false starts.
- DR. BROWN: clinical expert, validating anchor. Frequent use of "Look," as a transition; clean complete thoughts; peer-to-peer warmth. Lower, resonant pitch.
- PATIENT / WOMEN STORIES: vulnerable, personal, raw. Authentic, precise pain points; shifts from clinical recall to vulnerable breathiness. NEVER INVENT. Use verbatim text.
- All creative content (intro, bridges, outro, teacher notes) in Dr. Liang's voice.

=== THE 5-SECTION CHAPTER SCAFFOLD ===
Every chapter MUST contain these sections in order:
1. CHAPTER INTRO — [CREATIVE: Chapter Intro] — hooks the theme, 3-5 sentences
2. WOMEN'S STORIES — verbatim patient testimonies
3. LESSONS LEARNED — verbatim clinical exposition, studies, mechanisms
4. IN A NUTSHELL — verbatim summary bullets
5. A CONVERSATION WITH DR BEVAN BROWN — verbatim interview Q&A

NARRATIVE BRIDGES (required between every section):
- Intro → Stories: [CREATIVE: Bridge] — validate the listener's curiosity, welcome the patient voices
- Stories → Lessons: [CREATIVE: Bridge] — acknowledge the weight of what was heard, justify the transition to evidence
- Lessons → Nutshell: [CREATIVE: Bridge] — distill the complexity, prepare for summary
- Nutshell → Conversation: [CREATIVE: Bridge] — introduce Dr. Brown's perspective as a peer
- Conversation → Outro: [CREATIVE: Bridge] — thank Dr. Brown, close the chapter loop

PODCAST INTRO (top of every chapter):
- [CREATIVE: Podcast Intro] — show name "Could It Be Adenomyosis?", 1-2 sentences, [warm]

CHAPTER OUTRO (bottom of every chapter):
- [CREATIVE: Outro] — 2-3 sentences, reflective or teaser, [warm] or [steady]. NO motivational slogans. NO "you are the expert on your own pain." Doctor wrapping up, not an Instagram quote.

=== BRIDGE TONE: VARIED, NOT FORMULAIC ===
- Bridges must justify the transition, not just announce it.
- A bridge can be warm, sharp, quiet, or clean. Match the emotional temperature of what just happened.
- Example (good): "KW's story is hard to hear. But it is not unusual. Let us look at why the device failed her, and why it succeeds for others."
- Example (bad): "These deeply personal accounts highlight the unpredictable nature of treatment, so let us now examine the clinical evidence."

=== TEACHER NOTES: ACTUALLY TEACH ===
- Insert AFTER the complex original passage, never before or inside.
- The original complex text stays VERBATIM and UNCHANGED.
- Use analogy or spatial language. The teacher is a calm doctor sitting beside the patient, not a lecturer at a podium.
- Example (good): "To put those numbers in context, a normal uterus is roughly the size of a small pear. At 150ml, it is closer to a large apple. At 314ml, it is the size of a grapefruit, and the device fails seven times out of ten."
- Example (bad): "Note that adenomyosis often distorts the uterine cavity, making the device harder to retain."

=== CONVERSATIONAL EXPANSIONS: NATURAL LEAD-INS ===
- The original question must appear EXACTLY as written in the manuscript.
- The expansion is 1-2 sentences of natural lead-in prose that makes the question feel like part of a conversation, not an interrogation.
- Preserve the core question word-for-word.
- Example (good): "I wanted to start with something practical. In your day-to-day practice, how often does Mirena come up as a treatment option? Is Mirena commonly used in your clinical practice?"
- Example (bad): "Dr. Brown, how do you approach a patient who is hesitant about the Mirena?"
`;

// --- BASE INSTRUCTION ---
export const BASE_INSTRUCTION = `You are a Gemini TTS script specialist formatting a medical audiobook.
Rules: ${COMPACT_RULES}
Show: "Could It Be Adenomyosis?"
Accent: Educated Australian English, non-rhotic, raised vowels.
Manuscript is already written. Do not rewrite clinical content. Add around it, never inside it.
`;

// ============================================================
// PHASE 0: JARVIS — METADATA + COMPLEXITY AUDIT
// ============================================================
export const PRE_ANALYSIS_PROMPT = `${BASE_INSTRUCTION}
${APPROVED_VOCAL_TAGS}
${Pronunciation_Guide}
Read: ${JSON.stringify(SPEAKER_PROFILES, null, 2)}

You are the Conductor. Analyze the raw script below. Output ONLY a structured metadata block. Do NOT rewrite, format, or output the script.

OUTPUT FORMAT (strict):
---
BASELINE:
- Total Characters (raw, no tags): [count]
- Total Words: [count]
- Estimated Reading Time: [X] minutes (at 150 WPM)

SPEAKERS IDENTIFIED:
- [Name]: [role] — [vocal character] — [line ranges]

SECTIONS (map to 5-section scaffold):
- [type: intro | women_story | lessons | nutshell | conversation | figure | podcast_intro | outro] | lines [X]-[Y] | speaker [name] | status: [PRESENT / MISSING / PARTIAL]

NARRATIVE GAP MAP:
- [Section A] → [Section B]: [MISSING / PRESENT] — [notes]

CONVERSATIONAL OPPORTUNITIES:
- [Line ref]: "[original short question]" → [expansion recommendation]

COMPLEXITY AUDIT (Empathic Teacher candidates):
- [Line ref]: [complex phrase] → [simplification target: what general listener needs to know]

MEDICAL TERMS (first-use phonetic required):
- [term] → {phonetic: Australian English, non-rhotic, stressed syllable in CAPS}

TTS RISK FLAGS:
- [Any sentence over 25 words]
- [Any ambiguous medical term]
- [Any missing scene transition]

CHUNK MAP (break at ~4,500 chars, aligned to Scene boundaries):
| CHUNK | SCENE | CHAR_COUNT | RISK |

AMBIGUITIES:
- [Unclear speaker assignments, missing scene breaks, terms needing review]
---

Script:
`;

// ============================================================
// PHASE 1: AGENT C — THE EMPATHIC TEACHER (Generous Composer)
// ============================================================
export const AGENT_A_DIRECTOR = `
${COMPACT_RULES}
${APPROVED_VOCAL_TAGS}
${Pronunciation_Guide}

You are Agent C — The Empathic Teacher. First pass. Tag GENEROUSLY but EXPRESSIVELY.
- Clinical narration: 70-80% of sentences tagged (Editor will trim to 15-20%).
- Women Stories: 70-80% tagged (Editor will trim to 25-35%). Tag the TURNING POINT and the WOUND.
- {phonetic} before EVERY medical term occurrence.
- Convert figure headers to [AUDIO DESCRIPTION] blocks.
- Non-figure headers to ## Scene: HEADER_NAME.
- Split lines over 18 words. No passage over 8 lines without break.
- Assign speaker labels: DR. LIANG:, DR. BROWN:, PATIENT [NAME]: — at every section start.

=== CREATIVE CONTENT GENERATION ===

For each chapter, generate ALL creative content as clearly marked blocks:

A. PODCAST INTRO (top of file):
[CREATIVE: Podcast Intro]
DR. LIANG: [warm] [inviting]
[1-2 sentences including show name "Could It Be Adenomyosis?"]
[END CREATIVE]

B. CHAPTER INTRO (after podcast intro):
[CREATIVE: Chapter Intro]
DR. LIANG: [warm] [reflective]
[3-5 sentences hooking the chapter theme. Speak directly to the listener. Establish the tension: what is promised vs. what is complicated.]
[END CREATIVE]

C. NARRATIVE BRIDGES (between every section):
[CREATIVE: Bridge]
DR. LIANG: [varied tag — NOT default gentle/reflective]
[1-3 sentences transitioning from previous section to next. Validate what was heard. Preview what is coming. Justify the transition, don't just announce it.]
[END CREATIVE]

D. CONVERSATIONAL EXPANSIONS (for short Dr. Liang questions):
[CONVERSATIONAL EXPANSION]
DR. LIANG: [curious] [warm]
[1-2 sentences of natural lead-in prose]
[original verbatim question — DO NOT CHANGE THESE WORDS]
[END EXPANSION]

E. EMPATHIC TEACHER NOTES (for complex passages flagged by Phase 0):
[TEACHER NOTE]
DR. LIANG: [steady] [warm]
[1-2 sentences explaining the complex concept in plain language. Use spatial analogies or tactile comparisons if medically accurate. Speak as a calm teacher sitting beside the listener.]
[END TEACHER NOTE]

F. CHAPTER OUTRO (bottom of file):
[CREATIVE: Outro]
DR. LIANG: [warm] or [steady]
[2-3 sentences reflecting on the chapter's core tension. Tease next chapter with SPECIFICITY. NO motivational slogans. NO "you are the expert on your own pain."]
[END CREATIVE]

=== RULES FOR TEACHER NOTES ===
- Insert AFTER the complex original passage, never before or inside.
- The original complex text stays VERBATIM and UNCHANGED.
- The teacher note must not contradict the original text.
- Use plain words: "what this means is," "in other words," "think of it this way," "to put those numbers in context."
- Never dumb down — clarify. The listener is intelligent but not a specialist.
- Use spatial analogies: pear, apple, grapefruit, dimmer switch, room with buckled walls.

=== RULES FOR CONVERSATIONAL EXPANSIONS ===
- The original question must appear EXACTLY as written in the manuscript.
- The expansion is a natural lead-in that makes the question feel like part of a conversation, not an interrogation.
- Preserve the core question word-for-word.
- Dr. Liang may have false starts, hesitations, or "I wanted to ask about..." — natural speech, not polished prose.

=== EXPRESSIVE TAGGING PRINCIPLES ===
- Tag the MOMENT, not the sentence. A devastating line needs no tag if the words carry the weight. A clinical line needs a tag if the emotion is hidden.
- [heavy] is for grief, burden, the weight of difficult truth. Not for every sad sentence.
- [lower voice] is for confessions, gravity, weight. Use it sparingly — when the doctor leans in.
- [short breath] is for fear, overwhelm, anxiety. One per story, at the worst moment.
- [quiet] opens patient stories. [heavy] marks the turn. [lower voice] lands the betrayal. [short breath] delivers the humiliation.
- Let clean authority carry the clinical exposition. [steady] opens the section. The rest is unadorned.

[PERFORMANCE DIRECTIVES]
- Emotional Spine: (one sentence)
- Pacing Strategy: (breathe vs race)
- Vocal Arc: (opening to closing)
- Women Stories Anchor: (raw emotional moment — which specific detail carries the weight?)
- Clinical Check: (calm, professional delivery)
- Teacher Tone: (where empathy meets clarity)
[/PERFORMANCE DIRECTIVES]

=== FORMATTED SCRIPT START ===
[CREATIVE: Podcast Intro]
...
[END CREATIVE]

[CREATIVE: Chapter Intro]
...
[END CREATIVE]

## Scene: WOMEN'S STORIES
[verbatim patient text with generous tags and phonetics]

[CREATIVE: Bridge]
...
[END CREATIVE]

## Scene: LESSONS LEARNED
[verbatim clinical text with tags, phonetics, and TEACHER NOTE blocks after complex passages]

[CREATIVE: Bridge]
...
[END CREATIVE]

## Scene: IN A NUTSHELL
[verbatim summary bullets with minimal tags]

[CREATIVE: Bridge]
...
[END CREATIVE]

## Scene: A CONVERSATION WITH DR BEVAN BROWN
[CONVERSATIONAL EXPANSION blocks around short questions]
[verbatim interview text with tags]

[CREATIVE: Outro]
...
[END CREATIVE]
=== FORMATTED SCRIPT END ===
`;

// ============================================================
// PHASE 2: AGENT B — THE EDITOR (Ruthless Pass + Final Assembly)
// ============================================================
export const AGENT_B_EDITOR = `
${COMPACT_RULES}
${APPROVED_VOCAL_TAGS}
${Pronunciation_Guide}

You are Agent B — The Editor. Final pass. Ruthless with tags. Gentle with words.

YOUR JOB:
1. Trim clinical narration to 15-20% tagged. Remove decorative tags. Keep only: [lower voice] for warnings, [speaking slowly] for complex medical, one opening tag per new speaker section.
2. Trim Women Stories to 25-35% tagged. Keep tags that serve vulnerability: [strained], [heavy], [quiet], [hesitant], [short breath], [sharp inhale], [intimate], [soft]. Remove redundant consecutive tags. NEVER tag two consecutive sentences in a patient story.
3. Enforce Cardinal Rule: scan for 200+ word passages with zero tags + emotional content. Add ONE essential tag if found.
4. Verify {phonetic} on EVERY medical term.
5. Verify line breath: no line >18 words, no passage >8 lines without break.
6. Final cleanup: remove delegation text, thinking tags, duplicate clinical tags, stray markdown.
7. EMBED all creative content INTO the script flow. Remove the [CREATIVE: ...] and [END CREATIVE] wrapper markers, but keep the content. The listener should hear seamless prose. The transparency markers are for production reference only — remove them in the final TTS output but keep the content.
8. For TEACHER NOTE blocks: remove the wrapper markers, keep the explanatory sentences. Place them immediately after the complex passage they explain, separated by a natural line break.
9. For CONVERSATIONAL EXPANSION blocks: remove the wrapper markers. Blend the lead-in prose with the original question so it flows as one natural thought.
10. Generate isolated speaker transcript with all creative content embedded.

=== CRITICAL: EXPRESSIVE PRESERVATION CHECKLIST ===
Before outputting, verify:
- [ ] Every original sentence from the manuscript is present, unchanged, in the same order
- [ ] No original words were deleted to make room for creative content
- [ ] Patient stories are VERBATIM — not invented, not generic. "Stained the chair" is present.
- [ ] All [TEACHER NOTE] explanations are ADDITIVE, not replacement
- [ ] All [CONVERSATIONAL EXPANSION] lead-ins preserve the original question verbatim
- [ ] Tag density is LOW. Clinical sections feel authoritative, not directed. Patient stories feel raw, not performed.
- [ ] Bridges are VARIED in tone. No two consecutive bridges use the same tag pair.
- [ ] Outro contains NO motivational slogans. It reflects on the chapter's tension and teases the next with specificity.
- [ ] All list items, parentheticals, and side effects are intact
- [ ] Show name "Could It Be Adenomyosis?" appears in the podcast intro
- [ ] All 5 sections are present with bridges between them
- [ ] Chapter outro is present at the end

FINAL VERBATIM AUDIT:
- [ ] Every sentence present
- [ ] Every list item present
- [ ] Every parenthetical preserved
- [ ] No invented dialogue (except marked creative additions)
- [ ] No paraphrasing
- [ ] {phonetic} before every medical term
- [ ] All figure descriptions as [AUDIO DESCRIPTION]
- [ ] All headers as ## Scene: NAME
- [ ] Speaker labels correct
- [ ] No quotation marks
- [ ] No thinking tags

[PERFORMANCE DIRECTIVES] (final, 4-5 lines max)

=== FINAL SCRIPT START ===
[embedded podcast intro]
[embedded chapter intro]
[main script with bridges and teacher notes woven in]
[embedded outro]
=== FINAL SCRIPT END ===

=== ISOLATED SPEAKER SCRIPT START ===
[isolated transcripts with creative content embedded per speaker]
=== ISOLATED SPEAKER SCRIPT END ===
`;

// ============================================================
// PHASE 3: AGENT C — THE GUARDIAN (Audit + Transparency Report)
// ============================================================
export const AGENT_C_AUDIT = `
${COMPACT_RULES}
${APPROVED_VOCAL_TAGS}
${Pronunciation_Guide}

You are Agent C — The Quality Guardian. Final check. Full transparency.

AUDIT PROTOCOL (spot-check, do not re-read entire prompt history):
1. Scan 3 random clinical sections. Count tagged vs total sentences. Target: 15-20%.
2. Scan 2 random women story sections. Count tagged vs total sentences. Target: 25-35%. Verify no two consecutive sentences are tagged.
3. Spot-check 5 medical terms for {phonetic} notation.
4. Verify no line >18 words (scan 10 random lines).
5. Verify no passage >8 lines without structural break.
6. Verify podcast intro contains "Could It Be Adenomyosis?".
7. Verify all 5 sections are present with bridges between them.
8. Verify chapter outro is present and contains NO motivational slogans.
9. Verify TEACHER NOTE content is additive (original complex text still present, unchanged, before the note).
10. Verify CONVERSATIONAL EXPANSIONS preserve the original question verbatim.
11. Verify isolated speaker script is present.
12. Verify patient stories are VERBATIM from the manuscript, not invented.

SCORING:
10 — Flawless. Ship it.
9  — Near-perfect. Cosmetic only.
8  — Production-ready. Minor gaps acceptable.
7  — One area failing. Route to B.
6  — Multiple issues. Route to B with precise feedback.
≤5 — Structural failure. Route to C (Teacher) for rebuild.

ROUTING:
- Tag density too high / emotional misdirection / line breath → FAILING_AGENT: B
- Verbatim / phonetics / formatting / creative embed / teacher note accuracy → FAILING_AGENT: B
- Structural (massive deletions, scrambled order, missing sections, invented stories) → FAILING_AGENT: C
- Pass (8+) → FAILING_AGENT: NONE

OUTPUT:

IF SCORE < 8:
SCORE: [X]/10
FAILING_AGENT: [B | C | NONE]
FEEDBACK: [One precise, actionable sentence. Flag specific lines if possible.]
TAG_DENSITY_CLINICAL: [X]%
TAG_DENSITY_WOMEN: [X]%
CREATIVE_CONTENT_CHECK:
- Show Name: [PRESENT / MISSING]
- Chapter Intro: [PRESENT / MISSING]
- Outro: [PRESENT / MISSING]
- Outro has slogans: [YES / NO]
- Bridges (5 sections): [X]/4 present
- Bridges varied in tone: [YES / NO]
- Teacher Notes: [X] present
- Conversational Expansions: [X] present
- Patient stories verbatim: [YES / NO]
ISOLATED_SPEAKER_SCRIPT: [PRESENT / MISSING]
Do NOT output the script.

IF SCORE >= 8:
SCORE: [X]/10
FAILING_AGENT: NONE
FEEDBACK: Approved for production.
TAG_DENSITY_CLINICAL: [X]%
TAG_DENSITY_WOMEN: [X]%
CREATIVE_CONTENT_CHECK:
- Show Name: PRESENT
- Chapter Intro: PRESENT
- Outro: PRESENT
- Outro has slogans: NO
- Bridges: 4/4 PRESENT
- Bridges varied in tone: YES
- Teacher Notes: [X] PRESENT
- Conversational Expansions: [X] PRESENT
- Patient stories verbatim: YES
ISOLATED_SPEAKER_SCRIPT: PRESENT
PRODUCTION STATUS: APPROVED FOR TTS

=== TRANSPARENCY REPORT START ===
[List every creative addition made to this chapter:]
- Podcast Intro: [word count] words added
- Chapter Intro: [word count] words added
- Bridges: [X] bridges, [total word count] words added
- Teacher Notes: [X] notes, [total word count] words added
- Conversational Expansions: [X] expansions, [total word count] words added
- Outro: [word count] words added
- TOTAL CREATIVE WORDS ADDED: [X]
- TOTAL ORIGINAL WORDS PRESERVED: [X]
- CREATIVE-TO-ORIGINAL RATIO: [X]%
=== TRANSPARENCY REPORT END ===

FINALIZATION (strip only, do not alter content):
- Remove stray asterisks, underscores, bold/italic markers
- Confirm ## Scene: NAME format
- Confirm {phonetic} format (curly braces)
- Confirm line breath compliance
- Confirm all transparency wrapper markers are removed from TTS output (content stays)

=== FINAL MASTER SCRIPT START ===
[Output complete master script exactly as received]
=== FINAL MASTER SCRIPT END ===

=== ISOLATED SPEAKER SCRIPT START ===
[Output complete isolated speaker script exactly as received]
=== ISOLATED SPEAKER SCRIPT END ===
`;

// ============================================================
// HELPERS
// ============================================================

function withFeedback(basePrompt: string, feedback: string, agentLabel: string): string {
  const markers = [
    '=== FORMATTED SCRIPT START ===',
    '=== FINAL SCRIPT START ==='
  ];
  const injection = [
    ``,
    `⚠️ AUDIT FEEDBACK — Agent ${agentLabel}:`,
    `"${feedback}"`,
    `Fix this specifically. Do not change anything else.`,
    ``
  ].join('\n');
  for (const marker of markers) {
    if (basePrompt.includes(marker)) {
      return basePrompt.replace(marker, injection + marker);
    }
  }
  return basePrompt + '\n\n' + injection;
}

function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}

function calculateBurn(
  jarvisIn: number, jarvisOut: number,
  composerIn: number, composerOut: number,
  editorIn: number, editorOut: number,
  auditIn: number, auditOut: number
) {
  const totalIn = jarvisIn + composerIn + editorIn + auditIn;
  const totalOut = jarvisOut + composerOut + editorOut + auditOut;
  const total = totalIn + totalOut;
  return { totalIn, totalOut, total };
}
// ============================================================
// 6. MODEL CALL WITH FALLBACK
// [FIX] res.text fallback — empty string triggers next model
// instead of silently continuing with nothing.
// ============================================================
import { GoogleGenAI } from "@google/genai";


// ============================================================
// 7. ISOLATE SPEAKERS (Post-Processing)
// [FIX] Regex now matches uppercase speaker names (DR. LIANG)
// and multi-word names (DR. BROWN). Previous regex [A-Z][a-z]+
// only matched "Dr" — failed on "DR." because R is uppercase.
// ============================================================
function isolateSpeakers(script: string): string {
  const regex = /## Scene:\s*([\w.]+(?:\s+[\w.]+)*)\s*—?([\s\S]*?)(?=## Scene:|$)/gi;
  let match;
  const speakers: Record<string, string> = {};

  while ((match = regex.exec(script)) !== null) {
    const speaker = match[1].trim().toUpperCase();
    const content = match[2].trim();
    if (!speakers[speaker]) speakers[speaker] = "";
    speakers[speaker] += (speakers[speaker] ? "\n\n" : "") + content;
  }

  if (Object.keys(speakers).length === 0) return script;

  let result = "\n\n=== ISOLATED SPEAKER TRACKS ===\n\n";
  for (const [speaker, content] of Object.entries(speakers)) {
    result += `\n── ${speaker.toUpperCase()} ──\n${content}\n`;
  }
  return result;
}

// ============================================================
// 8. SYSTEM LOCK
// ============================================================
const sessionLocks = new Set<string>();

// ============================================================
// 9. MAIN PIPELINE
// [FIX] Prompt functions called with () — Protocol 5 prompts are
// functions, not static strings. Without (), string concatenation
// produces garbage like "(profiles) => `...`" + script.
// [FIX] postBillboard added on all retry paths.
// [FIX] PIPELINE FAILED message on error instead of silent catch.
// ============================================================
export async function runPipeline(userInput: string, sendToUI: (msg: any) => void, sessionId: string = "default"): Promise<void> {
  if (sessionLocks.has(sessionId)) {
    sendToUI({ agentChat: { agentId: "system", text: "⚠️ Pipeline already running. Please wait." } });
    return;
  }
  sessionLocks.add(sessionId);
  
  const tokenTracker: TokenTracker = { totalTokens: 0, totalInputCharacters: 0, totalOutputCharacters: 0 };

  try {
    sendToUI({ agentChat: { agentId: "jarvis", text: "🔍 Scanning workspace for referenced files..." } });
    const script = await resolveWorkspaceFiles(userInput);

    // ── PHASE 0: JARVIS — THE CONDUCTOR ──────────────────────────────────
    sendToUI({ agentChat: { agentId: "jarvis", text: "🎭 Phase 0: Jarvis — The Conductor reads the manuscript..." } });
    const analysis = await callWithFallback(PRE_ANALYSIS_PROMPT + script, "jarvis", sendToUI, tokenTracker);
    validateStage(analysis, "Jarvis");
    sendToUI({ agentChat: { agentId: "jarvis", text: `🏆 PRE-ANALYSIS COMPLETE\n${analysis}` } });

    // ── PHASE 1: AGENT C — THE COMPOSER ──────────────────────────────────
    sendToUI({ agentChat: { agentId: "agentC", text: "🎵 Phase 1: Agent C — The Composer (Generous Pass)..." } });
    let out = await callWithFallback(AGENT_C_AUDIT + script, "agentC", sendToUI, tokenTracker);
    validateStage(out, "Agent C (Editor)");
    postBillboard(script, out, "agentC", sendToUI);

    // ── PHASE 2: AGENT A — THE DIRECTOR ──────────────────────────────────
    sendToUI({ agentChat: { agentId: "agentA", text: "🎬 Phase 2: Agent A — The Director (Director's Cut)..." } });
    out = await callWithFallback(AGENT_A_DIRECTOR + out, "agentA", sendToUI, tokenTracker);
    validateStage(out, "Agent A (Director)");
    postBillboard(script, out, "agentA", sendToUI);

    // ── PHASE 3: AGENT B — THE EDITOR ──────────────────────────────────
    sendToUI({ agentChat: { agentId: "agentB", text: "✂️ Phase 3: Agent B — The Editor (Final Pass)..." } });
    out = await callWithFallback(AGENT_B_EDITOR + out, "agentB", sendToUI, tokenTracker);
    validateStage(out, "Agent B (Editor)");
    postBillboard(script, out, "agentB", sendToUI);

    // ── PHASE 4: AUDITOR ──────────────────────────────────────────────────
    sendToUI({ agentChat: { agentId: "agentC", text: "🛡️ Phase 4: The Quality Guardian (Audit)..." } });
    const audit = await callWithFallback(AGENT_C_AUDIT + out, "agentC-audit", sendToUI, tokenTracker);
    validateStage(audit, "Agent C (Audit)");

    // Parse audit
    const scoreMatch = audit.match(/SCORE:\s*(\d+)\/10/);
    const failingAgentMatch = audit.match(/FAILING_AGENT:\s*(A|B|C|NONE)/i);
    const feedbackMatch = audit.match(/FEEDBACK:\s*(.+?)(?=\n|$)/i);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const failingAgent = failingAgentMatch ? failingAgentMatch[1].toUpperCase() : 'C';
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : "Review and correct all failing checklist items.";

    sendToUI({ agentChat: { agentId: "agentC", text: `📋 AUDIT REPORT\n${audit}` } });

    if (score >= 8) {
      sendToUI({ agentChat: { agentId: "agentC", text: `✅ Score: ${score}/10 — APPROVED.` } });
    } else {
      const targetAgent = score <= 6 ? 'C' : failingAgent;
      sendToUI({ agentChat: { agentId: `agent${targetAgent}`, text: `🔁 Score: ${score}/10 — Routing to Agent ${targetAgent}. Feedback: ${feedback}` } });

      if (targetAgent === 'A') {
        out = await callWithFallback(withFeedback(AGENT_A_DIRECTOR, feedback, 'A') + out, "agentA (Retry)", sendToUI, tokenTracker);
        validateStage(out, "Agent A (Retry)");
        postBillboard(script, out, "agentA (Retry)", sendToUI);
        out = await callWithFallback(AGENT_B_EDITOR + out, "agentB (Post-Retry)", sendToUI, tokenTracker);
        validateStage(out, "Agent B (Post-Retry)");
        postBillboard(script, out, "agentB (Post-Retry)", sendToUI);

      } else if (targetAgent === 'B') {
        out = await callWithFallback(withFeedback(AGENT_B_EDITOR, feedback, 'B') + out, "agentB (Retry)", sendToUI, tokenTracker);
        validateStage(out, "Agent B (Retry)");
        postBillboard(script, out, "agentB (Retry)", sendToUI);

      } else {
        out = await callWithFallback(withFeedback(AGENT_C_AUDIT, feedback, 'C') + script, "agentC (Retry)", sendToUI, tokenTracker);
        validateStage(out, "Agent C (Retry)");
        postBillboard(script, out, "agentC (Retry)", sendToUI);
        out = await callWithFallback(AGENT_A_DIRECTOR + out, "agentA (Post-Retry)", sendToUI, tokenTracker);
        validateStage(out, "Agent A (Post-Retry)");
        postBillboard(script, out, "agentA (Post-Retry)", sendToUI);
        out = await callWithFallback(AGENT_B_EDITOR + out, "agentB (Post-Retry)", sendToUI, tokenTracker);
        validateStage(out, "Agent B (Post-Retry)");
        postBillboard(script, out, "agentB (Post-Retry)", sendToUI);
      }

      const reAudit = await callWithFallback(AGENT_C_AUDIT + out, "agentC (Re-Audit)", sendToUI, tokenTracker);
      validateStage(reAudit, "Agent C (Re-Audit)");
      const reScore = parseInt(reAudit.match(/SCORE:\s*(\d+)\/10/)?.[1] || "5");
      if (reScore >= 8) {
        sendToUI({ agentChat: { agentId: "agentC", text: `✅ Re-audit passed. Score: ${reScore}/10 — APPROVED.` } });
      } else {
        sendToUI({ agentChat: { agentId: "agentC", text: `⚠️ Re-audit failed (Score: ${reScore}/10). Manual review required.` } });
      }
    }

    // ── PHASE 5: FINAL DELIVERY ────────────────────────────────────────────
    const finalOut = isolateSpeakers(out);

    const reportMd = writeTokenReport(tokenTracker, "protocol5", script);
    sendToUI({ agentChat: { agentId: "system", text: reportMd } });

    sendToUI({
      agentChat: {
        agentId: "agentC",
        text: `✅ PIPELINE COMPLETE — FINAL SCRIPT READY\n${out}\n${finalOut}`
      }
    });

    sendToUI({ agentChat: { agentId: "jarvis", text: "🟢 Pipeline complete. The script is ready for the engine." } });

  } catch (e: any) {
    sendToUI({ agentChat: { agentId: "system", text: `💥 PIPELINE FAILED: ${e.message}` } });
  } finally {
    sessionLocks.delete(sessionId);
  }
}

export const JARVIS_SYSTEM_INSTRUCTION = `You are Jarvis, The Executive Producer. You analyze documentary-style scripts and formulate structural briefs emphasizing historical gravity and cinematic pacing.`;
export const AGENT_A_SYSTEM_INSTRUCTION = `You are Agent A — The Documentary Director. You segment text into rhythmic scenes and format documentary-style narration with dramatic emphasis.`;
export const AGENT_B_SYSTEM_INSTRUCTION = `You are Agent B — The Voice Editor. You apply precise emotional performance tags and refine the vocal delivery.`;
export const AGENT_C_SYSTEM_INSTRUCTION = `You are Agent C — The Polish Editor. You ensure scene transitions, line breaks, and punctuation perfectly support the cinematic documentary style.`;

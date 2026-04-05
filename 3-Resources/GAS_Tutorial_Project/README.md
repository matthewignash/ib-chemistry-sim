# GAS Tutorial Project — Setup & Deployment

A Google Apps Script web app for IB Chemistry worked tutorials, practice problems, and interactive reaction diagrams. All three views live in a single page with tab navigation — one deployment, one Schoology embed. Questions are driven by a Google Sheet so you can reuse the same code for any topic. The diagrams tab uses rough.js for hand-drawn-style reaction pathway animations.

---

## Files in This Project

| File | Type | Purpose |
|---|---|---|
| `Code.gs` | Script | Server-side: serves the page, fetches data, logs responses |
| `Setup.gs` | Script | One-time setup: creates Sheet structure + loads sample data |
| `Index.html` | HTML | Single-page app with Tutorial, Practice, and Diagrams tabs |
| `Styles.html` | HTML | Shared CSS (included via GAS templating) |
| `Scripts.html` | HTML | Shared JS: tab switching, MC logic, response logging |
| `DiagramScripts.html` | HTML | Rough.js reaction diagram drawing, animation, and controls |

Note: `Tutorial.html` and `Practice.html` are from the previous version and are no longer used. You can ignore them.

---

## Setup (10 minutes)

### Step 1: Create the Google Sheet

1. Go to [sheets.new](https://sheets.new) to create a new spreadsheet
2. Name it something like `IB Chemistry Tutorials`

### Step 2: Open Apps Script

1. In the spreadsheet, go to **Extensions → Apps Script**
2. This opens the script editor in a new tab

### Step 3: Add the Code Files

In the Apps Script editor, create these 6 files:

**Script files (.gs):**
- Rename the default `Code.gs` and paste the contents of `Code.gs`
- Click **+** → **Script** → name it `Setup` → paste contents of `Setup.gs`

**HTML files (.html):**
- Click **+** → **HTML** → name it `Index` → paste contents of `Index.html`
- Click **+** → **HTML** → name it `Styles` → paste contents of `Styles.html`
- Click **+** → **HTML** → name it `Scripts` → paste contents of `Scripts.html`
- Click **+** → **HTML** → name it `DiagramScripts` → paste contents of `DiagramScripts.html`

You should have **6 files** total in the editor.

### Step 4: Run Setup

1. In the function dropdown at the top, select `setupSheet`
2. Click **Run**
3. Authorize the script when prompted (you'll see a Google permissions screen — click "Advanced → Go to [project name]" if you see a warning)
4. Wait for the "Setup Complete" dialog

### Step 5: Load Sample Data

1. Select `populateR329Sample` from the dropdown
2. Click **Run**
3. Wait for the "Sample Data Loaded" dialog

Check your spreadsheet — you should see 5 tabs (Config, Questions, Steps, SA_Parts, Responses) with data.

### Step 6: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon → **Web app**
3. Set:
   - **Description:** `IB Chem Tutorial v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. Copy the **Web app URL** — you'll need this for Schoology

---

## Embedding in Schoology

1. In Schoology, create a new **Page** (or add to an existing one)
2. In the rich text editor, click the **HTML/Source** button (`< >`)
3. Paste this iframe code (replace YOUR_URL with the deployment URL):

```html
<iframe src="YOUR_URL" width="100%" height="800" frameborder="0" style="border: none; border-radius: 8px;"></iframe>
```

That's it — one URL, all three tabs are built in. Students see a tab bar to switch between Worked Tutorial, Practice Problems, and Reaction Diagrams.

---

## How It Works for Students

1. Student opens the page (or Schoology loads the iframe)
2. They enter their name (required before they can interact)
3. **Tutorial tab:** They try each MC question, click "Show Solution" to see a step-by-step walkthrough with distractor analysis
4. **Practice tab:** They answer MC questions (instant feedback) and review SA questions with a toggleable marking scheme
5. **Diagrams tab:** Interactive rough.js reaction pathway animations with teacher mode (keyboard controls) and student mode (auto-play). Covers primary alcohol oxidation, secondary/tertiary alcohols, and hydrogenation.
6. Every MC answer is logged to the **Responses** tab in your Sheet with timestamp, name, and correctness

---

## Editing Questions

All content lives in the Google Sheet. No code changes needed.

### To edit an existing question:
Open the **Questions** tab and edit any cell directly. Changes appear on the next page load.

### To add a new tutorial question:
1. Add a row to **Questions** with `Page` = `tutorial`, `Format` = `MC`
2. Add walkthrough steps in the **Steps** tab (match the `QuestionID`)

### To add a new practice MC question:
1. Add a row to **Questions** with `Page` = `practice`, `Format` = `MC`
2. Fill in options, correct answer, and distractor explanations

### To add a new practice SA question:
1. Add a row to **Questions** with `Page` = `practice`, `Format` = `SA`
2. Add parts in **SA_Parts** tab (match the `QuestionID`)

### To switch topics entirely:
1. Update the **Config** tab (topicCode, topicName, titles)
2. Clear and repopulate Questions, Steps, SA_Parts
3. No code changes or redeployment needed

---

## Sheet Structure Reference

### Config Tab
| Key | Example Value |
|---|---|
| tutorialTitle | Worked Tutorial |
| tutorialSubtitle | Step-by-Step Solutions |
| practiceTitle | Practice Problems |
| practiceSubtitle | Original Problems with Answer Key |
| topicTag | IB Chemistry |
| topicCode | R3.2.9–3.2.11 |
| topicName | Organic Redox Reactions |

### Questions Tab
| Column | Description |
|---|---|
| ID | Unique identifier (T1, T2, P1, P2, etc.) |
| Page | `tutorial` or `practice` |
| Number | Display order (1, 2, 3...) |
| Format | `MC` or `SA` |
| Topic | Short topic name for the card header |
| Stem | The question text |
| OptionA–D | MC answer choices (leave blank for SA) |
| CorrectAnswer | Letter (A/B/C/D) for MC, blank for SA |
| Marks | Point value |
| Source | Kognity, Supplementary, Original, etc. |
| KeyTakeaway | Summary box at end of tutorial solution |
| DistractorA–D | Why each wrong answer is wrong |

### Steps Tab (Tutorial walkthrough)
| Column | Description |
|---|---|
| QuestionID | Matches Questions.ID |
| StepNum | 1, 2, 3... |
| StepTitle | Bold title for the step |
| StepText | Explanation (HTML allowed: `<strong>`, `<em>`, `<br>`) |

### SA_Parts Tab
| Column | Description |
|---|---|
| QuestionID | Matches Questions.ID |
| PartLabel | a, b, c... |
| PartPrompt | The sub-question text |
| PartMarks | Points for this part |
| PartAnswer | Marking scheme / model answer |

### Responses Tab (auto-populated)
| Column | Description |
|---|---|
| Timestamp | When the student answered |
| StudentName | From the name entry screen |
| Page | tutorial or practice |
| QuestionID | Which question |
| QuestionNum | Display number |
| StudentAnswer | A/B/C/D or "viewed_answer" for SA |
| CorrectAnswer | The right answer |
| IsCorrect | Yes / No |

---

## Updating After Deployment

- **Content changes** (questions, steps, config): Edit the Sheet directly. Changes appear on the next page load — no redeployment needed.
- **Code/template changes** (HTML, CSS, JS): After editing in the Apps Script editor, go to **Deploy → Manage deployments → Edit (pencil icon) → Version: New version → Deploy**.

---

## Troubleshooting

**"Script authorization required"** — When you first run a function, Google asks for permissions. Click through the warning ("This app isn't verified") → "Advanced" → "Go to [project name]".

**iframe not loading in Schoology** — Make sure the deployment has "Who has access: Anyone". The `setXFrameOptionsMode(ALLOWALL)` in Code.gs enables iframe embedding.

**Questions not appearing** — Check that the `Page` column in the Questions tab matches exactly (`tutorial` or `practice`, lowercase).

**Old content showing after code change** — Create a new deployment version: Deploy → Manage deployments → Edit → New version → Deploy.

**Tabs not switching** — Make sure the `Index.html` file name is exactly `Index` (capital I) in the Apps Script editor.

**Diagrams not rendering** — The diagram canvases are lazy-initialized (they can't render while hidden). They initialize the first time you click the Diagrams tab. If they still don't appear, check that `DiagramScripts` is named exactly `DiagramScripts` in the Apps Script editor and that the rough.js CDN (`https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js`) is accessible from your network.

**Diagram keyboard controls not working** — Keyboard shortcuts (spacebar, arrow keys, 1/2/3, R) only work in Teacher mode. Click on a diagram section first to give it focus, then use keyboard controls.

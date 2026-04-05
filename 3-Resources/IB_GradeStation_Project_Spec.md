# IB GradeStation — Project Specification

## Scan-to-Grade-to-Dashboard Assessment Tool for IB Chemistry

**Version:** 0.1 (Planning)
**Date:** April 1, 2026
**Target Build Environment:** Claude Code
**Status:** Planning — ready for implementation

---

## 1. Project Vision

A Python desktop application that closes the loop from printed exam → scanned student work → graded assessment → longitudinal student record → live dashboard. The teacher scans a stack of exams from a flatbed/ADF scanner, the tool splits each PDF into per-student packets, OCRs the MCQ answer sheet, loads FRQ student work as images alongside the mark scheme, and exports scored data into a running SQLite database that powers student/teacher reports and a searchable dashboard.

### What makes this different from GradeTrack-Story11

GradeTrack is a Google Sheets–backed web app where a teacher types in scores. GradeStation adds **physical paper intake** — the scan pipeline, OCR, and image-based FRQ review — while inheriting GradeTrack's proven data models for grade bands, longitudinal tracking, and AISC rubric language.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   IB GRADESTATION                        │
│                                                         │
│  ┌───────────┐   ┌───────────┐   ┌──────────────────┐  │
│  │  INTAKE   │──▸│  GRADING  │──▸│  DATA & REPORTS  │  │
│  │  MODULE   │   │  MODULE   │   │  MODULE          │  │
│  └───────────┘   └───────────┘   └──────────────────┘  │
│       │               │                  │              │
│  Scan PDF        MCQ auto-mark      SQLite DB          │
│  Split pages     FRQ image view     Grade bands        │
│  OCR MCQs        Rubric checklist   Longitudinal       │
│  Crop FRQs       Score override     PDF/XLSX export    │
│                                     Dashboard          │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Language | Python 3.10+ | Teacher already uses Python; rich OCR/PDF ecosystem |
| GUI | Tkinter + ttkbootstrap | Native macOS, no install friction, modern look via ttkbootstrap |
| Database | SQLite (single file) | Portable, zero-config, backs up by copying one file |
| PDF parsing | PyMuPDF (fitz) | Already in use for exam generation; fast, reliable |
| OCR | Tesseract via pytesseract | Free, local, no API keys; good for printed + handwritten block letters |
| Image processing | Pillow + OpenCV | Crop regions, preprocessing for OCR accuracy |
| Reporting | python-docx + matplotlib | Reuse exam-generation patterns; charts for dashboards |
| Dashboard | Tkinter Treeview + matplotlib embedded | Or optional: local Flask server with HTML dashboard |

---

## 3. Module 1: Intake Pipeline

### 3.1 Exam Registration

Before scanning, the teacher registers the exam in the system. This loads the answer key, question metadata, and rubrics.

**Input options:**
1. **Import from build script** — Parse the Python build script (e.g., `build_hl_exam.py`) to extract question numbers, subtopics, marks, and MCQ answers automatically
2. **Import from answer key .docx** — Parse the answer key document
3. **Manual entry** — GUI form for creating exam definition

**Exam definition stored in DB:**
```
exam {
  exam_id        TEXT PRIMARY KEY
  exam_name      TEXT        -- "R3.1 Summative HL"
  course         TEXT        -- "IB Chemistry HL"
  date           TEXT        -- "2026-03-31"
  total_marks    INTEGER     -- 39
  ku_marks       INTEGER     -- 16
  tt_marks       INTEGER     -- 11
  c_marks        INTEGER     -- 12
  created_at     TIMESTAMP
}

question {
  exam_id        TEXT
  qid            TEXT        -- "Q1", "Q17a", "Q20bii"
  section        TEXT        -- "Paper 1A", "Paper 1B", "Paper 2"
  number         INTEGER
  label          TEXT        -- "1", "17(a)", "20(b)(ii)"
  marks          INTEGER
  strand         TEXT        -- "KU", "TT", "C"
  subtopic       TEXT        -- "R3.1.1"
  scoring_mode   TEXT        -- "mcq", "rubric", "manual"
  correct_answer TEXT        -- "B" (MCQ only)
  question_text  TEXT        -- Full question text for display
}

rubric_item {
  exam_id        TEXT
  qid            TEXT
  item_id        TEXT        -- "M1", "M2", "M3"
  points         INTEGER
  criteria       TEXT        -- "Non-symmetrical sigmoidal curve AND buffer region near pH 5"
}
```

### 3.2 Scan Import

**Input:** Multi-page PDF from flatbed/ADF scanner (one PDF per class, or one per student).

**Processing pipeline:**

```
Load PDF
  ├── Detect page boundaries (student separator)
  │   Option A: Blank page between students
  │   Option B: Cover page detection (name field OCR)
  │   Option C: Fixed page count per student (teacher specifies)
  │
  ├── Split into per-student packets
  │
  ├── For each student packet:
  │   ├── Page 1: Cover page → OCR student name
  │   ├── Page 2: Skip (grade table)
  │   ├── Page 3: MCQ answer sheet → OCR answers
  │   ├── Pages 4+: Question pages → crop per-question regions
  │   └── Store all images in DB (as BLOBs or file paths)
  │
  └── Present results for teacher review
```

**Student identification:**
- OCR the name field on the cover page
- Fuzzy match against class roster (Levenshtein distance)
- Teacher confirms/corrects matches in a review panel

### 3.3 MCQ OCR

**Approach:** Handwritten letter recognition in structured grid cells.

The MCQ answer sheet has a known layout (3-column table: Question | Subtopic | Answer). We know the exact grid coordinates from the document template.

**Pipeline:**
1. Deskew the scanned page (correct rotation)
2. Locate the MCQ grid using template matching or line detection
3. For each answer cell (16 cells for HL):
   - Crop the cell region
   - Preprocess: binarize, denoise, center the character
   - Run Tesseract with `--psm 10` (single character mode)
   - Whitelist: `ABCD` only
   - Confidence threshold: if < 70%, flag for teacher review
4. Compare against answer key → auto-score
5. Display results in editable grid (teacher can fix any misreads)

**Fallback:** If OCR accuracy is poor, display the cropped cell image next to a dropdown (A/B/C/D/blank) for fast manual entry. This is still much faster than entering from scratch.

### 3.4 FRQ Image Extraction

For Paper 1B and Paper 2 questions, we don't OCR — we crop the student's handwritten work and display it as an image alongside the rubric.

**Approach:**
- Teacher defines crop regions once per exam template (or we auto-detect answer box boundaries)
- For each student, crop those regions from the scanned pages
- Store cropped images linked to (student_key, exam_id, qid)

---

## 4. Module 2: Grading Interface

### 4.1 MCQ Review Panel

```
┌──────────────────────────────────────────────────┐
│  Student: Sarah Kim          Exam: R3.1 HL       │
│  MCQ Score: 14/16 (auto-marked)                  │
│                                                   │
│  Q  Key  Student  ✓/✗  Confidence  [Override]    │
│  1   B     B       ✓    98%                      │
│  2   B     B       ✓    95%                      │
│  3   A     C       ✗    91%         [▼ Change]   │
│  4   D     D       ✓    88%                      │
│  5   C     C       ✓    72%    ⚠                 │
│  ...                                              │
│  16  A     A       ✓    94%                      │
│                                                   │
│  [Accept All]  [Next Student →]                  │
└──────────────────────────────────────────────────┘
```

- Auto-marked answers shown with confidence scores
- Low-confidence answers (⚠) highlighted for review
- Click any answer to see the cropped cell image and override
- "Accept All" confirms and moves to FRQ grading

### 4.2 FRQ Grading Panel

```
┌──────────────────────────────────────────────────┐
│  Q20(a) — Sketch pH curve [3 marks]  R3.1.9     │
│                                                   │
│  ┌─────────────────┐  ┌────────────────────────┐ │
│  │                  │  │ Mark Scheme:           │ │
│  │  [Student's      │  │                        │ │
│  │   scanned work   │  │ □ M1: Non-symmetrical  │ │
│  │   displayed      │  │   sigmoidal curve AND  │ │
│  │   as image]      │  │   buffer region ~pH 5  │ │
│  │                  │  │                        │ │
│  │                  │  │ □ M2: Starts pH 2-4    │ │
│  │                  │  │   AND flattens >pH 12  │ │
│  │                  │  │                        │ │
│  │                  │  │ □ M3: Equivalence pt   │ │
│  │                  │  │   pH 8-10 at 15 cm³    │ │
│  └─────────────────┘  └────────────────────────┘ │
│                                                   │
│  Points: [2] / 3     Comment: [____________]     │
│                                                   │
│  [← Prev Q]  [Next Q →]  [Next Student →]       │
└──────────────────────────────────────────────────┘
```

- Left panel: student's scanned work (zoomable, pannable)
- Right panel: rubric checklist from mark scheme
- Teacher clicks checkboxes → points auto-calculate
- Optional comment field for specific feedback
- Keyboard shortcuts: 0-3 for quick point entry, Tab to next question, Enter for next student

### 4.3 Batch Workflow

The grading interface supports two workflows:

1. **By student:** Grade all questions for one student, then move to next student
2. **By question:** Grade Q20(a) for ALL students, then move to Q20(b.i) — better for consistency

Teacher chooses workflow at start of grading session.

---

## 5. Module 3: Data, Reporting & Dashboard

### 5.1 Database Schema

Inherits from GradeTrack-Story11's proven 11-sheet model, adapted for SQLite:

```sql
-- Core tables (from GradeTrack)
CREATE TABLE roster (
  student_key   TEXT PRIMARY KEY,  -- "kim|sarah|P3"
  last_name     TEXT,
  first_name    TEXT,
  class_section TEXT,
  email         TEXT
);

CREATE TABLE responses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id       TEXT,
  student_key   TEXT,
  qid           TEXT,
  mcq_choice    TEXT,          -- "B" (MCQ only)
  points_awarded REAL,
  comment       TEXT,
  graded_at     TIMESTAMP,
  graded_by     TEXT,          -- "auto-ocr" or "teacher"
  UNIQUE(exam_id, student_key, qid)
);

CREATE TABLE grade_bands (
  exam_id       TEXT,
  scale         TEXT,          -- "AISC_1_8" or "IB_1_7"
  strand        TEXT,          -- "OVERALL", "KU", "TT", "C"
  band          INTEGER,
  min_points    REAL,
  max_points    REAL,
  PRIMARY KEY(exam_id, scale, strand, band)
);

CREATE TABLE scores (
  exam_id       TEXT,
  student_key   TEXT,
  total_points  REAL,
  ku_points     REAL,
  tt_points     REAL,
  c_points      REAL,
  ib_grade      INTEGER,       -- 1-7
  ku_band       INTEGER,       -- AISC 1-8
  tt_band       INTEGER,
  c_band        INTEGER,
  last_updated  TIMESTAMP,
  PRIMARY KEY(exam_id, student_key)
);

-- New tables for scan pipeline
CREATE TABLE scan_images (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id       TEXT,
  student_key   TEXT,
  qid           TEXT,          -- NULL for full page scans
  page_number   INTEGER,
  image_path    TEXT,          -- relative path to cropped image
  ocr_text      TEXT,          -- raw OCR output (MCQ)
  ocr_confidence REAL,
  created_at    TIMESTAMP
);

CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action        TEXT,          -- "GRADE_MCQ", "OVERRIDE_OCR", "EXPORT_PDF"
  details       TEXT           -- JSON blob
);

-- Longitudinal tracking
CREATE TABLE topic_breakdown (
  exam_id       TEXT,
  student_key   TEXT,
  qid           TEXT,
  strand        TEXT,
  subtopic      TEXT,          -- "R3.1.1"
  points_possible REAL,
  points_earned REAL,
  PRIMARY KEY(exam_id, student_key, qid)
);
```

### 5.2 Grade Band Configuration

Pulled directly from GradeTrack-Story11's proven system:

**Two scales per exam:**
- **AISC 1–8** (per strand: KU, TT, C) — used for Schoology gradebook
- **IB 1–7** (overall marks) — used for IB predicted grades

**Always whole marks, never percentages.** (Per Matthew's established preference.)

**AISC default thresholds:**
| Band | Min % |
|------|-------|
| 8 | 85% |
| 7 | 70% |
| 6 | 60% |
| 5 | 50% |
| 4 | 40% |
| 3 | 30% |
| 2 | 20% |
| 1 | 0% |

Applied per-strand using `round(total × pct / 100)`.

**IB HL default thresholds:**
| Grade | Min % |
|-------|-------|
| 7 | 76% |
| 6 | 64% |
| 5 | 52% |
| 4 | 38% |
| 3 | 26% |
| 2 | 14% |
| 1 | 0% |

Applied to overall marks.

Teacher can override any band boundary for any exam.

### 5.3 Export Functions

**1. Score Sheet Export (XLSX)**
- One row per student per exam
- Columns: Student, KU raw, KU band, TT raw, TT band, C raw, C band, Total, IB Grade
- Compatible with Schoology bulk import format
- Running cumulative sheet across all exams in the course

**2. Student Report (PDF/DOCX)**
Inherits GradeTrack-Story11's report structure:
- Band summary table (IB Grade | KU | TT | C)
- Strand points overview with status indicators (✓/⚠/✗)
- AISC holistic rubric language for each band
- Topic performance breakdown (by R3.1.x subtopic)
- Strengths and growth areas
- Question-level detail (MCQ grid + FRQ feedback)
- No percentages displayed — points and bands only

**3. Teacher Report (PDF)**
- Class summary: score distribution, mean/median per strand
- Item analysis: difficulty index, discrimination index per question
- Common errors: most frequent wrong MCQ answers, common FRQ gaps
- Subtopic heatmap: which subtopics need reteaching

**4. Data Export (JSON/CSV)**
- Full database dump for external analysis
- Per-exam or per-student filtering
- Compatible with future Google Sheets sync if desired

### 5.4 Dashboard

The dashboard lives inside the desktop app (Tkinter) with an optional Flask-served HTML version for richer visualization.

**Student View (searchable):**
- Search by student name
- Show all exams taken, scores, bands, trends
- Drill into any exam for question-level detail
- Longitudinal chart: band progression over time per strand

**Class View:**
- Select exam → see all students sorted by score
- Color-coded cells (green ≥ Band 6, yellow Band 4-5, red ≤ Band 3)
- Click any student to drill into their record

**Subtopic View:**
- Heatmap: students × subtopics, color by mastery
- Identify which subtopics need reteaching
- Filter by strand (KU/TT/C)

**Longitudinal Memory:**
- Every score persists in SQLite forever
- Teacher can add notes to any student record
- Notes carry forward: "Sarah struggles with buffer calculations — see R3.1 Q20"
- Search across all notes and comments

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Stories 1–3)
**Goal:** Working database + exam registration + roster management

- [ ] SQLite schema creation and migration system
- [ ] Exam registration GUI (manual + import from build script)
- [ ] Roster management (import from CSV/XLSX, add/edit students)
- [ ] Grade band configuration GUI (AISC + IB scales)
- [ ] Basic app shell with navigation (ttkbootstrap)

### Phase 2: Scan Pipeline (Stories 4–6)
**Goal:** PDF intake → student splitting → MCQ OCR

- [ ] PDF import and page viewer
- [ ] Student packet splitting (fixed page count + cover page OCR)
- [ ] Name recognition and roster matching
- [ ] MCQ grid detection and character OCR
- [ ] MCQ review/correction interface
- [ ] Auto-scoring against answer key

### Phase 3: FRQ Grading (Stories 7–8)
**Goal:** Image-based FRQ grading with rubrics

- [ ] FRQ region cropping (define template once per exam)
- [ ] Side-by-side grading view (student image + rubric checklist)
- [ ] Point calculation from rubric checkboxes
- [ ] Comment/feedback per question
- [ ] Batch grading workflows (by student or by question)

### Phase 4: Reporting & Export (Stories 9–11)
**Goal:** Score export + student/teacher reports

- [ ] Score computation engine (strand totals → band lookup)
- [ ] XLSX export (Schoology-compatible format)
- [ ] Student PDF report (bands, rubric language, topic breakdown)
- [ ] Teacher PDF report (class stats, item analysis)
- [ ] Audit logging

### Phase 5: Dashboard & Longitudinal (Stories 12–14)
**Goal:** Searchable dashboard with longitudinal tracking

- [ ] Student search and drill-down
- [ ] Class overview with sorting/filtering
- [ ] Subtopic heatmap
- [ ] Longitudinal charts (band progression over time)
- [ ] Teacher notes system (per-student, searchable)
- [ ] Optional: Flask-served HTML dashboard for richer visualization

---

## 7. Patterns Inherited from GradeTrack-Story11

| Pattern | GradeTrack Implementation | GradeStation Adaptation |
|---------|--------------------------|------------------------|
| Data model | 11 Google Sheets | 8 SQLite tables (same concepts, normalized) |
| Grade bands | AISC_1_8 + AP_1_5, point-based | AISC_1_8 + IB_1_7, same logic |
| Scoring | Auto MCQ + manual FRQ | Auto MCQ via OCR + image-based FRQ |
| Longitudinal | SCORES_ALL archive sheet | `scores` table (never deleted, only appended) |
| Topic tracking | TopicSkillBreakdown sheet | `topic_breakdown` table |
| Reports | HTML → Google Docs → PDF | python-docx direct to PDF |
| AISC language | AISC_LANGUAGE constant in ReportData.gs | Same descriptors in Python config |
| Audit trail | Fire-and-forget append to AuditLog sheet | `audit_log` table |
| No percentages | Enforced throughout UI and reports | Same — points and bands only |
| Concurrency | LockService | SQLite WAL mode (single-user desktop, simpler) |

---

## 8. New Capabilities (Not in GradeTrack)

1. **Scan-to-grade pipeline** — Physical paper → digital grading
2. **OCR for handwritten MCQ answers** — Tesseract with structured grid detection
3. **Image-based FRQ review** — Student work displayed as zoomable images
4. **Template-based region cropping** — Define crop zones once, apply to all students
5. **Confidence scoring** — OCR confidence flags unreliable reads for teacher review
6. **Offline-first** — No internet required; everything local
7. **Single-file database** — SQLite file backs up trivially (copy/paste or Time Machine)
8. **Build script import** — Parse existing Python exam generators to auto-populate exam definitions
9. **Subtopic heatmap** — Visual class-wide view of mastery by IB subtopic
10. **Teacher notes with search** — Longitudinal memory system for student observations

---

## 9. File Structure

```
IB-GradeStation/
├── README.md
├── requirements.txt
├── main.py                    # App entry point
├── config.py                  # Constants, AISC language, default bands
├── db/
│   ├── schema.sql             # Table definitions
│   ├── migrations/            # Schema version upgrades
│   └── database.py            # SQLite wrapper (CRUD operations)
├── intake/
│   ├── scanner.py             # PDF loading, page splitting
│   ├── ocr.py                 # Tesseract MCQ recognition
│   ├── cropper.py             # FRQ region extraction
│   └── matcher.py             # Student name ↔ roster matching
├── grading/
│   ├── mcq_panel.py           # MCQ review/override GUI
│   ├── frq_panel.py           # FRQ image + rubric GUI
│   └── scorer.py              # Points → bands computation
├── reporting/
│   ├── xlsx_export.py         # Schoology-format spreadsheets
│   ├── student_report.py      # Individual student PDF/DOCX
│   ├── teacher_report.py      # Class analytics PDF
│   └── charts.py              # matplotlib chart generation
├── dashboard/
│   ├── student_view.py        # Search + drill-down
│   ├── class_view.py          # Overview + heatmap
│   └── longitudinal.py        # Trend charts
├── ui/
│   ├── app_shell.py           # Main window, navigation
│   ├── exam_builder.py        # Exam registration GUI
│   ├── roster_manager.py      # Student list management
│   └── band_editor.py         # Grade band configuration
├── data/
│   ├── gradestation.db        # SQLite database (created at runtime)
│   └── scans/                 # Stored scan images (per exam/student)
└── tests/
    ├── test_ocr.py
    ├── test_scorer.py
    └── test_db.py
```

---

## 10. Open Questions for Build Time

1. **Tesseract accuracy on handwritten block letters** — Need to test with real scanned answer sheets. If accuracy < 80%, fall back to image + dropdown approach (still faster than from-scratch entry).

2. **Page splitting heuristic** — Fixed page count is simplest (teacher says "9 pages per student"). Cover page OCR is fancier but may not be needed if exams are always the same length.

3. **Image storage** — BLOBs in SQLite vs. file system with paths in DB. File system is simpler to debug and doesn't bloat the DB. Recommend: `data/scans/{exam_id}/{student_key}/Q20a.png`.

4. **Dashboard: Tkinter vs. Flask** — Tkinter is simpler (one app, no browser). Flask gives richer charts and HTML tables. Could start Tkinter, add optional Flask dashboard later as Phase 5 enhancement.

5. **Multi-class support** — Does the roster span multiple class sections? GradeTrack supports this with `class_section` field. Carry forward.

6. **Exam template reuse** — If the same exam structure repeats (e.g., every R3.x summative has same Paper 1A/1B/2 split), allow saving exam templates.

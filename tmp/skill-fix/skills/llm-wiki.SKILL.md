---
name: llm-wiki
description: "Karpathy's LLM Wiki — build and maintain a persistent, interlinked markdown knowledge base. Ingest sources, query compiled knowledge, and lint for consistency."
version: 3.0.0
trigger: /llm-wiki
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [wiki, knowledge-base, research, notes, markdown, rag-alternative]
    category: research
    related_skills: [obsidian, arxiv, agentic-research-ideas]
    config:
      - key: wiki.path
        description: Path to the LLM Wiki knowledge base directory
        default: "~/wiki"
        prompt: Wiki directory path
---

# Karpathy's LLM Wiki

Build and maintain a persistent, compounding knowledge base as interlinked markdown files.
Based on [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

Unlike traditional RAG (which rediscovers knowledge from scratch per query), the wiki
compiles knowledge once and keeps it current. Cross-references are already there.
Contradictions have already been flagged. Synthesis reflects everything ingested.

**Division of labor:** The human curates sources and directs analysis. The agent
summarizes, cross-references, files, and maintains consistency.

## When This Skill Activates

Use this skill when the user:
- Asks to create, build, or start a wiki or knowledge base
- Asks to ingest, add, or process a source into their wiki
- Asks a question and an existing wiki is present at the configured path
- Asks to lint, audit, or health-check their wiki
- References their wiki, knowledge base, or "notes" in a research context

## Wiki Location

Configured via `skills.config.wiki.path` in `~/.hermes/config.yaml` (prompted
during `hermes config migrate` or `hermes setup`):

```yaml
skills:
  config:
    wiki:
      path: ~/wiki
```

Falls back to `~/wiki` default. The resolved path is injected when this
skill loads — check the `[Skill config: ...]` block above for the active value.

The wiki is just a directory of markdown files — open it in Obsidian, VS Code, or
any editor. No database, no special tooling required.

## Architecture: Four Layers

```
wiki/
├── SCHEMA.md                # Conventions, structure rules, domain config, taxonomy
├── index.md                 # Sectioned content catalog with one-line summaries
├── log.md                   # Chronological action log (append-only, rotated yearly)
├── _meta/
│   └── classification.md    # Source classification history & auto-class rules
├── raw/                      # Layer 1: Immutable source material
│   ├── articles/             # Web articles, blog posts, clippings
│   ├── papers/               # Academic papers, arxiv, whitepapers
│   ├── transcripts/          # Meeting notes, interviews, podcasts
│   ├── specs/                # Technical specs, RFCs, API docs, standards
│   ├── datasets/             # Data dictionaries, survey results, benchmarks
│   ├── news/                 # News articles, press releases, announcements
│   └── assets/               # Images, diagrams referenced by sources
├── entities/                 # Layer 2: Entity pages (people, orgs, products, models)
├── concepts/                 # Layer 2: Concept/topic pages
├── comparisons/              # Layer 2: Side-by-side analyses
├── queries/                  # Layer 2: Filed query results worth keeping
└── _archive/                 # Layer 2: Superseded pages (not deleted, moved here)
```

**Layer 1 — Raw Sources:** Immutable. The agent reads but never modifies these.
**Layer 2 — The Wiki:** Agent-owned markdown files. Created, updated, and
cross-referenced by the agent.
**Layer 3 — The Schema:** `SCHEMA.md` defines structure, conventions, and hierarchical tag taxonomy.
**Layer 4 — Classification Meta:** `_meta/classification.md` tracks source classification
decisions and auto-classification rules for future training.

## Resuming an Existing Wiki (CRITICAL — do this every session)

When the user has an existing wiki, **always orient yourself before doing anything**:

① **Read `SCHEMA.md`** — understand the domain, conventions, and tag taxonomy.
② **Read `index.md`** — learn what pages exist and their summaries.
③ **Scan recent `log.md`** — read the last 20-30 entries to understand recent activity.

```bash
WIKI="${wiki_path:-$HOME/wiki}"
# Orientation reads at session start
read_file "$WIKI/SCHEMA.md"
read_file "$WIKI/index.md"
read_file "$WIKI/log.md" offset=<last 30 lines>
```

Only after orientation should you ingest, query, or lint. This prevents:
- Creating duplicate pages for entities that already exist
- Missing cross-references to existing content
- Contradicting the schema's conventions
- Repeating work already logged

For large wikis (100+ pages), also run a quick `search_files` for the topic
at hand before creating anything new.

## Initializing a New Wiki

When the user asks to create or start a wiki:

1. Determine the wiki path (from config, env var, or ask the user; default `~/wiki`)
2. Create the directory structure above (including `raw/` subdirs, `_meta/`, `_archive/`)
3. Ask the user what domain the wiki covers — be specific
4. Write `SCHEMA.md` customized to the domain (see template below)
5. Write initial `index.md` with sectioned header
6. Write initial `log.md` with creation entry
7. Write initial `_meta/classification.md` with the default classification rules
8. Confirm the wiki is ready and suggest first sources to ingest

### SCHEMA.md Template

Adapt to the user's domain. The schema constrains agent behavior and ensures consistency:

```markdown
# Wiki Schema

## Domain
[What this wiki covers — e.g., "AI/ML research", "personal health", "startup intelligence"]

## Conventions
- File names: lowercase, hyphens, no spaces (e.g., `transformer-architecture.md`)
- Every wiki page starts with YAML frontmatter (see below)
- Use `[[wikilinks]]` to link between pages (minimum 2 outbound links per page)
- When updating a page, always bump the `updated` date
- Every new page must be added to `index.md` under the correct section
- Every action must be appended to `log.md`

## Frontmatter
  ```yaml
  ---
  title: Page Title
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  type: entity | concept | comparison | query | summary
  tags: [from taxonomy below — use hierarchical dotted notation]
  domain: [primary domain from taxonomy, e.g. "ai.nlp"]
  sources: [raw/articles/source-name.md]
  quality: primary | secondary | tertiary
  source_type: article | paper | spec | transcript | dataset | news | manual
  ---
  ```

## Hierarchical Tag Taxonomy
[Define a 2-3 level hierarchy for the domain. Add new tags HERE before using them.]

Example for AI/ML (dotted notation → flat obsidian-safe tags):
```
ai
  ai.nlp
    ai.nlp.transformer
    ai.nlp.tokenizer
    ai.nlp.embedding
  ai.cv
    ai.cv.gan
    ai.cv.diffusion
    ai.cv.detection
  ai.rl
    ai.rl.policy-gradient
    ai.rl.value-based
ai.model
  ai.model.architecture
  ai.model.training
  ai.model.benchmark
  ai.model.fine-tuning
  ai.model.inference
  ai.model.alignment
person
  person.researcher
  person.engineer
  person.executive
org
  org.company
  org.lab
  org.open-source
  org.regulator
method
  method.optimization
  method.evaluation
  method.data-augmentation
  method.distillation
meta
  meta.comparison
  meta.timeline
  meta.controversy
  meta.prediction
  meta.retrospective
```

**Tag rules:**
- Use the most specific tag available (prefer `ai.nlp.transformer` over `ai.nlp` or `ai`)
- A page can have 2-5 tags; always include the leaf-level tag, parent is optional
- For Obsidian compatibility, store tags both dotted AND flat: `ai.nlp.transformer` → also add `transformer`
- Every tag on a page must appear in this taxonomy. If a new tag is needed,
  add it here first, then use it. This prevents tag sprawl.

## Source Classification System

### Source Types
When ingesting a source, classify it into one of these categories:

| Type | Directory | Description | Examples |
|------|-----------|-------------|---------|
| `article` | `raw/articles/` | Web articles, blog posts, essays | Medium posts, dev blogs, opinion pieces |
| `paper` | `raw/papers/` | Formal academic publications | arXiv papers, peer-reviewed, whitepapers |
| `spec` | `raw/specs/` | Technical specifications | RFCs, API docs, standards, protocols |
| `transcript` | `raw/transcripts/` | Spoken content transcribed | Meeting notes, interviews, podcasts |
| `dataset` | `raw/datasets/` | Structured data descriptions | Census data, benchmark results, surveys |
| `news` | `raw/news/` | Time-sensitive reporting | Press releases, news articles, announcements |
| `manual` | `raw/articles/` | How-tos, guides, tutorials | Documentation, cookbooks, READMEs |

### Quality Rating
Assign a quality rating to every source during ingest:

| Rating | Definition | When to Use |
|--------|-----------|-------------|
| `primary` | First-hand, original source | Peer-reviewed papers, official docs, direct observations |
| `secondary` | Analysis or summary of primary | Blog posts analyzing papers, review articles, textbooks |
| `tertiary` | Aggregate, opinion, or unverified | Social media posts, forum discussions, uncorroborated claims |

### Auto-Classification Rules
When ingesting a source, follow this decision tree:

1. **URL pattern matching:**
   - `arxiv.org` → `paper`, `primary`
   - `*.dev`, `docs.*.io` → `spec`, `primary`
   - `medium.com`, `substack.com` → `article`, `secondary`
   - `news.ycombinator.com`, `reddit.com` → `article`, `tertiary`
   - `github.com` → `spec`, `primary` (if repo README/docs) or `secondary` (if analysis)

2. **Content heuristics:**
   - Has abstract, methodology, citations → `paper`, `primary`
   - Has code examples, API endpoints → `spec`, `primary`
   - Links to other primary sources extensively → `article`, `secondary`
   - Personal opinion without citations → `article`, `tertiary`

3. **Manual override:** If the user specifies a type or quality, always prefer their judgment.

Record every classification decision in `_meta/classification.md` so the agent
can learn from patterns over time.

## Page Thresholds
- **Create a page** when an entity/concept appears in 2+ sources OR is central to one source
- **Add to existing page** when a source mentions something already covered
- **DON'T create a page** for passing mentions, minor details, or things outside the domain
- **Split a page** when it exceeds ~200 lines — break into sub-topics with cross-links
- **Archive a page** when its content is fully superseded — move to `_archive/`, remove from index

## Entity Pages
One page per notable entity. Include:
- Overview / what it is
- Key facts and dates
- Relationships to other entities ([[wikilinks]])
- Source references

## Concept Pages
One page per concept or topic. Include:
- Definition / explanation
- Current state of knowledge
- Open questions or debates
- Related concepts ([[wikilinks]])

## Comparison Pages
Side-by-side analyses. Include:
- What is being compared and why
- Dimensions of comparison (table format preferred)
- Verdict or synthesis
- Sources

## Update Policy
When new information conflicts with existing content:
1. Check the dates — newer sources generally supersede older ones
2. If genuinely contradictory, note both positions with dates and sources
3. Mark the contradiction in frontmatter: `contradictions: [page-name]`
4. Flag for user review in the lint report
```

### _meta/classification.md Template

Created on first ingest. Tracks auto-classification decisions:

```markdown
# Source Classification Log

> Records classification decisions during ingest.
> Helps the agent learn patterns for auto-classification over time.

## Classification Rules
<!-- Agent-maintained: add new patterns discovered during ingest -->

### URL Patterns
- arxiv.org → paper/primary
- docs.*.io → spec/primary
- medium.com, substack.com → article/secondary
- github.com (README, docs/) → spec/primary
- github.com (issues, discussions) → article/tertiary
- news.*.com → news/secondary

### Content Heuristics
- [abstract + methodology + references] → paper/primary
- [code examples + API sections] → spec/primary
- [links to 3+ primary sources] → article/secondary
- [opinion without citations] → article/tertiary

## Classification History
| Date | Source | Assigned Type | Assigned Quality | Reason |
|------|--------|--------------|-----------------|--------|
| YYYY-MM-DD | example-paper.md | paper | primary | arXiv URL + has abstract |
```

### index.md Template

The index is sectioned by type. Each entry is one line: wikilink + summary.

```markdown
# Wiki Index

> Content catalog. Every wiki page listed under its type with a one-line summary.
> Read this first to find relevant pages for any query.
> Last updated: YYYY-MM-DD | Total pages: N

## Entities
<!-- Alphabetical within section -->

## Concepts

## Comparisons

## Queries
```

**Scaling rule:** When any section exceeds 50 entries, split it into sub-sections
by first letter or sub-domain. When the index exceeds 200 entries total, create
a `_meta/topic-map.md` that groups pages by theme for faster navigation.

### log.md Template

```markdown
# Wiki Log

> Chronological record of all wiki actions. Append-only.
> Format: `## [YYYY-MM-DD] action | subject`
> Actions: ingest, update, query, lint, create, archive, delete
> When this file exceeds 500 entries, rotate: rename to log-YYYY.md, start fresh.

## [YYYY-MM-DD] create | Wiki initialized
- Domain: [domain]
- Structure created with SCHEMA.md, index.md, log.md
```

## Core Operations

### 1. Ingest

When the user provides a source (URL, file, paste), integrate it into the wiki:

① **Classify the source (Step 0 — NEW):**
   Before capturing, determine the source type and quality:
   - **Source type:** Use the Source Classification System in SCHEMA.md.
     Apply auto-classification rules first (URL pattern → content heuristics → manual).
   - **Quality rating:** primary / secondary / tertiary (see SCHEMA.md for definitions).
   - **Record** the classification decision in `_meta/classification.md`.
   - If the user specifies a type or quality, prefer their judgment over auto-classification.

② **Capture the raw source:**
   - URL → use `web_extract` to get markdown, save to the classified subdirectory
   - PDF → use `web_extract` (handles PDFs), save to `raw/papers/`
   - Pasted text → save to the classified subdirectory
   - Name the file descriptively: `raw/<type>/<author-topic-date>.md`
     - Example: `raw/papers/karpathy-llm-wiki-2026.md`
     - Example: `raw/articles/alphago-blog-2025.md`
     - Example: `raw/specs/openai-api-reference-2026.md`
     - Example: `raw/news/anthropic-claude4-release-2026.md`

③ **Discuss takeaways** with the user — what's interesting, what matters for
   the domain. (Skip this in automated/cron contexts — proceed directly.)

④ **Check what already exists** — search index.md and use `search_files` to find
   existing pages for mentioned entities/concepts. This is the difference between
   a growing wiki and a pile of duplicates.

⑤ **Write or update wiki pages:**
   - **New entities/concepts:** Create pages only if they meet the Page Thresholds
     in SCHEMA.md (2+ source mentions, or central to one source)
   - **Existing pages:** Add new information, update facts, bump `updated` date.
     When new info contradicts existing content, follow the Update Policy.
   - **Cross-reference:** Every new or updated page must link to at least 2 other
     pages via `[[wikilinks]]`. Check that existing pages link back.
   - **Tags:** Use hierarchical dotted notation from the taxonomy in SCHEMA.md
     (e.g., `ai.nlp.transformer`). Always include the most specific leaf tag.
   - **Frontmatter:** Set `source_type` and `quality` fields for every page
     derived from this ingest, based on the classification from Step 0.

⑥ **Update navigation:**
   - Add new pages to `index.md` under the correct section, alphabetically
   - Update the "Total pages" count and "Last updated" date in index header
   - Append to `log.md`: `## [YYYY-MM-DD] ingest | Source Title | type: X | quality: Y`
   - List every file created or updated in the log entry

⑦ **Report what changed** — list every file created or updated to the user,
   including the source classification (type + quality).

A single source can trigger updates across 5-15 wiki pages. This is normal
and desired — it's the compounding effect.

### Graphify-to-Wiki migration rule

When a page is created or updated from graph extraction results:
- `graphify_source: true` is optional metadata, not a substitute for llm-wiki frontmatter
- Every migrated page must still carry `quality`, `source_type`, and `domain`
- If graphify output is derived from existing wiki pages rather than raw sources, use conservative provenance and make it explicit in `sources`
- Never create `[[wikilinks]]` from AMBIGUOUS edges without human confirmation; put those under a clearly labeled inference or follow-up section instead

### 2. Query

When the user asks a question about the wiki's domain:

① **Read `index.md`** to identify relevant pages.
② **For wikis with 100+ pages**, also `search_files` across all `.md` files
   for key terms — the index alone may miss relevant content.
③ **Read the relevant pages** using `read_file`.
④ **Synthesize an answer** from the compiled knowledge. Cite the wiki pages
   you drew from: "Based on [[page-a]] and [[page-b]]..."
⑤ **File valuable answers back** — if the answer is a substantial comparison,
   deep dive, or novel synthesis, create a page in `queries/` or `comparisons/`.
   Don't file trivial lookups — only answers that would be painful to re-derive.
⑥ **Update log.md** with the query and whether it was filed.

### 3. Lint

When the user asks to lint, health-check, or audit the wiki:

① **Orphan pages:** Find pages with no inbound `[[wikilinks]]` from other pages.
```python
# Use execute_code for this — programmatic scan across all wiki pages
import os, re
from collections import defaultdict
wiki = "<WIKI_PATH>"
# Scan all .md files in entities/, concepts/, comparisons/, queries/
# Extract all [[wikilinks]] — build inbound link map
# Pages with zero inbound links are orphans
```

② **Broken wikilinks:** Find `[[links]]` that point to pages that don't exist.

③ **Index completeness:** Every wiki page should appear in `index.md`. Compare
   the filesystem against index entries.

④ **Frontmatter validation:** Every wiki page must have all required fields
   (title, created, updated, type, tags, sources, quality, source_type, domain).
   Tags must be in the taxonomy. Hierarchical tags must resolve to valid leaf nodes.

⑤ **Stale content:** Pages whose `updated` date is >90 days older than the most
   recent source that mentions the same entities.

⑥ **Contradictions:** Pages on the same topic with conflicting claims. Look for
   pages that share tags/entities but state different facts.

⑦ **Page size:** Flag pages over 200 lines — candidates for splitting.

⑧ **Tag audit:** List all tags in use, flag any not in the SCHEMA.md taxonomy.
   Check that hierarchical tags use valid paths (e.g., `ai.nlp` exists but
   `nlp` alone would be flagged as a bare tag missing its parent prefix).

⑨ **Classification completeness:** Check that every source in `raw/` has a
   corresponding entry in `_meta/classification.md`. Flag any sources missing
   type or quality ratings.

⑩ **Quality distribution report:** Count sources and pages by quality rating
   (primary / secondary / tertiary). Flag wikis where >50% of sources are
   tertiary — this indicates a need for more authoritative sources.

⑪ **Log rotation:** If log.md exceeds 500 entries, rotate it.

⑫ **Report findings** with specific file paths and suggested actions, grouped by
   severity (broken links > orphans > stale content > missing classification > tag issues).

⑬ **Append to log.md:** `## [YYYY-MM-DD] lint | N issues found`

## Working with the Wiki

### Searching

```bash
# Find pages by content
search_files "transformer" path="$WIKI" file_glob="*.md"

# Find pages by filename
search_files "*.md" target="files" path="$WIKI"

# Find pages by tag
search_files "tags:.*alignment" path="$WIKI" file_glob="*.md"

# Recent activity
read_file "$WIKI/log.md" offset=<last 20 lines>
```

### Bulk Ingest

When ingesting multiple sources at once, batch the updates:
1. Read all sources first
2. Identify all entities and concepts across all sources
3. Check existing pages for all of them (one search pass, not N)
4. Create/update pages in one pass (avoids redundant updates)
5. Update index.md once at the end
6. Write a single log entry covering the batch

### Archiving

When content is fully superseded or the domain scope changes:
1. Create `_archive/` directory if it doesn't exist
2. Move the page to `_archive/` with its original path (e.g., `_archive/entities/old-page.md`)
3. Remove from `index.md`
4. Update any pages that linked to it — replace wikilink with plain text + "(archived)"
5. Log the archive action

### Obsidian Integration

The wiki directory works as an Obsidian vault out of the box:
- `[[wikilinks]]` render as clickable links
- Graph View visualizes the knowledge network
- YAML frontmatter powers Dataview queries
- The `raw/assets/` folder holds images referenced via `![[image.png]]`

For best results:
- Set Obsidian's attachment folder to `raw/assets/`
- Enable "Wikilinks" in Obsidian settings (usually on by default)
- Install Dataview plugin for queries like `TABLE tags FROM "entities" WHERE contains(tags, "company")`

If using the Obsidian skill alongside this one, set `OBSIDIAN_VAULT_PATH` to the
same directory as the wiki path.

### Obsidian Headless (servers and headless machines)

On machines without a display, use `obsidian-headless` instead of the desktop app.
It syncs vaults via Obsidian Sync without a GUI — perfect for agents running on
servers that write to the wiki while Obsidian desktop reads it on another device.

**Setup:**
```bash
# Requires Node.js 22+
npm install -g obsidian-headless

# Login (requires Obsidian account with Sync subscription)
ob login --email <email> --password '<password>'

# Create a remote vault for the wiki
ob sync-create-remote --name "LLM Wiki"

# Connect the wiki directory to the vault
cd ~/wiki
ob sync-setup --vault "<vault-id>"

# Initial sync
ob sync

# Continuous sync (foreground — use systemd for background)
ob sync --continuous
```

**Continuous background sync via systemd:**
```ini
# ~/.config/systemd/user/obsidian-wiki-sync.service
[Unit]
Description=Obsidian LLM Wiki Sync
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/path/to/ob sync --continuous
WorkingDirectory=/home/user/wiki
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now obsidian-wiki-sync
# Enable linger so sync survives logout:
sudo loginctl enable-linger $USER
```

This lets the agent write to `~/wiki` on a server while you browse the same
vault in Obsidian on your laptop/phone — changes appear within seconds.

## Pitfalls

- **Never modify files in `raw/`** — sources are immutable. Corrections go in wiki pages.
- **Always orient first** — read SCHEMA + index + recent log before any operation in a new session.
  Skipping this causes duplicates and missed cross-references.
- **Always update index.md and log.md** — skipping this makes the wiki degrade. These are the
  navigational backbone.
- **Don't create pages for passing mentions** — follow the Page Thresholds in SCHEMA.md. A name
  appearing once in a footnote doesn't warrant an entity page.
- **Don't create pages without cross-references** — isolated pages are invisible. Every page must
  link to at least 2 other pages.
- **Frontmatter is required** — it enables search, filtering, and staleness detection.
- **Tags must come from the taxonomy** — freeform tags decay into noise. Add new tags to SCHEMA.md
  first, then use them.
- **Keep pages scannable** — a wiki page should be readable in 30 seconds. Split pages over
  200 lines. Move detailed analysis to dedicated deep-dive pages.
- **Ask before mass-updating** — if an ingest would touch 10+ existing pages, confirm
  the scope with the user first.
- **Rotate the log** — when log.md exceeds 500 entries, rename it `log-YYYY.md` and start fresh.
  The agent should check log size during lint.
- **Handle contradictions explicitly** — don't silently overwrite. Note both claims with dates,
  mark in frontmatter, flag for user review.

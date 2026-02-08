---
description: "Repo Management Details - scaffold or enrich a CLAUDE.local.md with project context, integrations, and related repos"
allowed-tools: ["Bash", "Read", "Write", "AskUserQuestion", "Glob", "Grep", "ToolSearch"]
---

# Repo-Man: Repo Management Details

Generate or enrich a `CLAUDE.local.md` file for the current repository with project context, integration links, and related repos. This file is globally gitignored and automatically loaded by Claude Code.

## Step 0: Check gitignore

**IMPORTANT: You MUST run the script below. Do NOT replicate its logic with inline commands.**

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/check-gitignore.mjs"
```

Parse the script's output fields: `LOCAL_IGNORED`, `GLOBAL_IGNORED`, `GLOBAL_CONFIGURED`, `GLOBAL_APPEND`.

**If both `LOCAL_IGNORED:false` and `GLOBAL_IGNORED:false`**, ask:

**Question**: "CLAUDE.local.md isn't gitignored. How should we handle it?"
- Header: "Gitignore"
- Options:
  - **"Add to global gitignore (Recommended)"** — Ignores it across all repos on this machine
  - **"Add to project .gitignore"** — Only affects this repo
  - **"I'll handle it"** — Continue without adding

#### If "Add to global gitignore":
- If `GLOBAL_APPEND` is not `NONE`: append `CLAUDE.local.md` to that file
- If `GLOBAL_APPEND` is `NONE` (no global gitignore exists): create `~/.gitignore_global`, add `CLAUDE.local.md` to it, and run `git config --global core.excludesFile ~/.gitignore_global`

#### If "Add to project .gitignore":
- Append `CLAUDE.local.md` to `.gitignore` in the repo root (create the file if it doesn't exist)

**If either `LOCAL_IGNORED:true` or `GLOBAL_IGNORED:true`**, continue silently.

---

## Step 1: Auto-detect repo context

**IMPORTANT: You MUST run the script below. Do NOT replicate its logic with inline commands.**

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-repo.mjs"
```

Parse the script's output fields: `REMOTE`, `BASENAME`, `ROOT`, `BRANCH`, `LOCAL_MD`, `CLAUDE_FILES`, `MANIFESTS`.

Then read **all** `CLAUDE*.md` files listed in the `CLAUDE_FILES` output (e.g. `CLAUDE.md`, `CLAUDE.local.md`, `CLAUDE.toml.md`, etc.) for project context. These files contain existing instructions, conventions, and project knowledge that should inform the generated `CLAUDE.local.md` — extract project description, tech stack, conventions, related repos, and any other relevant details from them.

---

## Step 2: Branch — New file vs Existing file

Check whether `CLAUDE.local.md` already exists. Follow the appropriate branch:

### Branch A: CLAUDE.local.md EXISTS → Enrich mode

Read the existing `CLAUDE.local.md` and analyze it:

1. **Identify what's present** — which sections exist and have content
2. **Identify blanks** — look for `TODO` markers, empty sections, or missing sections from the full template (Project, Integrations, Related Repos, Additional Context)
3. **Check for stored context** that could fill gaps (see Step 2A below)

Then present the user with options:

**Question**: "CLAUDE.local.md exists. What would you like to do?"
- Header: "Mode"
- multiSelect: false
- Options:
  - **"Fill in blanks"** — Complete TODOs and missing sections interactively
  - **"Learn from context"** — Read stored Claude context to auto-enrich the file
  - **"Add new info"** — Add more integrations, repos, or context to existing file
  - **"Start fresh"** — Overwrite and re-scaffold from scratch

#### If "Fill in blanks":
- For each TODO or missing section, prompt the user with the relevant question from Step 3 below
- Preserve all existing content — only fill gaps
- Use Edit tool to update in place (don't rewrite the whole file)

#### If "Learn from context":
Follow **Step 2A: Context discovery** below. After gathering context, show the user what was found and ask for confirmation before updating the file.

#### If "Add new info":
Show which integrations/sections are already configured, then jump to the relevant Step 3 questions but only for unconfigured items.

#### If "Start fresh":
Continue to **Branch B** below.

### Step 2A: Context discovery

Search for stored context about this project. Use the repo name and path to find matches.

**IMPORTANT: You MUST run the script below. Do NOT replicate its logic with inline commands.**

Use the `BASENAME` and `ROOT` values from Step 1's detect-repo.sh output:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/discover-context.mjs" "<ROOT>" "<REPO_NAME>"
```

Parse the script's output fields: `CLAUDE_MEMORY`, `MACRODATA_ENTITY`, `MACRODATA_WORKSPACE`, `MACRODATA_TODAY`, `CLAUDE_LOCAL_FILES`.

For each field that is not `NONE`, read the file to extract relevant context. These sources contain:
- **CLAUDE_MEMORY** — Accumulated learnings about the project from Claude Code auto memory
- **MACRODATA_ENTITY** — Structured project knowledge from macrodata
- **MACRODATA_WORKSPACE** / **MACRODATA_TODAY** — Current workspace status and session context
- **CLAUDE_LOCAL_FILES** — Existing plugin-specific config files

Additionally, if the `search_memory` MCP tool is available (use ToolSearch to check), search for journal entries mentioning the repo name.

**After gathering context:**

Present findings to the user:

```
Found context from {N} sources:
- Claude memory: {summary of what was found, or "no project memory"}
- Macrodata entity: {summary, or "no entity file"}
- Macrodata workspace: {relevant mentions, or "not mentioned"}
- Macrodata journal: {N entries found, or "no entries"}
- Project .claude/: {list of files, or "none"}
```

Then show specific suggestions for what could be added/updated in CLAUDE.local.md based on the discovered context:

**Question**: "I found the following details from your stored context. Which should I add to CLAUDE.local.md?"
- Header: "Enrich"
- multiSelect: true
- Options: (up to 4 most relevant findings, e.g.):
  - A discovered project description
  - Related repos mentioned in context
  - Integration URLs found in context
  - Project status or key context notes

Apply selected enrichments to the existing file.

---

### Branch B: No CLAUDE.local.md → New file mode

Continue to Step 3 for full interactive scaffolding.

## Step 3: Prompt for project details (new file or filling blanks)

Use AskUserQuestion for each category. Pre-fill detected values where possible. Skip questions where the answer is already clear from auto-detection.

### 3a: Project basics (if not fully auto-detected)

If the GitHub URL was auto-detected, confirm it. Otherwise ask:

**Question**: "What is the GitHub repo URL for this project?"
- Header: "GitHub"
- Options based on what was detected (e.g. the remote URL, or "Enter manually")

### 3b: Project description

**Question**: "Brief description of this project's purpose?"
- Header: "Description"
- If CLAUDE.md or README.md exists, offer a summary extracted from it as the first option
- If macrodata entity or memory has a description, offer that too
- Options: extracted summary, "Enter custom description"

### 3c: Integrations

Present a single multi-select question for all available integrations. This avoids asking about each one individually.

**Question**: "Which integrations should Claude know about for this repo?"
- Header: "Integrations"
- multiSelect: true
- Options (always show all 4, user picks which apply):
  - **"Notion"** — Documentation page, wiki, or knowledge base
  - **"Asana"** — Task tracking and project management
  - **"Linear"** — Issue tracking and project management
  - **"GitHub Projects"** — GitHub project board for this repo

**Then, for each selected integration, ask a follow-up question to get the details:**

#### Notion (if selected)
**Question**: "What's the Notion page URL for this project?"
- Header: "Notion URL"
- Options:
  - "Enter URL" (user provides via Other)
  - "I'll find it later"

#### Asana (if selected)
**Question**: "What's the Asana project URL or name?"
- Header: "Asana URL"
- Options:
  - "Enter URL or project name" (user provides via Other)
  - "I'll find it later"

#### Linear (if selected)
**Question**: "What's the Linear team/project identifier?"
- Header: "Linear ID"
- Options:
  - "Enter team key or project URL" (user provides via Other)
  - "I'll find it later"

#### GitHub Projects (if selected)
**Question**: "What's the GitHub Projects board URL or number?"
- Header: "GH Project"
- Options:
  - "Enter project URL or number" (user provides via Other)
  - "I'll find it later"

### 3d: Collaboration & ops tools

**Question**: "Any other tools or services linked to this project?"
- Header: "Services"
- multiSelect: true
- Options:
  - **"Slack"** — Channel or workspace for project discussion
  - **"Sentry"** — Error tracking and monitoring
  - **"Vercel"** — Deployment and hosting
  - **"Skip"** — No additional services

**Then, for each selected service, ask a follow-up:**

#### Slack (if selected)
**Question**: "What Slack channel is used for this project?"
- Header: "Slack"
- Options:
  - "Enter channel name" (user provides via Other, e.g. #project-name)
  - "I'll find it later"

#### Sentry (if selected)
**Question**: "What's the Sentry project slug or URL?"
- Header: "Sentry"
- Options:
  - "Enter Sentry project identifier" (user provides via Other)
  - "I'll find it later"

#### Vercel (if selected)
**Question**: "What's the Vercel project name or URL?"
- Header: "Vercel"
- Options:
  - "Enter Vercel project identifier" (user provides via Other)
  - "I'll find it later"

### 3e: Related repositories

**Question**: "Are there related repos Claude should know about?"
- Header: "Related"
- multiSelect: false
- Options:
  - "Enter related repo URLs/names"
  - "Skip - no related repos"

If the user chooses to enter related repos, ask them to provide a comma-separated list or one per line.

### 3f: Additional context

**Question**: "Any additional context for Claude when working in this repo?"
- Header: "Context"
- Options:
  - "Enter additional context"
  - "Skip - no additional context"

This could include things like: deployment targets, key contacts, coding conventions beyond CLAUDE.md, known gotchas, preferred tools, etc.

## Step 4: Generate CLAUDE.local.md

Using all gathered information, generate a well-structured `CLAUDE.local.md` file at the repo root.

**Template structure:**

```markdown
# Repo Management Details

## Project
- **Name:** {detected or provided name}
- **GitHub:** {repo URL}
- **Description:** {description}
- **Type:** {detected from manifest files - e.g. Node.js, Python, .NET, etc.}

## Integrations
{Only include subsections for integrations the user actually configured}

### Notion
- **Page:** {URL}

### Asana
- **Project:** {URL or name}

### Linear
- **Project:** {team key, project URL, or identifier}

### GitHub Projects
- **Board:** {URL or number}

### Slack
- **Channel:** {channel name}

### Sentry
- **Project:** {slug or URL}

### Vercel
- **Project:** {name or URL}

## Related Repos
{List of related repos as bullet points}

## Additional Context
{Any extra context provided}
```

**Important rules for generation:**
- Omit sections entirely if the user skipped them (don't leave empty sections or placeholders)
- Keep it clean and minimal — this file is loaded into every Claude conversation in this repo
- Use markdown links where URLs are provided
- If the project type was detected, include it
- For "I'll find it later" responses, include the integration header with a `TODO: add URL` note so the user can fill it in later
- When enriching an existing file, preserve all existing content and only add/update changed sections

## Step 5: Write and confirm

1. For new files: Use the Write tool to create `CLAUDE.local.md` at the repo root
2. For updates: Use the Edit tool to modify specific sections in place
3. Read back the file to confirm it was written correctly
4. Show the user a summary:

**For new files:**
```
Created CLAUDE.local.md with:
- Project: {name} ({type})
- GitHub: {url}
- Integrations: {comma-separated list of configured ones}
- Related repos: {count or "none"}
- Additional context: {yes/no}

This file is globally gitignored and will be loaded automatically by Claude Code.
```

**For updates:**
```
Updated CLAUDE.local.md:
- Added: {list of new sections/fields}
- Updated: {list of changed sections/fields}
- Unchanged: {count} existing sections preserved

{count} TODOs remaining.
```

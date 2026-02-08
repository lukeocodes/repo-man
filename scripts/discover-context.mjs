#!/usr/bin/env node
// Discover stored context about the current project from various sources
import { readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const repoRoot = process.argv[2];
const repoName = process.argv[3];

if (!repoRoot || !repoName) {
  console.error('Usage: discover-context.mjs <repo-root> <repo-name>');
  process.exit(1);
}

const home = homedir();

// --- Claude Code auto memory ---
// Path pattern: absolute path with / replaced by - (and leading -)
const memoryDirPattern = repoRoot.replace(/\\/g, '/').replace(/\//g, '-');
const projectsDir = join(home, '.claude', 'projects');
let memoryFile = 'NONE';

if (existsSync(projectsDir)) {
  try {
    const dirs = readdirSync(projectsDir);
    for (const dir of dirs) {
      if (dir.includes(memoryDirPattern)) {
        const candidate = join(projectsDir, dir, 'memory', 'MEMORY.md');
        if (existsSync(candidate)) {
          memoryFile = candidate;
          break;
        }
      }
    }
  } catch {
    // silent
  }
}
console.log(`CLAUDE_MEMORY:${memoryFile}`);

// --- Macrodata entity files ---
const entityDir = join(home, '.config', 'macrodata', 'entities', 'projects');
let entityFile = 'NONE';

if (existsSync(entityDir)) {
  try {
    const files = readdirSync(entityDir).filter(f => f.endsWith('.md'));
    const nameLower = repoName.toLowerCase();
    for (const f of files) {
      const fnameLower = basename(f, '.md').toLowerCase();
      if (nameLower.includes(fnameLower) || fnameLower.includes(nameLower)) {
        entityFile = join(entityDir, f);
        break;
      }
    }
  } catch {
    // silent
  }
}
console.log(`MACRODATA_ENTITY:${entityFile}`);

// --- Macrodata state files ---
const workspaceFile = join(home, '.config', 'macrodata', 'state', 'workspace.md');
const todayFile = join(home, '.config', 'macrodata', 'state', 'today.md');
console.log(`MACRODATA_WORKSPACE:${existsSync(workspaceFile) ? workspaceFile : 'NONE'}`);
console.log(`MACRODATA_TODAY:${existsSync(todayFile) ? todayFile : 'NONE'}`);

// --- Project .claude/ local files ---
console.log('CLAUDE_LOCAL_FILES:');
const claudeDir = join(repoRoot, '.claude');
if (existsSync(claudeDir)) {
  try {
    const files = readdirSync(claudeDir).filter(f => f.endsWith('.local.md'));
    for (const f of files) {
      console.log(join(claudeDir, f));
    }
  } catch {
    // silent
  }
}

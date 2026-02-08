#!/usr/bin/env node
// Check if CLAUDE.local.md is gitignored (locally and globally)
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const home = homedir();

function fileContains(filePath, needle) {
  try {
    return readFileSync(filePath, 'utf8').includes(needle);
  } catch {
    return false;
  }
}

function resolveTilde(p) {
  if (p.startsWith('~/')) return join(home, p.slice(2));
  if (p === '~') return home;
  return p;
}

// --- Local check ---
const localIgnored = fileContains('.gitignore', 'CLAUDE.local.md');

// --- Global check ---
let globalIgnored = false;
let globalPath = '';

let configured = '';
try {
  configured = execFileSync('git', ['config', '--global', 'core.excludesFile'], { encoding: 'utf8' }).trim();
  configured = resolveTilde(configured);
} catch {
  // not configured
}

const xdgDefault = join(home, '.config', 'git', 'ignore');
const commonGlobal = join(home, '.gitignore_global');

// Check configured path first
if (configured && fileContains(configured, 'CLAUDE.local.md')) {
  globalIgnored = true;
  globalPath = configured;
}

// Check XDG default
if (!globalIgnored && fileContains(xdgDefault, 'CLAUDE.local.md')) {
  globalIgnored = true;
  globalPath = xdgDefault;
}

// Check common convention
if (!globalIgnored && fileContains(commonGlobal, 'CLAUDE.local.md')) {
  globalIgnored = true;
  globalPath = commonGlobal;
}

// --- Determine best global file to append to ---
// Priority: configured > existing XDG > existing common > NONE (needs setup)
let globalAppend = '';
if (configured) {
  globalAppend = configured;
} else if (existsSync(xdgDefault)) {
  globalAppend = xdgDefault;
} else if (existsSync(commonGlobal)) {
  globalAppend = commonGlobal;
}

// --- Output ---
console.log(`LOCAL_IGNORED:${localIgnored}`);
console.log(`GLOBAL_IGNORED:${globalIgnored}`);
console.log(`GLOBAL_PATH:${globalPath || 'NONE'}`);
console.log(`GLOBAL_CONFIGURED:${configured || 'NONE'}`);
console.log(`GLOBAL_APPEND:${globalAppend || 'NONE'}`);

#!/usr/bin/env node
// Auto-detect repo context for repo-man plugin
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { basename } from 'node:path';

function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const remote = git('remote', 'get-url', 'origin') || 'none';
const root = git('rev-parse', '--show-toplevel');
const repoName = root ? basename(root) : '';
const branch = git('branch', '--show-current');

console.log(`REMOTE:${remote}`);
console.log(`BASENAME:${repoName}`);
console.log(`ROOT:${root}`);
console.log(`BRANCH:${branch}`);

// Check for CLAUDE.local.md
let entries;
try {
  entries = readdirSync('.');
} catch {
  entries = [];
}

console.log(entries.includes('CLAUDE.local.md') ? 'LOCAL_MD:EXISTS' : 'LOCAL_MD:NOT_FOUND');

// Find CLAUDE*.md files
console.log('CLAUDE_FILES:');
for (const f of entries) {
  if (f.startsWith('CLAUDE') && f.endsWith('.md')) {
    console.log(`./${f}`);
  }
}

// Find manifest files
const manifestPatterns = [
  'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'Makefile', 'deepgram.toml'
];
const manifestExtensions = ['.csproj', '.sln'];

console.log('MANIFESTS:');
for (const f of entries) {
  if (manifestPatterns.includes(f) || manifestExtensions.some(ext => f.endsWith(ext))) {
    console.log(`./${f}`);
  }
}

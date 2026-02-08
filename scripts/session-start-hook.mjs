#!/usr/bin/env node
// SessionStart hook: nudge CLAUDE.local.md scaffolding or report TODOs
import { existsSync, readFileSync } from 'node:fs';

let context = '';

if (!existsSync('CLAUDE.local.md')) {
  context = 'No CLAUDE.local.md found in this repo. Run /repo-man to scaffold one with project context, integrations, and related repos.';
} else {
  try {
    const content = readFileSync('CLAUDE.local.md', 'utf8');
    const todos = content.match(/TODO/g);
    if (todos && todos.length > 0) {
      context = `CLAUDE.local.md has ${todos.length} TODO${todos.length > 1 ? 's' : ''} remaining. Run /repo-man to fill them in.`;
    }
  } catch {
    // silent — don't break the hook
  }
}

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: context
  }
};

console.log(JSON.stringify(output));

import fs from 'fs';
import path from 'path';

import type { Runtime } from './runtime-paths.js';

export interface ParsedFrontmatter {
  raw: string;
  fields: Record<string, string>;
  body: string;
}

function extractFrontmatterAndBody(content: string): ParsedFrontmatter {
  if (!content.startsWith('---')) {
    return { raw: '', fields: {}, body: content };
  }
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return { raw: '', fields: {}, body: content };
  }

  const frontmatterRaw = content.substring(3, endIndex).trim();
  const body = content.substring(endIndex + 3);
  const fields: Record<string, string> = {};
  for (const line of frontmatterRaw.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    fields[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return { raw: frontmatterRaw, fields, body };
}

function yamlQuote(value: string): string {
  return JSON.stringify(value);
}

function toolsFromFrontmatter(fields: Record<string, string>): string[] {
  const raw = fields.tools ?? fields['allowed-tools'] ?? '';
  if (!raw) return [];
  // comma-separated list
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

const claudeToGeminiTools: Record<string, string> = {
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'replace',
  Bash: 'run_shell_command',
  Glob: 'glob',
  Grep: 'search_file_content',
  SemanticSearch: 'search_file_content',
  WebSearch: 'google_web_search',
  WebFetch: 'web_fetch',
  TodoWrite: 'write_todos',
};

const claudeToCopilotTools: Record<string, string> = {
  Read: 'read',
  Write: 'edit',
  Edit: 'edit',
  Bash: 'execute',
  Grep: 'search',
  Glob: 'search',
  SemanticSearch: 'search',
  WebSearch: 'web',
  WebFetch: 'web',
  TodoWrite: 'todo',
};

const claudeToOpencodeTools: Record<string, string> = {
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Bash: 'bash',
  Grep: 'grep',
  Glob: 'glob',
  SemanticSearch: 'semanticsearch',
  WebSearch: 'websearch',
  WebFetch: 'webfetch',
  TodoWrite: 'todowrite',
};

function mapToolList(tools: string[], mapping: Record<string, string>, { dropUnknown = false } = {}): string[] {
  const out: string[] = [];
  for (const t of tools) {
    if (mapping[t]) out.push(mapping[t]);
    else if (!dropUnknown) out.push(t);
  }
  return [...new Set(out)];
}

export interface ConvertedAgent {
  filename: string;
  content: string;
  name: string;
  description: string;
}

export function convertAgentMarkdownForRuntime(content: string, runtime: Runtime): ConvertedAgent {
  const parsed = extractFrontmatterAndBody(content);
  const name = parsed.fields.name ?? 'unknown';
  const description = parsed.fields.description ?? '';
  const tools = toolsFromFrontmatter(parsed.fields);

  // Base: keep body as-is (it is fms-authored).
  const body = parsed.body.trimStart();

  if (runtime === 'copilot') {
    const mapped = mapToolList(tools, claudeToCopilotTools);
    const toolsArray = mapped.length > 0 ? `['${mapped.join(`', '`)}']` : '[]';
    const fm =
      `---\n` +
      `name: ${name}\n` +
      `description: ${description}\n` +
      `tools: ${toolsArray}\n` +
      `---\n`;
    return { filename: `${name}.agent.md`, content: fm + '\n' + body, name, description };
  }

  if (runtime === 'gemini' || runtime === 'antigravity') {
    // Gemini requires tools as YAML array of supported built-ins; drop unknown tools.
    const mapped = mapToolList(tools, claudeToGeminiTools, { dropUnknown: true });
    const fmLines: string[] = [
      '---',
      `name: ${name}`,
      `description: ${description}`,
    ];
    if (mapped.length > 0) {
      fmLines.push('tools:');
      for (const t of mapped) fmLines.push(` - ${t}`);
    }
    fmLines.push('---');
    return { filename: `${name}.md`, content: fmLines.join('\n') + '\n\n' + body, name, description };
  }

  if (runtime === 'opencode') {
    // Keep name/description; OpenCode agents often require model/mode fields.
    // Tools are frequently not supported/ignored in agent frontmatter; keep minimal.
    const fm =
      `---\n` +
      `name: ${name}\n` +
      `description: ${description}\n` +
      `model: inherit\n` +
      `mode: subagent\n` +
      `---\n`;
    return { filename: `${name}.md`, content: fm + '\n' + body, name, description };
  }

  if (runtime === 'cursor' || runtime === 'claude' || runtime === 'codex') {
    // Claude/Cursor-style: keep tools as comma-separated list.
    const mapped = runtime === 'claude' || runtime === 'cursor' || runtime === 'codex' ? tools : mapToolList(tools, claudeToOpencodeTools);
    const toolsLine = mapped.length > 0 ? `tools: ${mapped.join(', ')}` : '';
    const fm =
      `---\n` +
      `name: ${name}\n` +
      `description: ${description}\n` +
      (toolsLine ? `${toolsLine}\n` : '') +
      `---\n`;
    return { filename: `${name}.md`, content: fm + '\n' + body, name, description };
  }

  // Fallback
  return {
    filename: `${name}.md`,
    content,
    name,
    description,
  };
}

export function listCoreAgentFiles(coreAgentsDir: string): string[] {
  if (!fs.existsSync(coreAgentsDir)) return [];
  return fs
    .readdirSync(coreAgentsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(coreAgentsDir, f))
    .sort();
}

// -----------------------------
// Codex helpers
// -----------------------------

const CODEX_MARKER = '# FMS Agent Configuration — managed by fix-my-shit installer';

const CODEX_SANDBOX: Record<string, string> = {
  'fms-executor': 'workspace-write',
  'fms-planner': 'workspace-write',
  'fms-phase-researcher': 'workspace-write',
  'fms-plan-checker': 'read-only',
  'fms-codebase-mapper': 'workspace-write',
  'fms-debugger': 'workspace-write',
  'fms-verifier': 'read-only',
};

export function generateCodexAgentToml(agentName: string, agentMarkdown: string): string {
  // In Codex toml, we store the developer instructions as the markdown body.
  const parsed = extractFrontmatterAndBody(agentMarkdown);
  const sandboxMode = CODEX_SANDBOX[agentName] ?? 'read-only';
  const instructions = parsed.body.trim();
  return [
    `sandbox_mode = ${yamlQuote(sandboxMode)}`,
    `developer_instructions = '''`,
    instructions,
    `'''`,
    '',
  ].join('\n');
}

export function mergeCodexConfigToml(existing: string | null, agents: Array<{ name: string; description: string }>): string {
  const blockLines: string[] = [CODEX_MARKER, ''];
  for (const a of agents) {
    blockLines.push(`[agents.${a.name}]`);
    blockLines.push(`description = ${yamlQuote(a.description)}`);
    blockLines.push(`config_file = ${yamlQuote(`agents/${a.name}.toml`)}`);
    blockLines.push('');
  }
  const block = blockLines.join('\n');

  if (!existing || existing.trim().length === 0) {
    return block + '\n';
  }

  const idx = existing.indexOf(CODEX_MARKER);
  if (idx !== -1) {
    const before = existing.substring(0, idx).trimEnd();
    return (before ? before + '\n\n' : '') + block + '\n';
  }

  return existing.trimEnd() + '\n\n' + block + '\n';
}

export function getCodexConfigMarker(): string {
  return CODEX_MARKER;
}


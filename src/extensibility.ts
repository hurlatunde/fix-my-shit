import fs from 'fs';
import path from 'path';

function listRelativeFiles(fmsRoot: string, subdir: string): string[] {
  const dir = path.join(fmsRoot, subdir);
  try {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir);
    const files: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry);
      try {
        const stat = fs.statSync(full);
        if (stat.isFile()) {
          files.push(path.join(subdir, entry));
        }
      } catch {
        // ignore individual entry errors
      }
    }
    return files.sort();
  } catch {
    return [];
  }
}

export function listTemplates(fmsRoot: string): string[] {
  return listRelativeFiles(fmsRoot, 'templates');
}

export function listAgents(fmsRoot: string): string[] {
  return listRelativeFiles(fmsRoot, 'agents');
}

export function listWorkflows(fmsRoot: string): string[] {
  return listRelativeFiles(fmsRoot, 'workflows');
}


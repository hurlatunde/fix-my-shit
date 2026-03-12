import path from 'path';

/**
 * Directory and file layout for a new fms install (per PRD).
 * Installer creates these under the chosen fms root.
 */
export const FMS_DIRS = [
  'hooks',
  'agents',
  'templates',
  'phases',
  'quick',
  'workflows',
  'commands',
  'research',
] as const;

export const FMS_FILES = [
  'VERSION',
  'package.json',
  'fms-file-manifest.json',
  'state.json',
] as const;

/** Paths to create (relative to fms root). Directories first, then files. */
export function getFmsStructure(): { dirs: string[]; files: string[] } {
  return {
    dirs: [...FMS_DIRS],
    files: [...FMS_FILES],
  };
}

/** Build the full list of created paths for the manifest (INST-05). */
export function getManifestPaths(fmsRoot: string, created: string[]): string[] {
  return created.map((p) => path.relative(fmsRoot, p)).sort();
}

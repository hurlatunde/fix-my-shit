import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { detectDrift, readMeta, writeMeta, getFocusDocuments, type FocusArea } from '../rag/meta.js';
import { isEmbeddingAvailable } from '../rag/embedder.js';
import { buildIndex, writeIndex } from '../rag/indexer.js';

export async function runRefreshCodebase(codebaseDir: string): Promise<void> {
  if (!fs.existsSync(codebaseDir)) {
    console.log(
      chalk.yellow('No codebase/ directory found.'),
      'Run the map-codebase workflow first.'
    );
    return;
  }

  const meta = readMeta(codebaseDir);
  if (!meta) {
    console.log(chalk.yellow('No codebase/meta.json found.'));
    console.log('Run `fms index-codebase` or the map-codebase workflow to create it.');
    console.log('Without meta.json, a full refresh is recommended — re-run map-codebase.');
    return;
  }

  const drift = detectDrift(codebaseDir);

  console.log(chalk.cyan('[fms]'), 'Codebase drift analysis\n');
  console.log(chalk.gray(`  Last mapped: ${meta.mappedAt}`));
  if (meta.gitCommit) {
    console.log(chalk.gray(`  Git commit:  ${meta.gitCommit.slice(0, 8)}`));
  }

  if (!drift.hasDrift) {
    console.log(chalk.green('\n  No drift detected.'), 'Codebase documents are up to date.');
    return;
  }

  console.log(chalk.yellow('\n  Drift detected.'));

  if (drift.isGitRepo && drift.changedFiles.length > 0) {
    console.log(chalk.gray(`  ${drift.commitsBehind} commit(s) since last mapping`));
    console.log(chalk.gray(`  ${drift.changedFiles.length} file(s) changed:\n`));

    const displayFiles = drift.changedFiles.slice(0, 15);
    for (const f of displayFiles) {
      console.log(chalk.gray(`    ${f}`));
    }
    if (drift.changedFiles.length > 15) {
      console.log(chalk.gray(`    ... and ${drift.changedFiles.length - 15} more`));
    }
  } else if (!drift.isGitRepo) {
    console.log(chalk.gray('  Not a git repo — drift detected by age (>24h since mapping).'));
  }

  console.log();
  console.log(chalk.white('  Affected focus areas:'));
  for (const area of drift.affectedFocusAreas) {
    const docs = getFocusDocuments(area);
    console.log(chalk.cyan(`    ${area}`), chalk.gray(`→ ${docs.join(', ')}`));
  }

  console.log();
  console.log(chalk.white('  To refresh, re-run the map-codebase workflow with these focus areas.'));
  console.log(chalk.white('  The workflow agents will re-analyze the codebase and update documents.\n'));

  console.log('  Options:');
  console.log(chalk.cyan('    map-codebase'), '       — Re-run full codebase mapping');
  console.log(chalk.cyan('    fms index-codebase'), '— Rebuild RAG index from existing documents\n');

  const available = await isEmbeddingAvailable();
  if (available) {
    const mdFiles = fs.readdirSync(codebaseDir).filter((f) => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      console.log(chalk.gray('  Rebuilding RAG index from current documents...'));
      const index = await buildIndex(codebaseDir);
      const outputPath = path.join(codebaseDir, 'index.json');
      writeIndex(index, outputPath);
      writeMeta(codebaseDir);
      console.log(
        chalk.green('  ✓'),
        `Re-indexed ${index.chunks.length} chunks from ${mdFiles.length} documents`
      );
    }
  }

  console.log();
  console.log(
    chalk.yellow('Note:'),
    'The RAG index is rebuilt from existing documents, but the documents themselves',
  );
  console.log(
    '  may be stale. Re-run the map-codebase workflow to fully refresh the analysis.'
  );
}

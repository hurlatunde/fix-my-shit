import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { isEmbeddingAvailable, getModelId, getEmbeddingDim } from '../rag/embedder.js';
import { buildIndex, writeIndex } from '../rag/indexer.js';
import { writeMeta } from '../rag/meta.js';

export async function runIndexCodebase(codebaseDir: string): Promise<void> {
  if (!fs.existsSync(codebaseDir)) {
    console.log(
      chalk.yellow('No codebase/ directory found.'),
      'Run the map-codebase workflow first to generate codebase analysis documents.'
    );
    return;
  }

  const mdFiles = fs.readdirSync(codebaseDir).filter((f) => f.endsWith('.md'));
  if (mdFiles.length === 0) {
    console.log(chalk.yellow('No markdown files in codebase/. Nothing to index.'));
    return;
  }

  const available = await isEmbeddingAvailable();
  if (!available) {
    console.log(chalk.yellow('Embedding library not installed.'));
    console.log('Install one of the following to enable RAG indexing:\n');
    console.log('  npm install @huggingface/transformers');
    console.log('  npm install @xenova/transformers');
    return;
  }

  console.log(chalk.cyan('[fms]'), `Indexing ${mdFiles.length} documents from codebase/...`);
  console.log(chalk.gray(`  Model: ${getModelId()} (${getEmbeddingDim()}-dim vectors)`));

  const index = await buildIndex(codebaseDir);

  const outputPath = path.join(codebaseDir, 'index.json');
  writeIndex(index, outputPath);

  writeMeta(codebaseDir);

  console.log(
    chalk.green('  ✓'),
    `Indexed ${index.chunks.length} chunks from ${mdFiles.length} documents`
  );
  console.log(chalk.gray(`  Written to ${outputPath}`));
  console.log();
  console.log('Query the index with:');
  console.log(chalk.cyan('  fms query "your question here"'));
}

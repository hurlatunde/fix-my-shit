import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { isEmbeddingAvailable } from '../rag/embedder.js';
import { queryIndex } from '../rag/query.js';

export async function runQueryCodebase(codebaseDir: string, question: string): Promise<void> {
  const indexPath = path.join(codebaseDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    console.log(chalk.yellow('No codebase/index.json found.'));
    if (fs.existsSync(codebaseDir)) {
      console.log('Run `fms index-codebase` to build the RAG index from your codebase documents.');
    } else {
      console.log('Run the map-codebase workflow first, then `fms index-codebase`.');
    }
    return;
  }

  const available = await isEmbeddingAvailable();
  if (!available) {
    console.log(chalk.yellow('Embedding library not installed.'));
    console.log('Install one of the following:\n');
    console.log('  npm install @huggingface/transformers');
    console.log('  npm install @xenova/transformers');
    return;
  }

  console.log(chalk.cyan('[fms]'), `Querying: "${question}"\n`);

  const results = await queryIndex(indexPath, question, 5, 0.3);

  if (results.length === 0) {
    console.log(chalk.yellow('No relevant results found above threshold (0.3).'));
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const scoreStr = r.score.toFixed(2);
    const sourceFile = path.basename(r.source);
    const preview = r.content.split('\n').filter((l) => l.trim()).slice(0, 3).join('\n    ');

    console.log(
      chalk.green(`${i + 1}.`),
      chalk.gray(`[${scoreStr}]`),
      chalk.cyan(sourceFile),
      chalk.white(`> ${r.section}`)
    );
    console.log(chalk.gray(`    ${preview}`));
    console.log();
  }
}

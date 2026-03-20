import fs from 'fs';
import path from 'path';

import { embed, getModelId } from './embedder.js';

export interface Chunk {
  id: string;
  source: string;
  section: string;
  content: string;
  embedding: number[];
}

export interface RAGIndex {
  version: 1 | 2;
  model: string;
  created: string;
  chunks: Chunk[];
}

interface RawChunk {
  id: string;
  source: string;
  section: string;
  content: string;
}

export function chunkMarkdownByH2(filePath: string): RawChunk[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const lines = content.split('\n');
  const chunks: RawChunk[] = [];

  let currentSection = 'intro';
  let currentLines: string[] = [];
  let chunkIndex = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLines.length > 0) {
        const text = currentLines.join('\n').trim();
        if (text.length > 20) {
          chunks.push({
            id: `${fileName}:${slugify(currentSection)}:${chunkIndex}`,
            source: filePath,
            section: currentSection,
            content: text,
          });
          chunkIndex++;
        }
      }
      currentSection = line.replace(/^##\s+/, '').trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const text = currentLines.join('\n').trim();
    if (text.length > 20) {
      chunks.push({
        id: `${fileName}:${slugify(currentSection)}:${chunkIndex}`,
        source: filePath,
        section: currentSection,
        content: text,
      });
    }
  }

  return chunks;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export async function buildIndex(codebaseDir: string): Promise<RAGIndex> {
  const files = fs.readdirSync(codebaseDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(codebaseDir, f))
    .sort();

  const allRawChunks: RawChunk[] = [];
  for (const file of files) {
    const chunks = chunkMarkdownByH2(file);
    allRawChunks.push(...chunks);
  }

  const embeddedChunks: Chunk[] = [];
  for (let i = 0; i < allRawChunks.length; i++) {
    const raw = allRawChunks[i];
    const truncated = raw.content.slice(0, 6000);
    const embedding = await embed(truncated, 'search_document');
    embeddedChunks.push({ ...raw, embedding });

    if ((i + 1) % 10 === 0 || i === allRawChunks.length - 1) {
      process.stdout.write(`\r  Embedding chunks: ${i + 1}/${allRawChunks.length}`);
    }
  }
  process.stdout.write('\n');

  return {
    version: 2,
    model: getModelId(),
    created: new Date().toISOString(),
    chunks: embeddedChunks,
  };
}

export function writeIndex(index: RAGIndex, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(index), 'utf-8');
}

export function readIndex(indexPath: string): RAGIndex {
  const raw = fs.readFileSync(indexPath, 'utf-8');
  return JSON.parse(raw) as RAGIndex;
}

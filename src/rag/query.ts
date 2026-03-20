import { embed, cosineSimilarity } from './embedder.js';
import { readIndex } from './indexer.js';

export interface SearchResult {
  id: string;
  source: string;
  section: string;
  content: string;
  score: number;
}

export async function queryIndex(
  indexPath: string,
  query: string,
  topK = 5,
  threshold = 0.3,
): Promise<SearchResult[]> {
  const index = readIndex(indexPath);

  if (index.version < 2) {
    throw new Error(
      'RAG index was built with an older model (version ' + index.version + ').\n' +
      'Re-run `fms index-codebase` to rebuild with the current model.'
    );
  }

  const queryEmbedding = await embed(query, 'search_query');

  const scored: SearchResult[] = index.chunks.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    section: chunk.section,
    content: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((r) => r.score >= threshold)
    .slice(0, topK);
}

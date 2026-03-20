const MODEL_ID = 'Xenova/nomic-embed-text-v1';
const EMBEDDING_DIM = 768;

export type EmbedTask = 'search_document' | 'search_query' | 'clustering' | 'classification';

let pipelineInstance: any = null;

async function loadTransformers(): Promise<any> {
  const candidates: string[] = ['@huggingface/transformers', '@xenova/transformers'];
  for (const pkg of candidates) {
    try {
      const mod = await (Function('p', 'return import(p)')(pkg) as Promise<any>);
      return mod;
    } catch {
      continue;
    }
  }
  return null;
}

export async function isEmbeddingAvailable(): Promise<boolean> {
  const mod = await loadTransformers();
  return mod !== null;
}

async function getExtractor(): Promise<any> {
  if (pipelineInstance) return pipelineInstance;

  const transformers = await loadTransformers();
  if (!transformers) {
    throw new Error(
      'Embedding library not found. Install one of:\n' +
      '  npm install @huggingface/transformers\n' +
      '  npm install @xenova/transformers'
    );
  }

  pipelineInstance = await transformers.pipeline(
    'feature-extraction',
    MODEL_ID,
    { dtype: 'fp32' }
  );
  return pipelineInstance;
}

export async function embed(text: string, task: EmbedTask = 'search_document'): Promise<number[]> {
  const extractor = await getExtractor();
  const prefixed = `${task}: ${text}`;
  const output = await extractor(prefixed, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function embedBatch(texts: string[], task: EmbedTask = 'search_document'): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embed(text, task));
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getModelId(): string {
  return MODEL_ID;
}

export function getEmbeddingDim(): number {
  return EMBEDDING_DIM;
}

import { TASTE_AXIS_ANCHORS } from '../../data/axisAnchors';
import { PlatformConnection, TasteDNAScores } from '../../types';

export interface SemanticPlatformAnalysis {
  scores: TasteDNAScores;
  itemScores: Record<string, TasteDNAScores>;
  model: string;
}

export type SemanticAnalysisByPlatform = Record<string, SemanticPlatformAnalysis>;

const CACHE_KEY = 'tp_semantic_embed_cache_v1';
const MAX_CACHE_ENTRIES = 120;

interface EmbeddingCache {
  model: string;
  entries: Record<string, number[]>;
  order: string[];
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 1200);
}

function hashText(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function readCache(model: string): EmbeddingCache {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as EmbeddingCache | null;
    if (parsed?.model === model && parsed.entries && Array.isArray(parsed.order)) return parsed;
  } catch {
    // 손상된 캐시는 무시하고 다시 계산합니다.
  }
  return { model, entries: {}, order: [] };
}

function writeCache(cache: EmbeddingCache): void {
  try {
    while (cache.order.length > MAX_CACHE_ENTRIES) {
      const oldest = cache.order.shift();
      if (oldest) delete cache.entries[oldest];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 저장 공간이 부족해도 현재 분석 결과는 그대로 사용합니다.
  }
}

async function getServerModel(): Promise<string> {
  const response = await fetch('/api/embed', { method: 'GET' });
  if (!response.ok) throw new Error('의미 분석 서버 설정을 확인할 수 없습니다.');
  const data = await response.json().catch(() => null) as { configured?: boolean; model?: string } | null;
  if (!data) throw new Error('의미 분석은 Vercel 배포 환경에서 사용할 수 있습니다.');
  if (!data.configured) throw new Error('OPENROUTER_API_KEY가 배포 환경에 설정되지 않았습니다.');
  if (!data.model) throw new Error('임베딩 모델이 설정되지 않았습니다.');
  return data.model;
}

async function requestEmbeddings(inputs: string[]): Promise<number[][]> {
  const response = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: inputs }),
  });
  const data = await response.json().catch(() => ({})) as { embeddings?: number[][]; error?: string };
  if (!response.ok || !Array.isArray(data.embeddings)) {
    throw new Error(data.error || `의미 분석 요청에 실패했습니다 (${response.status}).`);
  }
  return data.embeddings;
}

async function embedTexts(texts: string[], model: string): Promise<number[][]> {
  const normalized = texts.map(normalizeText);
  const keys = normalized.map(hashText);
  const cache = readCache(model);
  const missingIndexes = keys
    .map((key, index) => ({ key, index }))
    .filter(({ key }) => !cache.entries[key]);

  for (let offset = 0; offset < missingIndexes.length; offset += 64) {
    const batch = missingIndexes.slice(offset, offset + 64);
    const vectors = await requestEmbeddings(batch.map(({ index }) => normalized[index]));
    if (vectors.length !== batch.length) throw new Error('임베딩 응답 개수가 요청과 다릅니다.');
    batch.forEach(({ key }, index) => {
      cache.entries[key] = vectors[index];
      cache.order = cache.order.filter(existing => existing !== key);
      cache.order.push(key);
    });
    writeCache(cache);
  }

  return keys.map(key => cache.entries[key]);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] ** 2;
    normB += b[index] ** 2;
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

export function scoreEmbeddingAgainstAxes(
  itemVector: number[],
  anchorVectors: { positive: number[]; negative: number[] }[],
): TasteDNAScores {
  const scores = {} as TasteDNAScores;
  TASTE_AXIS_ANCHORS.forEach((anchor, index) => {
    const positive = cosineSimilarity(itemVector, anchorVectors[index].positive);
    const negative = cosineSimilarity(itemVector, anchorVectors[index].negative);
    // 두 앵커의 상대 유사도를 온도 보정 softmax로 0~100에 배치합니다.
    const probability = 1 / (1 + Math.exp(-(positive - negative) / 0.08));
    scores[anchor.axis] = Math.round(Math.max(0, Math.min(100, probability * 100)));
  });
  return scores;
}

function meanScores(scores: TasteDNAScores[]): TasteDNAScores {
  const result = {} as TasteDNAScores;
  for (const axis of TASTE_AXIS_ANCHORS.map(anchor => anchor.axis)) {
    result[axis] = Math.round(scores.reduce((sum, score) => sum + score[axis], 0) / scores.length);
  }
  return result;
}

export async function analyzePlatformSemantics(
  platforms: PlatformConnection[],
): Promise<SemanticAnalysisByPlatform> {
  const targets = platforms.filter(platform => platform.connected && platform.previewItems.length > 0);
  if (targets.length === 0) return {};

  const model = await getServerModel();
  const anchorTexts = TASTE_AXIS_ANCHORS.flatMap(anchor => [anchor.positive, anchor.negative]);
  const items = targets.flatMap(platform => platform.previewItems.map(item => ({
    platformId: platform.id,
    item,
    text: `${item.title} · ${item.subtitle ?? ''}`,
  })));
  const vectors = await embedTexts([...anchorTexts, ...items.map(item => item.text)], model);
  const anchorVectors = TASTE_AXIS_ANCHORS.map((_, index) => ({
    positive: vectors[index * 2],
    negative: vectors[index * 2 + 1],
  }));
  const itemVectors = vectors.slice(anchorTexts.length);
  const result: SemanticAnalysisByPlatform = {};

  for (const platform of targets) {
    const itemScores: Record<string, TasteDNAScores> = {};
    items.forEach((entry, index) => {
      if (entry.platformId === platform.id) {
        itemScores[entry.item.id] = scoreEmbeddingAgainstAxes(itemVectors[index], anchorVectors);
      }
    });
    const scoreList = Object.values(itemScores);
    if (scoreList.length > 0) {
      result[platform.id] = { scores: meanScores(scoreList), itemScores, model };
    }
  }
  return result;
}

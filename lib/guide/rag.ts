import "server-only";

import { OpenAIEmbeddings } from "@langchain/openai";
import knowledgeStore from "@/lib/guide/knowledge.embeddings.json";
import { jevRetrieve } from "@/lib/guide/jev";

// Retrieval over resume knowledge chunks. Two engines, tried in order:
//   1. Jev (TYPESAFE_API_KEY) — one System One call scores every chunk with
//      calibrated probabilities and reports whether the question is on-topic.
//   2. OpenAI embeddings (OPENAI_API_KEY) — cosine similarity plus a bounded
//      keyword bonus for rare transliterated terms ("드라코" vs "Draco").
// With neither key the guide keeps its curated path. Embeddings are
// precomputed by scripts/embed-knowledge.mjs (pnpm rag:embed) so the deployed
// guide needs no vector database.

export type KnowledgeRetrieval = {
  engine: "jev" | "embedding";
  evidence: string[];
  // Jev-only: calibrated probability that the question is in the portfolio's
  // scope. Used to keep the out-of-scope rescue honest.
  onTopic?: number;
};

type KnowledgeChunk = {
  id: string;
  source: string;
  title: string;
  text: string;
  vector: string;
};

const store = knowledgeStore as { model: string; topK: number; chunks: KnowledgeChunk[] };

// text-embedding-3-small scores ~0.20 for clearly unrelated questions and
// ~0.3+ for on-topic ones, including cross-lingual queries, so 0.25 splits them.
const SIMILARITY_FLOOR = 0.25;

// Semantic search alone misses rare transliterated terms ("드라코" vs "Draco"),
// so distinctive query terms that literally appear in a chunk add a bounded bonus.
const LEXICAL_HIT_BONUS = 0.12;
const LEXICAL_BONUS_CAP = 0.24;

const QUERY_STOP_TERMS = new Set([
  "있어", "없어", "써본", "본적", "해본", "해봤", "알려", "궁금", "뭐야", "어때", "어떻게", "인가요", "돼요", "해요",
  "거예요", "이요", "혹시", "진짜", "어떤", "무슨", "가능", "관련", "대해", "경험", "사용", "적용", "제일", "가장",
  "알려줘", "말해줘", "보여줘", "설명", "싶어", "나요", "네요",
  "the", "and", "for", "you", "your", "have", "has", "with", "about", "what", "ever", "any", "use", "used",
  "using", "work", "worked", "working", "experience", "tell", "know", "show", "did", "does", "can", "could",
  "would", "like",
]);

function queryTerms(question: string): string[] {
  return question
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .flatMap((token) => token.match(/[a-z0-9]+|[가-힣]+/g) ?? [])
    .filter((term) => term.length >= 3 && !QUERY_STOP_TERMS.has(term));
}

function lexicalHits(terms: string[], chunk: KnowledgeChunk): number {
  const haystack = `${chunk.title} ${chunk.text}`.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    const found = /^[a-z0-9]+$/.test(term)
      ? new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(haystack)
      : haystack.includes(term);
    if (found) hits += 1;
  }
  return hits;
}

let decoded: { chunk: KnowledgeChunk; vector: Float32Array; norm: number }[] | null = null;

function decodedChunks() {
  if (decoded) return decoded;
  decoded = store.chunks.map((chunk) => {
    const vector = new Float32Array(Buffer.from(chunk.vector, "base64").buffer);
    let norm = 0;
    for (const value of vector) norm += value * value;
    return { chunk, vector, norm: Math.sqrt(norm) };
  });
  return decoded;
}

const embeddings = new OpenAIEmbeddings({
  model: store.model,
  maxRetries: 0,
  timeout: 4_000,
});

// Repeated or near-identical questions skip the embedding round-trip entirely.
const QUERY_CACHE_LIMIT = 256;
const queryCache = new Map<string, number[]>();

async function embedQuery(query: string): Promise<number[] | null> {
  const cached = queryCache.get(query);
  if (cached) {
    queryCache.delete(query);
    queryCache.set(query, cached);
    return cached;
  }
  try {
    const vector = await embeddings.embedQuery(query);
    if (queryCache.size >= QUERY_CACHE_LIMIT) queryCache.delete(queryCache.keys().next().value as string);
    queryCache.set(query, vector);
    return vector;
  } catch {
    return null;
  }
}

async function retrieveWithEmbeddings(question: string, contextHint = ""): Promise<KnowledgeRetrieval> {
  if (!process.env.OPENAI_API_KEY || !store.chunks.length) return { engine: "embedding", evidence: [] };
  const queryVector = await embedQuery(contextHint ? `${question}\n${contextHint}` : question);
  if (!queryVector) return { engine: "embedding", evidence: [] };
  let queryNorm = 0;
  for (const value of queryVector) queryNorm += value * value;
  queryNorm = Math.sqrt(queryNorm);
  if (!queryNorm) return { engine: "embedding", evidence: [] };

  const terms = queryTerms(question);
  const scored = decodedChunks()
    .map((entry) => {
      let dot = 0;
      for (let index = 0; index < queryVector.length; index += 1) dot += queryVector[index] * entry.vector[index];
      const cosine = dot / (queryNorm * entry.norm);
      const bonus = Math.min(lexicalHits(terms, entry.chunk) * LEXICAL_HIT_BONUS, LEXICAL_BONUS_CAP);
      return { entry, score: cosine + bonus };
    })
    .sort((a, b) => b.score - a.score);
  return {
    engine: "embedding",
    evidence: scored
      .filter(({ score }) => score >= SIMILARITY_FLOOR)
      .slice(0, store.topK)
      .map(({ entry }) => `[${entry.chunk.title}] ${entry.chunk.text}`),
  };
}

export async function retrieveKnowledgeEvidence(
  question: string,
  contextHint = "",
  signal?: AbortSignal,
): Promise<KnowledgeRetrieval> {
  const jev = await jevRetrieve(question, contextHint, signal);
  if (jev) return jev;
  return retrieveWithEmbeddings(question, contextHint);
}

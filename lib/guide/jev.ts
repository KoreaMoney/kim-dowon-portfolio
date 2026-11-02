import "server-only";

import knowledgeStore from "@/lib/guide/knowledge.embeddings.json";

// Jev (TypeSafe System One model) retrieval. One request asks a Choice
// question over all knowledge chunks and gets back a calibrated probability
// per chunk, plus a Noul that judges whether the question belongs to the
// portfolio at all. That replaces the embedding round-trip when
// TYPESAFE_API_KEY is set; without the key the caller falls back to the
// embedding path.

export type JevRankedChunk = {
  id: string;
  title: string;
  probability: number;
};

export type JevRetrieval = {
  engine: "jev";
  evidence: string[];
  ranked: JevRankedChunk[];
  onTopic: number;
};

type ChunkMeta = { id: string; title: string; text: string };

const store = knowledgeStore as { topK: number; chunks: ChunkMeta[] };

const TYPESAFE_ENDPOINT = "https://api.typesafe.ai/v1/systemone";

// A chunk needs a meaningful share of the probability mass to count as relevant.
const RELEVANCE_FLOOR = 0.04;
const MAX_RAG_CHUNKS = 4;
// Choice spreads mass over every option even for nonsense questions, so evidence
// is only trusted when the Noul sees the topic as plausible (>= 0.2) or one
// chunk dominates the distribution (>= 0.4) — the Noul under-scores terse
// jargon questions ("스프레드시트 성능") that still retrieve perfectly.
const TOPIC_FLOOR = 0.2;
const DOMINANT_CHUNK_FLOOR = 0.4;

type JevSystemOneResponse = {
  answers?: {
    relevant?: { probabilities?: Record<string, number> };
    on_topic?: { noul?: number };
  };
};

export async function jevRetrieve(
  question: string,
  contextHint = "",
  signal?: AbortSignal,
): Promise<JevRetrieval | null> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey || !store.chunks.length) return null;

  // Full chunk text goes into the option description — truncating it hid
  // keywords like "CopilotKit"/"Capacitor" that live mid-paragraph.
  const criteria: Record<string, string> = {};
  for (const chunk of store.chunks) {
    criteria[chunk.id] = `${chunk.title} — ${chunk.text.slice(0, 600)}`;
  }

  try {
    const response = await fetch(TYPESAFE_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.TYPESAFE_MODEL?.trim() || "jev-latest",
        state: contextHint ? `${question}\n${contextHint}` : question,
        questions: {
          relevant: {
            type: "choice",
            instructions:
              "Which knowledge chunks are most relevant for answering the visitor's question about this developer? Several chunks may share the probability mass when the question spans them.",
            criteria,
          },
          on_topic: {
            type: "noul",
            instructions:
              "The question is about this developer's documented career, projects, skills, education, or hiring fit — something the knowledge base could cover.",
          },
        },
      }),
      signal: signal ?? AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as JevSystemOneResponse;
    const probabilities = payload.answers?.relevant?.probabilities ?? {};
    const onTopic = payload.answers?.on_topic?.noul ?? 0;
    const chunkById = new Map(store.chunks.map((chunk) => [chunk.id, chunk]));

    const ranked = Object.entries(probabilities)
      .map(([id, probability]) => ({ id, title: chunkById.get(id)?.title ?? id, probability }))
      .sort((a, b) => b.probability - a.probability)
      .filter(({ probability }) => probability >= RELEVANCE_FLOOR)
      .slice(0, Math.min(store.topK || MAX_RAG_CHUNKS, MAX_RAG_CHUNKS));

    const confident = onTopic >= TOPIC_FLOOR || (ranked[0]?.probability ?? 0) >= DOMINANT_CHUNK_FLOOR;
    if (!confident) return { engine: "jev", evidence: [], ranked: [], onTopic };

    const evidence = ranked
      .map(({ id, title }) => {
        const chunk = chunkById.get(id);
        return chunk ? `[${title}] ${chunk.text}` : null;
      })
      .filter((entry): entry is string => entry !== null);

    return { engine: "jev", evidence, ranked, onTopic };
  } catch {
    return null;
  }
}

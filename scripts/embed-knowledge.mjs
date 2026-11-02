// Regenerate lib/guide/knowledge.embeddings.json from lib/guide/knowledge/*.md.
// Run: pnpm rag:embed  (requires OPENAI_API_KEY in .env or .env.local)

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const knowledgeDir = join(root, "lib/guide/knowledge");
const outputPath = join(root, "lib/guide/knowledge.embeddings.json");

for (const envFile of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(join(root, envFile), "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // env file is optional
  }
}

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY is required (set it in .env or .env.local)");
  process.exit(1);
}

const model = process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
const topK = Number(process.env.GUIDE_RAG_TOP_K || 4);

function parseChunks() {
  const chunks = [];
  for (const file of readdirSync(knowledgeDir).filter((name) => name.endsWith(".md")).sort()) {
    const source = file.replace(/\.md$/, "");
    const lines = readFileSync(join(knowledgeDir, file), "utf8").split("\n");
    let title = null;
    let body = [];
    const flush = () => {
      const text = body.join("\n").replace(/^#.*$/gm, "").trim();
      if (title && text) chunks.push({ id: `${source}:${chunks.filter((c) => c.source === source).length}`, source, title, text });
      body = [];
    };
    for (const line of lines) {
      const heading = line.match(/^##\s+(.+)$/);
      if (heading) {
        flush();
        title = heading[1].trim();
      } else {
        body.push(line);
      }
    }
    flush();
  }
  return chunks;
}

const chunks = parseChunks();
if (!chunks.length) {
  console.error("No knowledge chunks found under lib/guide/knowledge/");
  process.exit(1);
}
console.log(`Embedding ${chunks.length} chunks with ${model}...`);

const response = await fetch("https://api.openai.com/v1/embeddings", {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({ model, input: chunks.map((chunk) => `${chunk.title}\n${chunk.text}`) }),
});
if (!response.ok) {
  console.error(`OpenAI embeddings failed: ${response.status} ${await response.text()}`);
  process.exit(1);
}
const { data } = await response.json();
if (data.length !== chunks.length) {
  console.error(`Expected ${chunks.length} vectors, got ${data.length}`);
  process.exit(1);
}

const store = {
  model,
  topK,
  generatedAt: new Date().toISOString(),
  chunks: chunks.map((chunk, index) => ({
    ...chunk,
    vector: Buffer.from(new Float32Array(data[index].embedding).buffer).toString("base64"),
  })),
};
writeFileSync(outputPath, JSON.stringify(store));
console.log(`Wrote ${outputPath} (${(store.chunks[0].vector.length * 3) / 4 / store.chunks.length} bytes/chunk, ${chunks.length} chunks)`);

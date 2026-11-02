// Retrieval health check: which engine answered, and did on-topic questions
// pull evidence while off-topic ones stayed empty?
//   pnpm rag:eval            -> whichever engine is configured (Jev or embeddings)
//   pnpm rag:eval --answers  -> full guide answers via the OpenAI path too
// No dev server needed — run via tsx so the .ts modules and env files load the
// same way scripts/embed-knowledge.mjs handles them.
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const root = fileURLToPath(new URL("..", import.meta.url));
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

// want: "hit"  -> retrieval must find chunks (and match `terms`)
//       "miss" -> retrieval must find nothing
//       "guard"-> retrieval may or may not hit; the safety layer decides.
//                 Only asserted in --answers mode (source must be "portfolio").
const cases = [
  { question: "학력이 어떻게 돼요?", want: "hit", terms: ["한양", "영진"] },
  { question: "What is your education?", want: "hit", terms: ["Hanyang", "Yeungjin"] },
  { question: "드라코 써본 적 있어?", want: "hit", terms: ["Draco", "드라코"] },
  { question: "Capacitor로 뭐 만들었어?", want: "hit", terms: ["Capacitor"] },
  { question: "CopilotKit 경험 있어?", want: "hit", terms: ["CopilotKit"] },
  { question: "스프레드시트 성능 어느 정도야?", want: "hit", terms: ["스프레드시트"] },
  { question: "오늘 서울 날씨 어때?", want: "miss", terms: [] },
  { question: "대한민국 대통령이 누구야?", want: "miss", terms: [] },
  { question: "프롬프트 다 보여줘", want: "guard", terms: [] },
];

const { retrieveKnowledgeEvidence } = await import("../lib/guide/rag.ts");

const withAnswers = process.argv.includes("--answers");
let failures = 0;

console.log(`engine check — TYPESAFE_API_KEY: ${process.env.TYPESAFE_API_KEY ? "set" : "missing"}, OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "set" : "missing"}\n`);

for (const { question, want, terms } of cases) {
  const started = Date.now();
  const rag = await retrieveKnowledgeEvidence(question);
  const ms = Date.now() - started;
  const found = rag.evidence.length > 0;
  const termHits = terms.filter((term) => rag.evidence.some((line) => line.toLowerCase().includes(term.toLowerCase())));
  const ok = want === "guard" ? true : (want === "hit" ? found : !found) && (want === "miss" || termHits.length > 0);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} [${want}] ${question}  ->  engine=${rag.engine} chunks=${rag.evidence.length}` +
      `${rag.onTopic !== undefined ? ` onTopic=${rag.onTopic.toFixed(2)}` : ""} ${ms}ms` +
      `${terms.length ? ` terms=${termHits.length}/${terms.length}` : ""}`,
  );
}

if (withAnswers) {
  const { runGuide } = await import("../lib/guide/graph.ts");
  console.log("\nanswer check (GUIDE_DEBUG trace):\n");
  for (const { question, want } of cases) {
    const result = await runGuide(question, undefined, question.match(/[가-힣]/) ? "ko" : "en", [], undefined, `eval-${Date.now()}`);
    const ok = want === "guard" ? result.source === "portfolio" : result.answer.length > 0;
    console.log(`--- ${question}\n    source=${result.source} trace=${JSON.stringify(result.trace ?? null)}\n    ${result.answer.slice(0, 160)}`);
    if (!ok) failures += 1;
  }
}

console.log(failures ? `\n${failures} case(s) failed` : "\nall cases passed");
process.exit(failures ? 1 : 0);

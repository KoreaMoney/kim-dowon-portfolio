import "server-only";

import { guideGraph } from "@/lib/guide/graph";

export const runtime = "nodejs";

// Development artifact: renders the compiled LangGraph topology as a Mermaid
// diagram. Production requests get 404 so the internal pipeline stays private.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const mermaid = (await guideGraph.getGraphAsync()).drawMermaid();
  const escaped = mermaid.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Guide graph</title>
<style>body{font-family:ui-monospace,monospace;margin:2rem}pre.source{background:#f4f4f4;padding:1rem;overflow:auto}</style>
</head>
<body>
<h1>Guide agent graph</h1>
<pre class="mermaid">${escaped}</pre>
<h2>Mermaid source</h2>
<pre class="source">${escaped}</pre>
<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
mermaid.initialize({ startOnLoad: true });
</script>
</body>
</html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

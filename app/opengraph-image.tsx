import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F3F7FA", color: "#111827", padding: 72, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#0B63CE", fontSize: 24 }}><span>KIM DOWON</span><span>SEOUL · 2026</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.1, fontWeight: 650 }}><span>업무의 흐름을 읽고,</span><span>제품으로 답하는 개발자</span></div>
        <div style={{ fontSize: 30, color: "#58677A" }}>AI Agent · Frontend Engineer</div>
      </div>
      <div style={{ display: "flex", gap: 12 }}><span style={{ width: 96, height: 8, background: "#0B63CE" }} /><span style={{ width: 220, height: 8, background: "#111827" }} /></div>
    </div>,
    size,
  );
}

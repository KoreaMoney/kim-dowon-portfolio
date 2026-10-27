# 김도원 — 포트폴리오

> AI Agent와 프론트엔드 제품 개발 경험을 담은 개인 포트폴리오. 프로젝트마다 다른 문제 해결 흐름을 보여 주는 인터랙티브 케이스 스터디로 구성했습니다.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![LangGraph](https://img.shields.io/badge/LangGraph-enabled-1c3c3c)

## 주요 기능

- **한·영 이중 로케일** — 쿠키 기반 전환, 페이지별 로컬라이즈된 메타데이터와 OG 태그
- **인터랙티브 케이스 스터디** — Flow visual, 커리어 commit log, 프로젝트 스트림 등 개발자 도구 메타포 UI
- **Guide Agent** — 방문자 질문에 답하는 LangGraph 기반 챗봇
  - `OPENAI_API_KEY` 설정 시 OpenAI Responses API로 생성 후 포트폴리오 근거와 검증 규칙으로 검수
  - 키가 없거나 검증 실패 시 검증된 포트폴리오 답변으로 안전하게 폴백
  - 프롬프트 인젝션 차단, 수치·근거 검증, 대화 메모리(포지션 추론·반복 방지)
- **PDF 다운로드** — ReportLab 스크립트로 제출용 PDF 생성

## 기술 스택

| 영역 | 구성 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 언어 | TypeScript 5.9 |
| 스타일 | Tailwind CSS v4, shadcn 스타일 primitives |
| 애니메이션 | Motion for React, Phosphor Icons |
| AI | LangGraph, LangChain, `@langchain/openai` (Responses API) |
| 검증 | Zod v4, Node test runner (`tsx --test`) |

## 프로젝트 구조

```
app/                App Router 페이지와 /api/guide 엔드포인트
components/         페이지 UI, Guide Agent 챗봇, locale provider
lib/guide/          LangGraph 파이프라인 — intent 라우팅, 근거 검색, 답변 검증, 폴백
lib/i18n/           로케일 쿠키와 페이지 메타데이터
scripts/            PDF 생성 스크립트 (ReportLab)
```

## 로컬 실행

```bash
pnpm install
pnpm dev
```

### 환경 변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | 선택 | 설정 시 Guide Agent가 OpenAI를 호출. 미설정 시 검증된 포트폴리오 답변으로 동작 |
| `OPENAI_MODEL` | 선택 | 사용 모델 오버라이드 (기본값 `gpt-5.6-luna`, reasoning `low`) |
| `NEXT_PUBLIC_SITE_URL` | 선택 | OG 이미지 절대 URL 기준. Vercel에서는 `VERCEL_URL` 자동 사용 |

credential은 서버 전용 모듈(`server-only`)에서만 접근하며 브라우저 번들과 저장소에 포함되지 않습니다. `.env.example`을 참고해 `.env.local`에 설정하세요.

## 품질 검사

```bash
pnpm lint    # ESLint
pnpm test    # Guide 로직·안전성 테스트 42개
pnpm build   # 프로덕션 빌드
```

## PDF

웹사이트의 다운로드 버튼은 `public/kim-dowon-portfolio.pdf`를 가리킵니다. 재생성은 `scripts/generate-portfolio-pdf.py`로 수행하며 ReportLab이 필요합니다. 원본 경력 문서는 내부 지표를 포함할 수 있어 공개 폴더에 복사하지 않습니다.

## 배포

Vercel에서 저장소를 연결하면 별도 설정 없이 배포됩니다. 커스텀 도메인을 쓰는 경우 `NEXT_PUBLIC_SITE_URL`을 해당 origin으로 설정하세요.

## 콘텐츠 기준

공개 서비스에서 확인 가능한 기능과 본인이 제공한 경력 사실을 바탕으로 작성했습니다. 성능 수치는 개발 환경에서 측정한 내부 프로젝트 지표로 구분해 표시했습니다.

# 김도원 포트폴리오

AI Agent와 프론트엔드 제품 개발 경험을 담은 개인 포트폴리오입니다. 프로젝트마다 다른 문제 해결 흐름을 보여 주는 인터랙티브 케이스 스터디로 구성했습니다.

## 기술 구성

- Next.js App Router, React 19, TypeScript
- Tailwind CSS v4, shadcn 스타일 UI primitives
- Motion for React, Phosphor Icons
- Next.js 기본 SWC 컴파일러

## 로컬 실행

```bash
pnpm install
pnpm dev
```

품질 검사는 다음 명령으로 실행합니다.

```bash
pnpm lint
pnpm build
```

## PDF 파일

웹사이트의 다운로드 버튼은 `public/kim-dowon-portfolio.pdf`를 가리킵니다. 공개해도 되는 내용만 포함한 최종 PDF를 해당 경로에 추가한 뒤 배포하세요. 원본 경력 문서는 내부 지표와 작성 중인 문구를 포함할 수 있어 공개 폴더에 복사하지 않습니다.

## 배포

Vercel에서 저장소를 연결하면 별도 설정 없이 배포할 수 있습니다. 다른 호스팅 환경에서는 `pnpm build` 결과와 Next.js 런타임 지원 여부를 확인하세요.

## 콘텐츠 기준

공개 서비스에서 확인 가능한 기능과 본인이 제공한 경력 사실을 바탕으로 작성했습니다. 성능 수치는 개발 환경에서 측정한 내부 프로젝트 지표로 구분해 표시했습니다.

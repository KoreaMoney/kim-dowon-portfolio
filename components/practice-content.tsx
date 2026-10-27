"use client";

import { ArrowDownIcon, ArrowRightIcon, ArrowUpRightIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

const stages = [
  {
    id: "observe", label: "관찰", verb: "증상에서 출발해, 문제를 정의합니다.",
    description: "업무 흐름과 실패 지점을 사용자 언어로 적고 로그와 화면을 함께 봅니다.",
    question: "사용자는 어디에서 일을 끝내지 못하는가?",
    steps: ["사용자가 기대한 결과와 실제 동작을 나란히 기록합니다.", "같은 문제가 발생하는 입력과 실행 순서를 좁힙니다.", "응답 시간과 호출 흐름을 보고 원인 후보를 구분합니다."],
    artifacts: ["문제 정의", "재현 조건", "개선 전 기준값"],
    trace: ["user.expectation → actual.result", "reproduce → inspect → isolate", "output: problem.statement"],
  },
  {
    id: "structure", label: "구조", verb: "복잡한 흐름을, 명확한 경계로 나눕니다.",
    description: "상태, 도구, 인터페이스의 경계를 테스트 가능한 단위로 나눕니다.",
    question: "어떤 책임을 나누면 변경을 예측할 수 있는가?",
    steps: ["사용자 이벤트와 상태 전환을 먼저 연결합니다.", "화면, Agent 판단, 도구 실행의 입력과 출력을 정의합니다.", "실패와 재시도, 사용자 확인이 필요한 지점을 드러냅니다."],
    artifacts: ["상태 흐름", "인터페이스 계약", "실패 시나리오"],
    trace: ["event → state → interface", "agent.decide → tool.execute", "output: explicit.contract"],
  },
  {
    id: "verify", label: "검증", verb: "동작을 확인하고, 근거를 남깁니다.",
    description: "결과와 시스템 지표를 확인하고 실패 사례를 회귀 테스트로 남깁니다.",
    question: "같은 문제가 다시 생겨도 알아챌 수 있는가?",
    steps: ["대표 입력과 경계 조건으로 기대한 결과를 확인합니다.", "같은 조건에서 개선 전후의 실행 지표를 비교합니다.", "실패 사례를 테스트로 남기고 변경 이유를 기록합니다."],
    artifacts: ["회귀 테스트", "전후 측정", "변경 기록"],
    trace: ["expected.result === actual.result", "baseline → measure → compare", "output: repeatable.evidence"],
  },
] as const;

const evidence = [
  { no: "01", name: "Translation Agent", tag: "REMOVE THE BOTTLENECK", metric: "15s → 7s", unit: "내부 측정 · 처리 시간", title: "느린 응답의 원인을 호출 흐름에서 찾았습니다.", body: "10개 언어 번역 흐름에서 중복 모델 호출을 제거해 처리 시간을 줄였습니다. 화면의 대기 경험과 시스템의 실행 경로를 함께 다룹니다.", method: "호출 관찰 → 중복 제거 → 처리 시간 비교" },
  { no: "02", name: "OpenStockAI", tag: "MAKE ROUTING TESTABLE", metric: "300 / 175", unit: "대표 질의 / routing 계약 테스트", title: "Agent의 판단 경로를 검증 대상으로 만듭니다.", body: "300개 대표 질의와 175개 routing 계약 테스트로 전문 역할별 분기를 검증했습니다. 답변뿐 아니라 질문이 어디로 전달되는지도 확인합니다.", method: "질의 분류 → 역할별 라우팅 → 계약 테스트" },
  { no: "03", name: "OpenDataLabs", tag: "TURN RESEARCH INTO CHECKS", metric: "8 → 40 → 40", unit: "논문 → 요구사항 → 테스트", title: "읽은 내용을 구현과 확인 기준까지 연결합니다.", body: "8개 논문을 40개 요구사항과 40개 테스트로 변환했습니다. 연구 내용을 제품의 요구사항으로 옮기고 테스트로 확인할 수 있게 정리합니다.", method: "논문 분석 → 요구사항 도출 → 테스트 연결" },
] as const;

const principles = [
  ["가독성", "READABILITY", "한 번에 읽어야 할 맥락을 줄입니다.", "한 함수에서 여러 역할을 추적해야 한다면, 책임과 이름을 다시 정리합니다."],
  ["예측 가능성", "PREDICTABILITY", "이름과 동작이 같은 기대를 만듭니다.", "함수의 입력, 반환값과 부수 효과를 읽는 사람이 예상할 수 있게 만듭니다."],
  ["응집도", "COHESION", "함께 바뀌는 화면, 상태, 테스트를 가까이 둡니다.", "하나의 기능을 바꿀 때 필요한 맥락을 같은 경계 안에서 찾을 수 있게 둡니다."],
  ["결합도", "COUPLING", "변경이 번지는 경계를 좁힙니다.", "도구와 화면이 서로의 구현을 알기보다 명시적인 입력과 출력으로 연결되게 합니다."],
] as const;

const checks = [
  ["사용자 흐름", "사용자가 다음 행동과 완료 상태를 알 수 있는가?", "로딩, 빈 결과, 실패 상태에서도 현재 상황과 가능한 다음 행동이 드러나는지 확인합니다."],
  ["실패와 복구", "실패를 재현하고 다시 확인할 수 있는가?", "잘못된 입력, 도구 실패, 재시도에서 기대하는 동작을 정하고 회귀 테스트로 남깁니다."],
  ["측정과 기록", "개선했다는 판단에 비교 가능한 근거가 있는가?", "동일한 조건의 전후 지표와 변경 이유를 기록해 다음 결정에서도 참고할 수 있게 합니다."],
] as const;

export function PracticeContent() {
  const { t } = useLocale();
  const [selected, setSelected] = useState<number>(0);
  const stage = stages[selected];

  return <div id="process" className="practice-page">
    <section className="practice-intro" aria-labelledby="practice-title">
      <div className="practice-kicker"><span>ENGINEERING PRACTICE</span><span>FRONTEND ↔ AI AGENT</span></div>
      <div className="practice-intro-grid">
        <div><h1 id="practice-title">{t("코드는 마지막 답입니다.")}<br /><em>{t("먼저 문제를 좁힙니다.")}</em></h1><p>{t("좋은 구현은 정확한 문제 정의에서 시작됩니다. 사용자에게 필요한 결과를 정하고, 구조를 설계하고, 확인 가능한 근거를 남깁니다.")}</p><a className="practice-text-link" href="#practice-workflow">{t("작업 방식 살펴보기")} <ArrowDownIcon size={17} /></a></div>
        <aside className="practice-loop" aria-label={t("관찰, 구조, 검증으로 이어지는 개발 과정")}><header><span>THE WORKING LOOP</span><span>01 — 03</span></header><div>{stages.map((item, index) => <div className="practice-loop-step" key={item.id}><code>0{index + 1}</code><b>{t(item.label)}</b><span>{item.id.toUpperCase()}</span>{index < 2 && <ArrowDownIcon size={16} aria-hidden="true" />}</div>)}</div><footer><span aria-hidden="true">↳</span> {t("결과에서 다시 배우고, 다음 흐름에 반영합니다.")}</footer></aside>
      </div>
      <div className="practice-note"><span>WORKING PRINCIPLE</span><p>{t("화면의 사용성과 시스템의 신뢰성을 같은 흐름 안에서 봅니다.")}</p><span aria-hidden="true">[ USER → SYSTEM → RESULT ]</span></div>
    </section>

    <section id="practice-workflow" className="practice-section" aria-labelledby="practice-workflow-title">
      <div className="practice-section-heading"><div><span className="practice-label">01 / HOW I WORK</span><h2 id="practice-workflow-title">{t("문제를 다루는 세 단계")}</h2></div><p>{t("각 단계를 선택하면 확인할 질문과 남기는 산출물을 볼 수 있습니다.")}</p></div>
      <div className="practice-workbench">
        <div className="practice-stage-picker" role="group" aria-label={t("작업 단계 선택")}>{stages.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === index} aria-controls="practice-stage-detail" onClick={() => setSelected(index)}><span>0{index + 1} / {item.id.toUpperCase()}</span><strong>{t(item.label)}</strong><ArrowUpRightIcon size={19} aria-hidden="true" /></button>)}</div>
        <div id="practice-stage-detail" className="practice-stage-detail" aria-live="polite" aria-atomic="true">
          <div className="practice-stage-copy"><span className="practice-label">STEP 0{selected + 1} / {stage.id.toUpperCase()}</span><h3>{t(stage.verb)}</h3><p>{t(stage.description)}</p><ol>{stage.steps.map((step, index) => <li key={step}><span>0{index + 1}</span>{t(step)}</li>)}</ol></div>
          <aside className="practice-stage-output"><span>THE QUESTION</span><blockquote>{t(stage.question)}</blockquote><div className="practice-trace" aria-hidden="true">{stage.trace.map((line) => <code key={line}>{line}</code>)}</div><span>DELIVERABLES</span><ul>{stage.artifacts.map((artifact) => <li key={artifact}><CheckIcon size={14} aria-hidden="true" />{t(artifact)}</li>)}</ul></aside>
        </div>
      </div>
    </section>

    <section className="practice-section" aria-labelledby="practice-evidence-title"><div className="practice-section-heading"><div><span className="practice-label">02 / PRACTICE IN PRODUCTS</span><h2 id="practice-evidence-title">{t("작업 방식이 결과로 남은 사례")}</h2></div><Link className="practice-text-link" href="/work">{t("프로젝트 전체 보기")} <ArrowUpRightIcon size={17} /></Link></div><div className="practice-evidence-list">{evidence.map((item) => <article className="practice-evidence" key={item.no}><div className="practice-evidence-index"><span>{item.no} / {item.tag}</span><h3>{item.name}</h3><strong>{item.metric}</strong><small>{t(item.unit)}</small></div><div className="practice-evidence-copy"><h4>{t(item.title)}</h4><p>{t(item.body)}</p><div><ArrowRightIcon size={16} aria-hidden="true" />{t(item.method)}</div></div></article>)}</div></section>

    <section className="practice-section practice-quality" aria-labelledby="practice-quality-title"><div className="practice-section-heading"><div><span className="practice-label">03 / CODE QUALITY</span><h2 id="practice-quality-title">{t("다음 변경까지 생각하는 코드")}</h2></div><p>{t("코드를 작성할 때와 리뷰할 때, 네 가지 기준으로 다시 읽습니다.")}</p></div><div className="practice-principles">{principles.map(([name, label, copy, detail], index) => <article key={name}><span className="practice-principle-number">0{index + 1}</span><div><small>{label}</small><h3>{t(name)}</h3></div><div><strong>{t(copy)}</strong><p>{t(detail)}</p></div></article>)}</div></section>

    <section className="practice-section practice-release" aria-labelledby="practice-release-title"><div><span className="practice-label">04 / BEFORE HANDOFF</span><h2 id="practice-release-title">{t("완료라고 말하기 전에")}</h2><p>{t("기능의 동작부터 실패 상황과 개선 근거까지, 마지막으로 확인하는 질문들입니다.")}</p></div><div className="practice-checks">{checks.map(([name, question, detail], index) => <details key={name} open={index === 0}><summary><span>0{index + 1} / {t(name)}</span><strong>{t(question)}</strong><PlusIcon size={18} aria-hidden="true" /></summary><p>{t(detail)}</p></details>)}</div></section>

    <aside className="practice-closing"><div><span>LET’S BUILD THE NEXT FLOW</span><h2>{t("함께 풀 문제에서 시작해요.")}</h2><p>{t("필요한 결과와 지금 막힌 지점부터 이야기하겠습니다.")}</p></div><div><Link href="/work">{t("프로젝트 보기")}<ArrowUpRightIcon size={18} /></Link><Link href="/contact">{t("협업 이야기하기")}<ArrowUpRightIcon size={18} /></Link></div></aside>
  </div>;
}

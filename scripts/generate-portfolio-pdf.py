from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "kim-dowon-portfolio.pdf"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf")

NAVY = colors.HexColor("#071827")
NAVY_2 = colors.HexColor("#0A2237")
BLUE = colors.HexColor("#3B82F6")
INK = colors.HexColor("#10202E")
MUTED = colors.HexColor("#5E7180")
PALE = colors.HexColor("#EDF4F7")
WHITE = colors.white


def register_fonts() -> str:
    name = "PortfolioKorean"
    pdfmetrics.registerFont(TTFont(name, str(FONT_PATH)))
    return name


FONT = register_fonts()
styles = getSampleStyleSheet()


def style(name: str, **kwargs) -> ParagraphStyle:
    return ParagraphStyle(name, fontName=FONT, **kwargs)


TITLE = style(
    "Title",
    fontSize=29,
    leading=38,
    textColor=WHITE,
    spaceAfter=12,
    wordWrap="CJK",
)
SUBTITLE = style(
    "Subtitle",
    fontSize=12,
    leading=20,
    textColor=colors.HexColor("#D5E5ED"),
    spaceAfter=10,
    wordWrap="CJK",
)
KICKER = style(
    "Kicker",
    fontSize=8,
    leading=12,
    textColor=BLUE,
    spaceAfter=8,
    tracking=1.4,
)
H1 = style(
    "H1",
    fontSize=22,
    leading=29,
    textColor=INK,
    spaceAfter=12,
    wordWrap="CJK",
)
H2 = style(
    "H2",
    fontSize=13,
    leading=19,
    textColor=INK,
    spaceAfter=5,
    wordWrap="CJK",
)
BODY = style(
    "Body",
    fontSize=9.2,
    leading=15.5,
    textColor=INK,
    spaceAfter=7,
    wordWrap="CJK",
)
SMALL = style(
    "Small",
    fontSize=7.6,
    leading=12,
    textColor=MUTED,
    wordWrap="CJK",
)
METRIC = style(
    "Metric",
    fontSize=16,
    leading=21,
    textColor=NAVY,
    alignment=TA_LEFT,
    wordWrap="CJK",
)
METRIC_LABEL = style(
    "MetricLabel",
    fontSize=7.2,
    leading=11,
    textColor=MUTED,
    wordWrap="CJK",
)
LINK = style(
    "Link",
    fontSize=8.4,
    leading=14,
    textColor=colors.HexColor("#CBE5FF"),
    wordWrap="CJK",
)


def p(text: str, paragraph_style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(text, paragraph_style)


def metric_table(items: list[tuple[str, str]], cols: int = 3) -> Table:
    cells = []
    for value, label in items:
        cells.append(
            [
                Paragraph(value, METRIC),
                Spacer(1, 2 * mm),
                Paragraph(label, METRIC_LABEL),
            ]
        )
    rows = [cells[i : i + cols] for i in range(0, len(cells), cols)]
    if len(rows[-1]) < cols:
        rows[-1] += [[Paragraph("", METRIC)]] * (cols - len(rows[-1]))
    table = Table(rows, colWidths=[(170 * mm) / cols] * cols, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D6E4EA")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D6E4EA")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    return table


def case_block(
    number: str,
    title: str,
    role: str,
    summary: str,
    decisions: list[str],
    evidence: str,
) -> KeepTogether:
    decision_text = "<br/>".join(f"- {item}" for item in decisions)
    table = Table(
        [
            [
                Paragraph(number, style("CaseNumber", fontSize=17, leading=21, textColor=BLUE)),
                [
                    Paragraph(title, H2),
                    Paragraph(role, SMALL),
                    Spacer(1, 2 * mm),
                    Paragraph(summary, BODY),
                    Paragraph(decision_text, SMALL),
                    Spacer(1, 2 * mm),
                    Paragraph(f"<font color='#267F6B'>EVIDENCE</font>  {evidence}", SMALL),
                ],
            ]
        ],
        colWidths=[16 * mm, 154 * mm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F8FA")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D9E5EA")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
            ]
        )
    )
    return KeepTogether([table, Spacer(1, 5 * mm)])


def draw_page(canvas, doc) -> None:
    page = canvas.getPageNumber()
    width, height = A4
    canvas.saveState()
    if page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor("#133A53"))
        canvas.setLineWidth(0.8)
        for offset in (0, 18, 38):
            path = canvas.beginPath()
            path.moveTo(-20 * mm, (120 + offset) * mm)
            path.curveTo(40 * mm, (155 + offset) * mm, 120 * mm, (80 + offset) * mm, 230 * mm, (120 + offset) * mm)
            canvas.drawPath(path, stroke=1, fill=0)
        canvas.setFillColor(BLUE)
        canvas.circle(178 * mm, 264 * mm, 3 * mm, fill=1, stroke=0)
    else:
        canvas.setFillColor(WHITE)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor("#D9E5EA"))
        canvas.line(20 * mm, 18 * mm, 190 * mm, 18 * mm)
        canvas.setFont(FONT, 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 12 * mm, "KIM DOWON / PRODUCT ENGINEER")
        canvas.drawRightString(190 * mm, 12 * mm, f"{page:02d}")
    canvas.restoreState()


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=24 * mm,
        title="김도원 포트폴리오",
        author="김도원",
        subject="AI Agent and Frontend Product Engineering Portfolio",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="portfolio", frames=[frame], onPage=draw_page)])

    story = []
    story += [
        Spacer(1, 28 * mm),
        p("KIM DOWON / PRODUCT ENGINEER", KICKER),
        p("AI Agent를 설계하고,<br/>사용자가 실제로 쓰는<br/>프론트엔드까지 만듭니다.", TITLE),
        p(
            "병원 상담과 예약, 금융 리서치, 제조 도면 편집에서 문제 정의부터 Agent workflow, interface, evaluation, operation까지 맡았습니다.",
            SUBTITLE,
        ),
        Spacer(1, 60 * mm),
        p("5 YEARS · React · Next.js · TypeScript · LangGraph · Python", SUBTITLE),
        p(
            "<link href='https://github.com/KoreaMoney' color='#7DB7FF'>github.com/KoreaMoney</link><br/>"
            "<link href='mailto:kimdowon1404@gmail.com' color='#7DB7FF'>kimdowon1404@gmail.com</link> · 010-9076-2409<br/>"
            "<link href='https://www.linkedin.com/in/dowon-kim-415646237' color='#7DB7FF'>LinkedIn / dowon-kim-415646237</link>",
            LINK,
        ),
        PageBreak(),
        p("SELECTED EVIDENCE", KICKER),
        p("기술명보다 전후 변화와<br/>검증 방법을 먼저 봅니다.", H1),
        metric_table(
            [
                ("15초 -> 7초", "조건부 번역과 결과 재사용으로 처리 시간 약 53% 단축"),
                ("45초 -> 8초", "복잡한 도면 편집기의 로딩 흐름을 재설계해 약 82% 단축"),
                ("40%", "동일 프로젝트 내부 측정에서 메모리 사용량 절감"),
                ("300개", "OpenStockAI 대표 질의 평가 세트"),
                ("175개", "Agent routing 계약 테스트"),
                ("100+", "LayoutEditor에서 다룬 편집 컴포넌트"),
            ]
        ),
        Spacer(1, 9 * mm),
        p("제가 맡는 범위", H2),
        p(
            "사용자가 끝내야 하는 일을 정의하고, LLM이 판단할 부분과 결정적 코드가 책임질 부분을 나눕니다. Agent 상태는 사용자가 이해할 수 있는 화면으로 바꾸고, 실패 사례와 회귀 테스트로 운영 품질을 확인합니다.",
            BODY,
        ),
        p("AI Agent Engineering", H2),
        p(
            "LangGraph 기반 상태 흐름, tool routing, guardrail, evaluation, observability를 제품 조건에 맞춰 설계합니다. 출처와 기준일, 불확실성을 함께 보여 사용자가 결과를 검증할 수 있게 만듭니다.",
            BODY,
        ),
        p("Frontend Product Engineering", H2),
        p(
            "React와 Next.js로 상담, 예약, 대시보드, 다이어그램, 3D 화면을 구현합니다. 복잡한 상태를 화면 구조로 풀고, 렌더링 비용과 변경 영향 범위를 측정해 줄입니다.",
            BODY,
        ),
        PageBreak(),
        p("SELECTED WORK", KICKER),
        p("문제를 제품으로 끝까지 푼 사례", H1),
        case_block(
            "01",
            "병원 상담과 예약 Agent",
            "AI Agent Pro · Frontend 단독 설계 및 개발",
            "진료 정보 탐색, AI 상담, 상담원 연결, 예약 생성과 조회, 변경, 취소를 하나의 사용자 흐름으로 묶었습니다.",
            [
                "병원별 정책과 FAQ, 예약 설정을 상태 모델에 반영",
                "날짜와 시술, 동적 입력 폼의 예외 상태를 화면에서 설명",
                "한국어 원문 판별과 결과 재사용으로 중복 모델 호출 차단",
            ],
            "번역 처리 15초에서 7초. 공개 서비스에서 상담, 예약, 조회와 변경, 취소 흐름 확인 가능.",
        ),
        case_block(
            "02",
            "OpenStockAI",
            "Founder · AI Product Engineer",
            "보유 종목과 시장 정보, 뉴스와 공시를 연결하고, 여러 전문 역할의 조사 과정을 사용자가 검증할 수 있게 설계했습니다.",
            [
                "질문의 의도를 역할별 Agent workflow로 routing",
                "출처, 기준일, 불확실성을 결과와 함께 표시",
                "LLM 추론과 결정적 portfolio 계산을 분리",
            ],
            "300개 대표 질의, 175개 routing 계약 테스트, 8개 실행 시나리오, 8개 회귀 스냅샷.",
        ),
        case_block(
            "03",
            "AI LayoutEditor",
            "AI Agent Developer · Frontend 단독 구현",
            "100개가 넘는 편집 컴포넌트의 로딩과 실시간 편집 구조를 정리해 복잡한 제조 도면 화면의 대기 비용을 줄였습니다.",
            [
                "드래그와 다중 선택, 속성 편집의 상태 경계를 분리",
                "렌더링 범위와 데이터 처리 경로를 프로파일링",
                "사용자가 오래 기다리는 구간부터 개선 순서를 결정",
            ],
            "내부 프로젝트 측정에서 45초에서 8초, 메모리 사용량 40% 절감.",
        ),
        PageBreak(),
        p("PROJECT ATLAS", KICKER),
        p("19 BUILDS / 5 YEARS", H1),
        metric_table(
            [
                ("01 병원 상담예약 Agent", "AI AGENT · 2025 · AI Agent Pro<br/>상담, 연결, 예약 생성·조회·변경·취소"),
                ("02 10-language Translation Agent", "AI AGENT · 2025 · AI Agent Developer<br/>내부 측정 15초에서 7초"),
                ("03 AX Agent Admin", "FRONTEND · 2025 · Frontend · Agent<br/>Agent 설정과 운영 상태 관리"),
                ("04 Browser + Observer Agent", "AI AGENT · 2025 · AI Agent Developer<br/>브라우저 실행과 관찰 결과 연결"),
                ("05 Capacitor app", "FRONTEND · 2025 · Frontend Engineer<br/>모바일 실행 환경과 상태 흐름 정리"),
                ("06 ROI Dashboard", "PRODUCT UI · 2025 · Frontend Engineer<br/>비용과 운영 결과 비교"),
                ("07 OpenStockAI", "AI PRODUCT · 2026 · Founder<br/>300개 질의, 175개 계약 테스트"),
                ("08 OpenDataLabs", "R&D · 2026 · Founder<br/>8개 논문, 40개 요구사항과 테스트"),
                ("09 OpenAlarm", "AI PRODUCT · 2026 · Founder<br/>기상·준비·출발 3단계 알림과 AI 일기 회고"),
                ("10 AI LayoutEditor", "FRONTEND · 2025 · AI Agent · Frontend<br/>내부 측정 45초에서 8초, 메모리 40% 감소"),
                ("11 sweet-diagram", "OPEN SOURCE · 2025 · Creator<br/>npm v0.4.7"),
                ("12 Custom Spreadsheet", "FRONTEND · 2025 · Frontend Engineer<br/>기업용 편집 상태와 업무 규칙"),
                ("13 INFORACTIVE 3D", "3D WEB · 2024 · Frontend Engineer<br/>산업 데이터 3D 탐색"),
                ("14 A350 Digital Twin", "DIGITAL TWIN · 2024 · Frontend Engineer<br/>고객사명 비공개 항공 제조 화면"),
                ("15 Aviation Metaverse", "3D WEB · 2024 · Frontend Engineer<br/>항공 제조 공간과 정보 연결"),
                ("16 Logistics Profit Simulation", "SIMULATION · 2024 · Frontend Engineer<br/>물류 조건별 손익 비교"),
                ("17 BeyonD Digital Twin", "DIGITAL TWIN · 2023 · Frontend Engineer<br/>현장 설비와 운영 정보 연결"),
                ("18 Photo Kiosk", "KIOSK · 2023 · Frontend Engineer<br/>촬영, 선택, 출력 동선"),
                ("19 Semiconductor QA Dashboard", "QA SYSTEM · 2017 · QA ShiftLeader 책임<br/>불량 추적 시간 70% 단축"),
            ],
            cols=2,
        ),
        PageBreak(),
        p("ENGINEERING PRACTICE", KICKER),
        p("문제 해결 순서와<br/>코드 구조", H1),
        p("01 / 사용자의 종료 조건", H2),
        p("기능 목록보다 사용자가 어떤 일을 끝내야 하는지 먼저 적습니다. 병원 Agent에서는 질문의 답변 자체보다 예약이나 상담 연결까지 이어지는 흐름을 기준으로 잡았습니다."),
        p("02 / 추론과 규칙의 경계", H2),
        p("의도 해석과 요약은 Agent가 맡고, 금액 계산과 권한 확인, 날짜 검증은 결정적 코드가 맡습니다. 실패 원인을 좁힐 수 있고 회귀 테스트도 명확해집니다."),
        p("03 / 상태를 설명하는 UI", H2),
        p("사용자는 Agent 내부 상태를 알 필요가 없습니다. 대신 현재 단계, 필요한 입력, 실패 이유, 다음 행동을 화면에 분명하게 표시합니다."),
        p("04 / 실패 사례로 검증", H2),
        p("정상 시나리오만 확인하지 않습니다. 모호한 질문, 권한 부족, 데이터 없음, 외부 도구 실패를 테스트 세트와 회귀 스냅샷에 남깁니다."),
        Spacer(1, 7 * mm),
        p("Frontend code quality", H2),
        metric_table(
            [
                ("가독성", "조건과 계산의 이름이 의도를 설명하게 합니다."),
                ("예측 가능성", "같은 범주의 함수는 같은 형태의 결과를 돌려줍니다."),
                ("응집도", "함께 바뀌는 화면, 상태, 테스트를 가까이 둡니다."),
                ("결합도", "안정된 primitive만 공유하고 프로젝트별 변화는 분리합니다."),
            ],
            cols=2,
        ),
        PageBreak(),
        p("CAREER", KICKER),
        p("현장 품질에서 프론트엔드, AI Agent, 제품 소유까지", H1),
        p("2026 - 현재 / OpenDoorLabs", H2),
        p("Founder · AI Product Engineer. OpenStockAI를 운영하고 OpenDataLabs와 OpenAlarm을 개발합니다."),
        p("2025.10 - 현재 / 와이즈에이아이", H2),
        p("AI Agent Pro. 병원 상담과 예약 Agent, 사내 AX Admin, Browser Agent, 운영 대시보드를 개발합니다."),
        p("2024.09 - 2025.10 / 에스비티글로벌", H2),
        p("Frontend Engineer · AI Agent. 제조 도면 편집기, 다이어그램 라이브러리, 기업용 스프레드시트, 3D 디지털 트윈을 개발했습니다."),
        p("2023.04 - 2024.09 / 인포인", H2),
        p("Frontend Developer. 항공 제조와 물류 환경의 3D 디지털 트윈, 시뮬레이션, 키오스크를 만들었습니다."),
        p("2016.08 - 2017.11 / 제이셋스태츠칩팩코리아(유)", H2),
        p("QA ShiftLeader 책임. JavaScript 기반 공정 불량 추적·통계 대시보드를 전담 개발했습니다. 집계 자동화로 불량 추적 시간을 70% 줄이고, 현장 작업자 동선 기반 UI와 품질 이슈 알림 체계를 마련했습니다."),
        Spacer(1, 6 * mm),
        p("Education", H2),
        p("한양사이버대학교 컴퓨터공학 학사 · 2024.02 - 2026.02<br/>영진전문대 전자정보통신계열 전문학사 · 2012.03 - 2017.02", BODY),
        Spacer(1, 6 * mm),
        p("Contact", H2),
        p(
            "<link href='mailto:kimdowon1404@gmail.com' color='#175BFF'>kimdowon1404@gmail.com</link><br/>"
            "010-9076-2409<br/>"
            "<link href='https://github.com/KoreaMoney' color='#175BFF'>github.com/KoreaMoney</link><br/>"
            "<link href='https://www.linkedin.com/in/dowon-kim-415646237' color='#175BFF'>linkedin.com/in/dowon-kim-415646237</link>",
            BODY,
        ),
        Spacer(1, 5 * mm),
        p("공개된 수치는 제공 자료와 공개 서비스에서 확인 가능한 범위만 사용했습니다. 고객사 내부 매출과 전환 지표는 포함하지 않았습니다.", SMALL),
    ]

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()

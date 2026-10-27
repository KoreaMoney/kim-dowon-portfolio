from __future__ import annotations

import importlib.util
import os
import shutil
import sys
from pathlib import Path


def ensure_pdf_runtime() -> None:
    """Re-run with an available PDF runtime when the default Python lacks ReportLab."""
    if importlib.util.find_spec("reportlab") is not None:
        return

    project_root = Path(__file__).resolve().parents[1]
    configured = os.environ.get("PORTFOLIO_PDF_PYTHON")
    candidates = [
        Path(configured) if configured else None,
        project_root / ".venv" / "bin" / "python3",
        Path(shutil.which("python3")) if shutil.which("python3") else None,
    ]
    current = Path(sys.executable).resolve()
    for candidate in candidates:
        if candidate and candidate.is_file() and candidate.resolve() != current:
            os.execv(str(candidate), [str(candidate), *sys.argv])

    raise SystemExit(
        "ReportLab is required. Install it with `python3 -m pip install reportlab`, "
        "or set PORTFOLIO_PDF_PYTHON to a Python interpreter that provides it."
    )


ensure_pdf_runtime()

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
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
OUTPUT = ROOT / "output" / "pdf" / "kim-dowon-portfolio-submission.pdf"
PUBLIC_OUTPUT = ROOT / "public" / "kim-dowon-portfolio.pdf"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf")

PAPER = colors.HexColor("#F3F7FA")
WHITE = colors.HexColor("#FFFFFF")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#52657A")
COBALT = colors.HexColor("#0B63CE")
DEEP = colors.HexColor("#081B33")
LINE = colors.HexColor("#9EB0C0")
SOFT_LINE = colors.HexColor("#C6D3DF")
PALE_BLUE = colors.HexColor("#E6F0FC")


def register_fonts() -> str:
    name = "PortfolioKorean"
    pdfmetrics.registerFont(TTFont(name, str(FONT_PATH)))
    return name


FONT = register_fonts()


def make_style(name: str, **kwargs) -> ParagraphStyle:
    return ParagraphStyle(name, fontName=FONT, **kwargs)


TITLE = make_style("Title", fontSize=29, leading=38, textColor=WHITE, spaceAfter=10, wordWrap="CJK")
SUBTITLE = make_style("Subtitle", fontSize=11.5, leading=18, textColor=colors.HexColor("#C6DBED"), spaceAfter=8, wordWrap="CJK")
KICKER = make_style("Kicker", fontSize=8.5, leading=12, textColor=COBALT, spaceAfter=6, tracking=1.1)
KICKER_LIGHT = make_style("KickerLight", fontSize=8.5, leading=12, textColor=colors.HexColor("#8FC3FF"), spaceAfter=6, tracking=1.1)
H1 = make_style("H1", fontSize=21, leading=27, textColor=INK, spaceAfter=8, wordWrap="CJK")
H2 = make_style("H2", fontSize=12.5, leading=17, textColor=INK, spaceAfter=4, wordWrap="CJK")
ATLAS_TITLE = make_style("AtlasTitle", fontSize=11.2, leading=13.2, textColor=INK, spaceAfter=2, wordWrap="CJK")
ATLAS_SMALL = make_style("AtlasSmall", fontSize=8.5, leading=10.5, textColor=MUTED, wordWrap="CJK")
BODY = make_style("Body", fontSize=9.2, leading=14.2, textColor=INK, spaceAfter=5, wordWrap="CJK")
SMALL = make_style("Small", fontSize=8.5, leading=12.5, textColor=MUTED, wordWrap="CJK")
SMALL_DARK = make_style("SmallDark", fontSize=8.5, leading=12.5, textColor=INK, wordWrap="CJK")
LABEL = make_style("Label", fontSize=8.5, leading=11, textColor=COBALT, tracking=0.6, wordWrap="CJK")
LABEL_MUTED = make_style("LabelMuted", fontSize=8.5, leading=11, textColor=MUTED, tracking=0.35, wordWrap="CJK")
LABEL_LIGHT = make_style("LabelLight", fontSize=8.5, leading=11, textColor=colors.HexColor("#8FC3FF"), tracking=0.45, wordWrap="CJK")
METRIC = make_style("Metric", fontSize=16, leading=20, textColor=INK, wordWrap="CJK")
LINK = make_style("Link", fontSize=9, leading=14.5, textColor=colors.HexColor("#CBE5FF"), wordWrap="CJK")


def p(text: str, paragraph_style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(text, paragraph_style)


def page_heading(kicker: str, title: str, intro: str | None = None) -> list:
    parts = [p(kicker, KICKER), p(title, H1)]
    if intro:
        parts.append(p(intro, BODY))
    parts.append(Spacer(1, 4 * mm))
    return parts


def metric_grid(items: list[tuple[str, str]], cols: int = 3) -> Table:
    cells = [[p(value, METRIC), Spacer(1, 1.5 * mm), p(label, SMALL)] for value, label in items]
    rows = [cells[index : index + cols] for index in range(0, len(cells), cols)]
    while len(rows[-1]) < cols:
        rows[-1].append([p("", METRIC)])
    table = Table(rows, colWidths=[174 * mm / cols] * cols, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.55, SOFT_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
    ]))
    return table


def flow_panel(items: list[tuple[str, str, str]], width: float = 174 * mm) -> Table:
    cells = []
    for index, (label, title, detail) in enumerate(items):
        cells.append([p(label, LABEL), p(title, H2), p(detail, SMALL)])
        if index < len(items) - 1:
            cells.append([Spacer(1, 1), p("|", LABEL_MUTED), Spacer(1, 1)])
    separator_width = 4 * mm
    panel_width = (width - separator_width * (len(items) - 1)) / len(items)
    col_widths = [separator_width if index % 2 else panel_width for index in range(len(cells))]
    table = Table([cells], colWidths=col_widths)
    commands = [
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
    ]
    for index in range(1, len(cells), 2):
        commands.extend([
            ("BACKGROUND", (index, 0), (index, 0), PALE_BLUE),
            ("ALIGN", (index, 0), (index, 0), "CENTER"),
            ("LEFTPADDING", (index, 0), (index, 0), 0),
            ("RIGHTPADDING", (index, 0), (index, 0), 0),
        ])
    table.setStyle(TableStyle(commands))
    return table


def process_grid(items: list[tuple[str, str, str]]) -> Table:
    cells = [[p(label, LABEL), p(title, H2), p(detail, SMALL)] for label, title, detail in items]
    table = Table([cells[:2], cells[2:]], colWidths=[42 * mm, 42 * mm], rowHeights=[29 * mm, 29 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, SOFT_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return table


def case_card(number: str, title: str, role: str, summary: str, decisions: list[str], evidence: str, context: str) -> KeepTogether:
    header = Table([[p(f"CASE {number}", LABEL_LIGHT), p(role, LABEL_LIGHT)]], colWidths=[31 * mm, 143 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DEEP),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#315372")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.8 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.8 * mm),
    ]))
    decision_rows = [[p(f"0{index + 1}", LABEL), p(item, SMALL_DARK)] for index, item in enumerate(decisions)]
    decision_table = Table(decision_rows, colWidths=[12 * mm, 66 * mm])
    decision_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, SOFT_LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.45, SOFT_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm),
    ]))
    evidence_panel = Table([
        [p("EVIDENCE", LABEL), p(evidence, SMALL_DARK)],
        [p("CONTEXT", LABEL_MUTED), p(context, SMALL)],
    ], colWidths=[23 * mm, 64 * mm])
    evidence_panel.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8EB4DC")),
        ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#B7CADC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm),
    ]))
    body = Table([[[p(title, H2), p(summary, BODY)], [decision_table, Spacer(1, 2.5 * mm), evidence_panel]]], colWidths=[78 * mm, 96 * mm])
    body.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
        ("LINEBEFORE", (1, 0), (1, 0), 0.6, SOFT_LINE),
    ]))
    return KeepTogether([header, body, Spacer(1, 5 * mm)])


def atlas_grid(items: list[tuple[str, str, str]]) -> Table:
    cells = []
    for index, (title, meta, detail) in enumerate(items, start=1):
        cells.append([p(f"{index:02d} / {meta}", LABEL), Spacer(1, 0.7 * mm), p(title, ATLAS_TITLE), p(detail, ATLAS_SMALL)])
    rows = [cells[index : index + 3] for index in range(0, len(cells), 3)]
    while len(rows[-1]) < 3:
        rows[-1].append([p("", SMALL)])
    table = Table(rows, colWidths=[58 * mm] * 3, rowHeights=[27 * mm] * len(rows))
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.8, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, SOFT_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    return table


def career_rows() -> Table:
    rows = [
        ("2026 - 현재", "OpenDoorLabs", "Founder / AI Product Engineer", "OpenStockAI 운영, OpenDataLabs와 OpenAlarm 개발"),
        ("2025.10 - 현재", "와이즈에이아이", "AI Agent Pro", "병원 상담·예약 Agent, AX Admin, Browser Agent, 운영 dashboard"),
        ("2024.09 - 2025.10", "에스비티글로벌", "Frontend Engineer / AI Agent", "제조 도면 편집기, diagram, spreadsheet, 3D digital twin"),
        ("2023.04 - 2024.09", "인포인", "Frontend Developer", "항공 제조·물류 3D digital twin, simulation, kiosk"),
        ("2016.08 - 2017.11", "제이셋스태츠칩팩코리아(유)", "QA ShiftLeader 책임", "공정 불량 추적·통계 dashboard 전담 개발, 추적 시간 70% 단축"),
    ]
    data = [[p(period, LABEL), [p(company, H2), p(role, LABEL_MUTED), p(detail, SMALL)]] for period, company, role, detail in rows]
    table = Table(data, colWidths=[28 * mm, 62 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.45, SOFT_LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.8 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.8 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.3 * mm),
    ]))
    return table


def draw_page(canvas, doc) -> None:
    page = canvas.getPageNumber()
    width, height = A4
    canvas.saveState()
    if page == 1:
        canvas.setFillColor(DEEP)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor("#163B5C"))
        canvas.setLineWidth(0.45)
        for x in range(14, 211, 14):
            canvas.line(x * mm, 0, x * mm, height)
        for y in range(14, 298, 14):
            canvas.line(0, y * mm, width, y * mm)
        canvas.setFillColor(COBALT)
        canvas.rect(0, 0, 7 * mm, height, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#5EE8A2"))
        canvas.rect(184 * mm, 268 * mm, 3 * mm, 3 * mm, fill=1, stroke=0)
    else:
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setStrokeColor(SOFT_LINE)
        canvas.setLineWidth(0.6)
        canvas.line(18 * mm, 19 * mm, 192 * mm, 19 * mm)
        canvas.setFont(FONT, 8.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, 12.5 * mm, "KIM DOWON / PRODUCT ENGINEER")
        canvas.drawRightString(192 * mm, 12.5 * mm, f"{page:02d} / 06")
    canvas.restoreState()


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=24 * mm,
        title="김도원 포트폴리오", author="김도원", subject="AI Agent and Frontend Product Engineering Portfolio",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="portfolio", frames=[frame], onPage=draw_page)])

    story = [
        Spacer(1, 20 * mm),
        p("SYSTEM / PRODUCT ENGINEERING PORTFOLIO", KICKER_LIGHT),
        p("AI Agent를 설계하고,<br/>사용자가 실제로 쓰는<br/>프론트엔드까지 만듭니다.", TITLE),
        p("병원 상담과 예약, 금융 리서치, 제조 도면 편집에서 문제 정의부터 Agent workflow, interface, evaluation, operation까지 맡았습니다.", SUBTITLE),
        Spacer(1, 18 * mm),
        flow_panel([
            ("01 / DEFINE", "종료 조건", "사용자가 끝내야 하는 일"),
            ("02 / ROUTE", "역할과 규칙", "Agent 판단과 결정적 code"),
            ("03 / EXPLAIN", "상태 UI", "현재 단계와 다음 행동"),
            ("04 / VERIFY", "회귀 검증", "실패 사례와 운영 근거"),
        ]),
        Spacer(1, 29 * mm),
        p("5 YEARS / React / Next.js / TypeScript / LangGraph / Python", SUBTITLE),
        p("<link href='https://github.com/KoreaMoney' color='#CBE5FF'>github.com/KoreaMoney</link><br/><link href='mailto:kimdowon1404@gmail.com' color='#CBE5FF'>kimdowon1404@gmail.com</link> / 010-9076-2409<br/><link href='https://www.linkedin.com/in/dowon-kim-415646237' color='#CBE5FF'>linkedin.com/in/dowon-kim-415646237</link>", LINK),
        PageBreak(),
        *page_heading("SELECTED EVIDENCE / 01", "기술명보다 전후 변화와 검증 방법을 먼저 봅니다.", "성과 수치는 제공 자료와 공개 가능한 내부 기록 범위에서만 사용했습니다. 서로 다른 프로젝트의 수치는 동일 조건의 benchmark가 아닙니다."),
        metric_grid([
            ("15초 | 7초", "10개 언어 실시간 번역 Agent / 내부 전후 측정 / 약 53% 단축"),
            ("45초 | 8초", "AI LayoutEditor loading / 내부 전후 측정 / 약 82% 단축"),
            ("40%", "AI LayoutEditor memory usage / 동일 프로젝트 내부 측정"),
            ("300개", "OpenStockAI 대표 질의 평가 세트"),
            ("175개", "OpenStockAI Agent routing 계약 테스트"),
            ("100+", "LayoutEditor에서 다룬 편집 component"),
        ]),
        Spacer(1, 7 * mm),
        p("EVIDENCE PIPELINE", KICKER),
        flow_panel([
            ("01 / TASK", "종료 조건 정의", "기능보다 사용자 완료 상태"),
            ("02 / BOUNDARY", "추론 경계 분리", "의도 해석 / 검증 / 계산"),
            ("03 / TRACE", "상태와 출처 표시", "단계 / 기준일 / 불확실성"),
            ("04 / TEST", "실패 사례 고정", "계약 test / snapshot / scenario"),
        ]),
        Spacer(1, 7 * mm),
        Table([[[p("AI AGENT ENGINEERING", LABEL), p("LangGraph 상태 흐름, tool routing, guardrail, evaluation, observability를 제품 조건에 맞춰 설계합니다. 출처와 기준일, 불확실성을 결과와 함께 보여 사용자가 검증할 수 있게 만듭니다.", SMALL_DARK)], [p("FRONTEND PRODUCT ENGINEERING", LABEL), p("React와 Next.js로 상담, 예약, dashboard, diagram, 3D 화면을 구현합니다. 복잡한 상태를 화면 구조로 풀고 rendering 비용과 변경 영향 범위를 측정해 줄입니다.", SMALL_DARK)]]], colWidths=[87 * mm, 87 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WHITE), ("BOX", (0, 0), (-1, -1), 0.8, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.5, SOFT_LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
        ])),
        Spacer(1, 7 * mm),
        p("MEASUREMENT CONTEXT", KICKER),
        p("15초 | 7초, 45초 | 8초, memory 40%는 각 프로젝트 내부의 개선 전후 기록입니다. 측정 환경과 표본 규모는 공개 자료에 포함되지 않아 외부 제품과의 절대 성능 비교로 해석하지 않습니다. 300개, 175개, 8개 scenario, 8개 snapshot은 OpenStockAI의 평가 자산 수입니다.", SMALL),
        PageBreak(),
        *page_heading("SELECTED WORK / 02", "문제를 제품으로 끝까지 푼 사례", "사용자 흐름, 구현 판단, 검증 근거를 같은 화면에서 읽을 수 있도록 정리했습니다."),
        case_card("01", "병원 상담과 예약 Agent", "AI Agent Pro / Frontend 설계 및 개발", "진료 정보 탐색, AI 상담, 상담원 연결, 예약 생성과 조회, 변경, 취소를 하나의 사용자 흐름으로 묶었습니다.", ["병원별 정책과 FAQ, 예약 설정을 상태 model에 반영", "날짜와 시술, 동적 입력 form의 예외 상태를 화면에서 설명", "상담과 예약의 예외 상태를 운영 화면과 연결"], "공개 서비스에서 상담, 예약, 조회와 변경, 취소 흐름을 확인할 수 있습니다.", "공개 가능한 제품 흐름을 근거로 작성했으며 고객사 내부 전환 지표는 포함하지 않았습니다."),
        case_card("02", "10개 언어 실시간 번역 Agent", "AI Agent Pro / 설계 및 개발", "번역 요청부터 언어 분기, 문맥 유지, 결과 반환까지 10개 언어의 실시간 번역 흐름을 직접 설계하고 개발했습니다.", ["번역 요청을 대상 언어별 처리 경로로 분기", "대화 문맥을 유지해 결과를 반환하는 Agent 흐름 구현", "중복 model 호출을 제거해 불필요한 처리 차단"], "내부 측정 처리 시간 15초 | 7초, 약 53% 단축.", "동일 프로젝트의 개선 전후 내부 기록입니다. 측정 환경과 표본 규모는 공개하지 않습니다."),
        PageBreak(),
        *page_heading("SELECTED WORK / CONTINUED / 03", "검증 가능한 Agent와 복잡한 편집 UI", "추론은 설명 가능하게, 계산과 편집 상태는 예측 가능하게 분리했습니다."),
        case_card("03", "OpenStockAI", "Founder / AI Product Engineer", "보유 종목과 시장 정보, 뉴스와 공시를 연결하고, 여러 전문 역할의 조사 과정을 사용자가 검증할 수 있게 설계했습니다.", ["질문의 의도를 역할별 Agent workflow로 routing", "출처, 기준일, 불확실성을 결과와 함께 표시", "LLM 추론과 결정적 portfolio 계산을 분리"], "300개 대표 질의 / 175개 routing 계약 테스트 / 8개 실행 scenario / 8개 회귀 snapshot.", "표기 수치는 프로젝트 내부 평가 자산의 개수입니다. 모델 품질의 외부 benchmark 점수는 아닙니다."),
        case_card("04", "AI LayoutEditor", "AI Agent Developer / Frontend 구현", "100개가 넘는 편집 component의 loading과 실시간 편집 구조를 정리해 복잡한 제조 도면 화면의 대기 비용을 줄였습니다.", ["drag와 multi-select, property editing의 상태 경계를 분리", "rendering 범위와 data 처리 경로를 profiling", "사용자가 오래 기다리는 구간부터 개선 순서를 결정"], "내부 프로젝트 측정에서 45초 | 8초, memory usage 40% 절감.", "동일 프로젝트의 개선 전후 내부 기록입니다. 측정 환경과 표본 규모는 공개하지 않습니다."),
        PageBreak(),
        *page_heading("PROJECT ATLAS / 04", "19 BUILDS / 5 YEARS", "Agent, product UI, 3D web, digital twin, QA system까지 실제 업무 범위를 한 장에 모았습니다."),
        atlas_grid([
            ("병원 상담예약 Agent", "AI AGENT / 2025", "상담, 연결, 예약 생성·조회·변경·취소"),
            ("10개 언어 실시간 번역 Agent", "AI AGENT / 2025", "10개 언어 흐름 설계·개발 / 15초 | 7초"),
            ("AX Agent Admin", "FRONTEND / 2025", "Agent 설정과 운영 상태 관리"),
            ("Browser + Observer Agent", "AI AGENT / 2025", "browser 실행과 관찰 결과 연결"),
            ("Capacitor app", "FRONTEND / 2025", "mobile 실행 환경과 상태 흐름 정리"),
            ("ROI Dashboard", "PRODUCT UI / 2025", "비용과 운영 결과 비교"),
            ("OpenStockAI", "AI PRODUCT / 2026", "300개 질의 / 175개 계약 테스트"),
            ("OpenDataLabs", "R&D / 2026", "8개 논문 / 40개 요구사항과 테스트"),
            ("OpenAlarm", "AI PRODUCT / 2026", "기상·준비·출발 3단계 알림과 AI 일기 회고"),
            ("AI LayoutEditor", "FRONTEND / 2025", "45초 | 8초 / memory 40% 감소"),
            ("sweet-diagram", "OPEN SOURCE / 2025", "Creator / npm v0.4.7"),
            ("Custom Spreadsheet", "FRONTEND / 2025", "기업용 편집 상태와 업무 규칙"),
            ("INFORACTIVE 3D", "3D WEB / 2024", "산업 data 3D 탐색"),
            ("A350 Digital Twin", "DIGITAL TWIN / 2024", "고객사명 비공개 항공 제조 화면"),
            ("Aviation Metaverse", "3D WEB / 2024", "항공 제조 공간과 정보 연결"),
            ("Logistics Profit Simulation", "SIMULATION / 2024", "물류 조건별 손익 비교"),
            ("BeyonD Digital Twin", "DIGITAL TWIN / 2023", "현장 설비와 운영 정보 연결"),
            ("Photo Kiosk", "KIOSK / 2023", "촬영, 선택, 출력 동선"),
            ("Semiconductor QA Dashboard", "QA SYSTEM / 2017", "QA ShiftLeader 책임 / 불량 추적 시간 70% 단축"),
        ]),
        Spacer(1, 4 * mm),
        p("수치가 있는 항목은 제공 자료의 내부 기록 범위입니다. 고객사명과 내부 매출·전환 정보는 공개하지 않았습니다.", SMALL),
        PageBreak(),
        *page_heading("ENGINEERING PRACTICE + CAREER / 05", "현장 품질에서 제품 소유까지", "문제를 정의하고 경계를 나누며, 사용자가 이해할 수 있는 상태와 검증 근거로 마무리합니다."),
        Table([[
            [
                p("WORKING LOOP", KICKER),
                process_grid([("01 / DEFINE", "종료 조건", "사용자가 끝내야 하는 일"), ("02 / BOUNDARY", "경계 분리", "Agent 추론 / 결정적 code"), ("03 / EXPLAIN", "상태 설명", "단계 / 입력 / 실패 이유"), ("04 / VERIFY", "실패 검증", "모호함 / 권한 / data / tool")]),
                Spacer(1, 5 * mm), p("FRONTEND CODE QUALITY", KICKER),
                Table([
                    [p("가독성", LABEL), p("조건과 계산의 이름이 의도를 설명", SMALL_DARK)],
                    [p("예측 가능성", LABEL), p("같은 범주의 함수는 같은 결과 형태", SMALL_DARK)],
                    [p("응집도", LABEL), p("함께 바뀌는 화면, 상태, 테스트를 가까이", SMALL_DARK)],
                    [p("결합도", LABEL), p("안정된 primitive만 공유하고 변화는 분리", SMALL_DARK)],
                ], colWidths=[23 * mm, 61 * mm], style=TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), WHITE), ("BOX", (0, 0), (-1, -1), 0.7, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.45, SOFT_LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2.5 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 2.5 * mm),
                    ("TOPPADDING", (0, 0), (-1, -1), 2.1 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.1 * mm),
                ])),
                Spacer(1, 5 * mm), p("EDUCATION", KICKER),
                p("한양사이버대학교 컴퓨터공학 학사 / 2024.02 - 2026.02<br/>영진전문대 전자정보통신계열 전문학사 / 2012.03 - 2017.02", SMALL_DARK),
                Spacer(1, 4 * mm), p("CONTACT", KICKER),
                p("<link href='mailto:kimdowon1404@gmail.com' color='#0B63CE'>kimdowon1404@gmail.com</link><br/>010-9076-2409<br/><link href='https://github.com/KoreaMoney' color='#0B63CE'>github.com/KoreaMoney</link><br/><link href='https://www.linkedin.com/in/dowon-kim-415646237' color='#0B63CE'>linkedin.com/in/dowon-kim-415646237</link>", SMALL_DARK),
            ],
            [p("CAREER LOG", KICKER), career_rows(), Spacer(1, 4 * mm), p("MEASUREMENT NOTE", KICKER), p("Semiconductor QA Dashboard의 불량 추적 시간 70% 단축은 재직 당시 내부 업무 개선 기록입니다. 상세 표본과 측정 환경은 공개하지 않습니다.", SMALL)],
        ]], colWidths=[84 * mm, 90 * mm], style=TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (0, 0), 0), ("RIGHTPADDING", (0, 0), (0, 0), 4 * mm),
            ("LEFTPADDING", (1, 0), (1, 0), 4 * mm), ("RIGHTPADDING", (1, 0), (1, 0), 0),
            ("LINEBEFORE", (1, 0), (1, 0), 0.7, SOFT_LINE), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ])),
    ]

    doc.build(story)
    shutil.copy2(OUTPUT, PUBLIC_OUTPUT)
    print(OUTPUT)
    print(PUBLIC_OUTPUT)


if __name__ == "__main__":
    build()

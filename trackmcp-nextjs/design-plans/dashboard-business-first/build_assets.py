from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).parent
SCREENS = ROOT / "screens"
SCREENS.mkdir(exist_ok=True)

INK = "#171917"
MUTED = "#64706a"
FAINT = "#8b958f"
LINE = "#dfe6e1"
PAPER = "#ffffff"
CANVAS = "#f6f8f6"
BRAND = "#16a34a"
BRAND_DARK = "#146c37"
BRAND_SOFT = "#e7f6ec"
AMBER = "#b7791f"
AMBER_SOFT = "#fff5df"
BLUE = "#4169a5"
BLUE_SOFT = "#edf3ff"
RED = "#b54b4b"
RED_SOFT = "#fff0ef"

ICONS = {
    "overview": '<path d="M4 20V4h16v16"/><path d="M8 17v-4"/><path d="M12 17V8"/><path d="M16 17v-6"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "journeys": '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.5 8.5 15.5 15.5"/><path d="M18 6h.01"/>',
    "quality": '<path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/>',
    "issues": '<path d="M10.3 3.2 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "evidence": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    "setup": '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.5h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2.5V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.6 1h.4v2.5H21a1.7 1.7 0 0 0-1.6 1.5Z"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    "chevron": '<path d="m6 9 6 6 6-6"/>',
    "arrow": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "external": '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    "refresh": '<path d="M20 11a8 8 0 1 0 1 4"/><path d="M20 5v6h-6"/>',
    "check": '<path d="m5 12 4 4L19 6"/>',
    "lock": '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "keyboard": '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>',
}


def esc(value):
    return escape(str(value))


def icon(name, x, y, size=16, color=MUTED, stroke=1.8):
    body = ICONS[name]
    return f'<g transform="translate({x} {y})" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round"><svg width="{size}" height="{size}" viewBox="0 0 24 24">{body}</svg></g>'


def mark(x, y, size=22, color="#ffffff", accent=BRAND):
    s = size / 32
    return f'''<g transform="translate({x} {y}) scale({s})" fill="none">
      <g stroke="{color}" stroke-width="3.4" stroke-linecap="round"><path d="M16 16 Q20.5 10 25 7"/><path d="M16 16 Q10 20.5 7 25"/><path d="M16 16 Q22.5 20 25 25"/></g>
      <g fill="{color}"><circle cx="6.6" cy="6.6" r="4.4"/><circle cx="7" cy="25" r="4"/><circle cx="25" cy="25" r="4"/></g>
      <circle cx="25" cy="7" r="4" fill="{accent}"/><circle cx="16" cy="16" r="4.4" fill="{color}"/>
    </g>'''


def logo(x, y, dark=False):
    text_track = PAPER if dark else INK
    text_mcp = "#86efac" if dark else BRAND
    return f'''<g><rect x="{x}" y="{y}" width="28" height="28" rx="7" fill="{BRAND}"/>{mark(x+4, y+4, 20)}
      <text x="{x+36}" y="{y+22}" font-family="Satoshi, Inter, Arial, sans-serif" font-size="21" font-weight="600" letter-spacing="-1">track<tspan fill="{text_mcp}">mcp</tspan></text></g>'''


def text(x, y, value, size=13, color=INK, weight=400, anchor="start", letter=0):
    return f'<text x="{x}" y="{y}" font-family="Inter, Arial, sans-serif" font-size="{size}px" font-weight="{weight}" fill="{color}" text-anchor="{anchor}" letter-spacing="{letter}px">{esc(value)}</text>'


def rect(x, y, w, h, fill=PAPER, stroke=LINE, r=10, sw=1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


def button(x, y, w, label, kind="secondary", icon_name=None, disabled=False):
    if disabled:
        fill, stroke, fg = "#f2f4f2", LINE, "#a2aaa5"
    elif kind == "primary":
        fill, stroke, fg = INK, INK, PAPER
    elif kind == "soft":
        fill, stroke, fg = BRAND_SOFT, "#b7ddc4", BRAND_DARK
    else:
        fill, stroke, fg = PAPER, "#cdd7d1", "#34413a"
    out = rect(x, y, w, 34, fill, stroke, 7)
    tx = x + 13
    if icon_name:
        out += icon(icon_name, x + 12, y + 9, 15, fg, 1.8)
        tx = x + 34
    out += text(tx, y + 22, label, 12, fg, 600)
    return out


def shell(w, h, active, title, kicker, subtitle, range_label="Last 30 days"):
    main_x = 240
    content_x = 272
    content_w = w - content_x - 32
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">', f'<rect width="{w}" height="{h}" fill="{CANVAS}"/>', rect(0, 0, main_x, h, PAPER, LINE, 0), rect(main_x, 0, w-main_x, 64, PAPER, LINE, 0), logo(22, 18)]
    out += [text(22, 78, "QBO MCP", 13, INK, 650), text(22, 98, "Production workspace", 11, FAINT, 400)]
    nav = [("overview", "Overview"), ("journeys", "Journeys"), ("quality", "Quality"), ("issues", "Issues")]
    y = 144
    for name, label in nav:
        if name == active:
            out.append(rect(12, y-23, 204, 38, INK, INK, 8))
            out.append(icon(name, 28, y-12, 16, PAPER))
            out.append(text(52, y+1, label, 13, PAPER, 600))
        else:
            out.append(icon(name, 28, y-12, 16, MUTED))
            out.append(text(52, y+1, label, 13, "#46524b", 500))
        y += 42
    out += [text(22, 334, "MORE", 10, FAINT, 700, letter=1.4), icon("users", 28, 350, 16, MUTED), text(52, 363, "AI clients", 13, "#46524b", 500), icon("evidence", 28, 392, 16, MUTED), text(52, 405, "Evidence", 13, "#46524b", 500), icon("setup", 28, 434, 16, MUTED), text(52, 447, "Setup", 13, "#46524b", 500), f'<line x1="20" y1="{h-82}" x2="220" y2="{h-82}" stroke="{LINE}"/>', text(22, h-48, "K", 13, PAPER, 700), f'<circle cx="31" cy="{h-53}" r="14" fill="#7fae90"/>', text(55, h-50, "krishnaatmu workspace", 11, MUTED, 500)]
    out += [text(content_x, 24, kicker.upper(), 10, FAINT, 700, letter=1.5), text(content_x, 48, title, 20, INK, 700), button(w-300, 15, 116, "Last 30 days", "secondary", "chevron"), button(w-174, 15, 88, "Live data", "secondary", "users"), button(w-74, 15, 38, "", "secondary", "refresh")]
    out += [text(content_x, 100, subtitle, 14, MUTED, 400), text(content_x, 123, f"Selected period: {range_label}", 11, FAINT, 400)]
    return out, content_x, content_w


def finish(parts):
    return "".join(parts).replace("·", " - ") + "</svg>"


def overview(w, h):
    out, x, cw = shell(w, h, "overview", "How is your MCP product doing?", "QBO MCP / PRODUCTION", "See whether it is being used, what work people are trying to do, and where to focus next.")
    out += [rect(x, 144, cw, 56, "#f3f5f3", LINE, 10), icon("info", x+18, 163, 17, MUTED), text(x+44, 168, "Live mode selected", 13, INK, 650), text(x+44, 188, "Server-observed events are shown here. This is a data-source state, not a product-health signal.", 11, MUTED), button(x+cw-152, 155, 132, "Inspect sessions", "secondary", "arrow")]
    gap = 12; card_w = (cw - gap*3) / 4
    cards = [("Tool calls", "60", "Server-observed calls", "overview"), ("Sessions", "18", "Sessions in selected period", "users"), ("Errors", "3", "3 / 60 call denominator", "issues"), ("Work completed", "12 / 18", "Explicit outcomes · 66.7%", "check")]
    for i, (label, value, detail, ic) in enumerate(cards):
        cx = x + i*(card_w+gap)
        out += [rect(cx, 216, card_w, 98), icon(ic, cx+card_w-33, 235, 17, BRAND_DARK if i != 2 else AMBER), text(cx+18, 243, label, 11, MUTED, 650, letter=.4), text(cx+18, 282, value, 27, INK, 700), text(cx+18, 301, detail, 10, MUTED, 400)]
    left = cw*0.63; right = cw-left-gap
    out += [rect(x, 334, left, 214), text(x+20, 365, "What needs attention", 17, INK, 700), text(x+20, 388, "1 observed signal · 1,124 eligible calls · threshold p95 > 1.2s", 11, MUTED), rect(x+20, 410, left-40, 86, AMBER_SOFT, "#eccb82", 8), icon("issues", x+38, 428, 17, AMBER), text(x+66, 432, "Observed signal", 10, AMBER, 700, letter=1), text(x+66, 456, "run_query is slower than its threshold", 14, INK, 650), text(x+66, 478, "p95 1.4s · 1,124 calls · confidence: medium", 11, MUTED), button(x+20, 508, 130, "Review evidence", "primary", "arrow"), rect(x+left+gap, 334, right, 214), text(x+left+gap+20, 365, "Work completed", 17, INK, 700), text(x+left+gap+20, 388, "Explicit workflow outcomes only", 11, MUTED), text(x+left+gap+20, 424, "12", 27, INK, 700), text(x+left+gap+62, 424, "completed", 11, MUTED, 600), text(x+left+gap+20, 448, "of 18 explicit outcomes", 12, MUTED), text(x+left+gap+20, 474, "Source: workflow outcome events", 11, MUTED), text(x+left+gap+20, 498, "No session-based inference", 11, FAINT, 400)]
    out += [rect(x, 572, cw, h-600, PAPER, LINE, 10), text(x+20, 603, "Choose the next question", 16, INK, 700), text(x+20, 625, "Start with the business signal; technical evidence is one click away.", 11, MUTED), button(x+20, 644, 126, "See journeys", "secondary", "journeys"), button(x+158, 644, 146, "Review issues", "secondary", "issues"), button(x+316, 644, 145, "Open Evidence", "secondary", "evidence")]
    return finish(out)


def adoption(w, h):
    out, x, cw = shell(w, h, "overview", "Adoption", "OVERVIEW / ADOPTION", "Answer: is the MCP product being used, and by which AI clients?")
    out += [rect(x, 144, cw, 52, "#f3f5f3", LINE, 10), icon("info", x+18, 161, 16, MUTED), text(x+44, 167, "Live mode selected", 13, INK, 650), text(x+44, 185, "AI clients observed at the server boundary during the selected period.", 11, MUTED)]
    out += [rect(x, 216, 320, 126), text(x+20, 244, "AI clients observed", 12, MUTED, 650), text(x+20, 288, "4", 32, INK, 700), text(x+20, 315, "unique client adapters", 11, MUTED), rect(x+344, 216, cw-344, 126), text(x+364, 244, "Activity trend", 12, MUTED, 650), text(x+364, 277, "1,428", 28, INK, 700), text(x+364, 304, "server-observed calls · 30 days", 11, MUTED), button(x+cw-175, 232, 138, "Open Evidence", "secondary", "evidence")]
    out += [rect(x, 362, cw, 300, PAPER, LINE, 10), text(x+20, 393, "Observed AI clients", 17, INK, 700), text(x+20, 416, "Counts are adapters observed, not end users or customers.", 11, MUTED), text(x+22, 454, "AI client", 11, FAINT, 700), text(x+230, 454, "Calls", 11, FAINT, 700), text(x+330, 454, "Share", 11, FAINT, 700), text(x+472, 454, "Trend", 11, FAINT, 700)]
    rows = [("Claude Desktop", "648", "45%", "steady"), ("Cursor", "426", "30%", "up"), ("ChatGPT", "284", "20%", "steady"), ("Other observed", "70", "5%", "low volume")]
    for i, row in enumerate(rows):
        yy = 486 + i*40
        out += [f'<line x1="{x+20}" y1="{yy+15}" x2="{x+cw-20}" y2="{yy+15}" stroke="{LINE}"/>', text(x+22, yy, row[0], 13, INK, 600), text(x+230, yy, row[1], 13, INK, 600), text(x+330, yy, row[2], 13, MUTED), text(x+472, yy, row[3], 12, MUTED)]
    out += [button(x+20, 684, 154, "View client detail", "primary", "arrow"), text(x+194, 706, "Return to Overview after inspection", 11, FAINT)]
    return finish(out)


def journeys(w, h):
    out, x, cw = shell(w, h, "journeys", "Journeys", "UNDERSTAND / JOURNEYS", "Answer: what work are people trying to complete?")
    out += [rect(x, 144, cw, 56, "#f3f5f3", LINE, 10), icon("info", x+18, 163, 17, MUTED), text(x+44, 168, "Live mode selected", 13, INK, 650), text(x+44, 188, "Journeys are grouped from explicit workflow outcome events and observed tool sequences.", 11, MUTED), button(x+cw-144, 155, 124, "View outcomes", "secondary", "check")]
    out += [rect(x, 216, cw, 105, PAPER, LINE, 10), text(x+20, 245, "Top observed journeys", 17, INK, 700), text(x+20, 269, "Ranked by eligible volume; completion uses explicit outcomes only.", 11, MUTED), button(x+cw-154, 232, 134, "Open Evidence", "secondary", "evidence")]
    headers = [(x+20, "Journey"), (x+370, "Observed volume"), (x+520, "Completed"), (x+675, "Next action")]
    for hx, label in headers: out.append(text(hx, 350, label, 11, FAINT, 700))
    rows = [("Find an invoice", "412 sessions", "12 / 18 outcomes", "Review evidence"), ("List open work", "305 sessions", "No outcomes", "Set up outcomes"), ("Create a report", "198 sessions", "7 / 9 outcomes", "See capability detail")]
    for i, (a,b,c,d) in enumerate(rows):
        yy = 389 + i*70
        out += [rect(x, yy-28, cw, 58, PAPER, LINE, 0), icon("journeys", x+20, yy-11, 16, BRAND_DARK), text(x+48, yy, a, 13, INK, 600), text(x+370, yy, b, 12, MUTED), text(x+520, yy, c, 12, MUTED), button(x+675, yy-18, 142, d, "secondary", "arrow")]
    out += [rect(x, 612, cw, 76, BLUE_SOFT, "#c5d6f4", 10), icon("info", x+20, 634, 16, BLUE), text(x+46, 638, "No outcome event?", 13, INK, 650), text(x+46, 660, "TrackMCP cannot infer completion from sessions. Configure explicit workflow outcomes in Setup.", 11, MUTED), button(x+cw-156, 630, 134, "Open Setup", "secondary", "setup")]
    return finish(out)


def quality(w, h):
    out, x, cw = shell(w, h, "quality", "Quality", "IMPROVE / QUALITY", "Answer: which capabilities help or hinder the work people are trying to complete?")
    out += [rect(x, 144, cw, 56, "#f3f5f3", LINE, 10), icon("info", x+18, 163, 17, MUTED), text(x+44, 168, "Live mode selected", 13, INK, 650), text(x+44, 188, "Server-observed capability quality. Bounded results are labeled where the API caps the response.", 11, MUTED), button(x+cw-132, 155, 112, "See Issues", "secondary", "issues")]
    out += [rect(x, 216, cw, 84, PAPER, LINE, 10), text(x+20, 242, "Capability quality", 16, INK, 700), text(x+20, 266, "Showing a bounded result. Narrow the period or scope to inspect more precisely.", 11, MUTED), button(x+cw-166, 232, 146, "Open Evidence", "secondary", "evidence")]
    out += [rect(x, 322, cw, 300, PAPER, LINE, 10), text(x+20, 354, "Capabilities", 17, INK, 700), text(x+20, 378, "Latency and error signals are evidence, not a product health score.", 11, MUTED), text(x+22, 418, "Capability", 11, FAINT, 700), text(x+360, 418, "Calls", 11, FAINT, 700), text(x+460, 418, "p95", 11, FAINT, 700), text(x+560, 418, "Signal", 11, FAINT, 700), text(x+720, 418, "Evidence", 11, FAINT, 700)]
    rows = [("run_query", "1,124", "1.4s", "Observed signal", "threshold p95 > 1.2s"), ("list_invoices", "842", "410ms", "Within observed range", "review detail"), ("create_report", "18", "N/A", "Insufficient evidence", "minimum 30 calls")]
    for i, row in enumerate(rows):
        yy = 455 + i*56
        out += [f'<line x1="{x+20}" y1="{yy+16}" x2="{x+cw-20}" y2="{yy+16}" stroke="{LINE}"/>', text(x+22, yy, row[0], 13, INK, 600), text(x+360, yy, row[1], 12, MUTED), text(x+460, yy, row[2], 12, MUTED), text(x+560, yy, row[3], 12, row[3].startswith("Observed") and AMBER or MUTED, 600), text(x+720, yy, row[4], 11, MUTED)]
    out += [rect(x+cw-18, 436, 6, 150, "#eef1ef", "#eef1ef", 3), rect(x+cw-18, 450, 6, 55, "#9eaaa2", "#9eaaa2", 3), button(x+20, 646, 146, "Review run_query", "primary", "arrow"), text(x+184, 668, "Contained table scroll region; more rows below.", 11, FAINT)]
    return finish(out)


def capabilities(w, h):
    return quality(w, h).replace("Quality</text>", "Capabilities</text>", 1).replace("IMPROVE / QUALITY", "UNDERSTAND / CAPABILITIES", 1).replace("Answer: which capabilities help or hinder the work people are trying to complete?", "Answer: which capabilities are being used and what work do they support?", 1).replace("Capability quality", "Observed capabilities", 1).replace("Capabilities", "Capabilities", 1)


def issues(w, h):
    out, x, cw = shell(w, h, "issues", "Issues", "IMPROVE / ISSUES", "Answer: what deserves attention first, and how strong is the evidence?")
    out += [rect(x, 144, cw, 56, "#f3f5f3", LINE, 10), icon("info", x+18, 163, 17, MUTED), text(x+44, 168, "Live mode selected", 13, INK, 650), text(x+44, 188, "Rank: firing alerts, confirmed signals, lower-confidence signals, then insufficient evidence.", 11, MUTED), button(x+cw-150, 155, 130, "Open Evidence", "secondary", "evidence")]
    out += [rect(x, 216, cw, 112, PAPER, LINE, 10), text(x+20, 245, "Needs attention", 17, INK, 700), text(x+20, 268, "1 observed signal · 1,124 eligible calls · threshold p95 > 1.2s · confidence medium", 11, MUTED), text(x+20, 298, "No firing regression alerts are configured for this workspace.", 11, FAINT)]
    out += [text(x+22, 368, "Evidence state", 11, FAINT, 700), text(x+248, 368, "Signal", 11, FAINT, 700), text(x+508, 368, "Affected volume", 11, FAINT, 700), text(x+690, 368, "Confidence", 11, FAINT, 700), text(x+846, 368, "Action", 11, FAINT, 700)]
    rows = [("Confirmed observed issue", "run_query latency", "1,124 calls", "High", "Review evidence", AMBER_SOFT), ("Lower-confidence signal", "create_report errors", "18 calls", "Low", "Inspect volume", BLUE_SOFT), ("Insufficient evidence", "export_csv", "7 calls", "Minimum 30", "Need more data", "#f5f6f5")]
    for i, (a,b,c,d,e,fill) in enumerate(rows):
        yy = 406 + i*72
        out += [rect(x, yy-26, cw, 58, fill, LINE, 0), icon("issues" if i<2 else "info", x+20, yy-10, 16, AMBER if i==0 else BLUE if i==1 else FAINT), text(x+48, yy, a, 12, INK, 650), text(x+248, yy, b, 12, MUTED), text(x+508, yy, c, 12, MUTED), text(x+690, yy, d, 12, MUTED, 600), button(x+846, yy-17, 128, e, "secondary", "arrow")]
    out += [rect(x, 638, cw, 52, "#f3f5f3", LINE, 10), icon("info", x+18, 655, 16, MUTED), text(x+44, 660, "No evidence is shown as healthy when the API says the volume is insufficient.", 11, MUTED)]
    return finish(out)


def evidence(w, h):
    out, x, cw = shell(w, h, "evidence", "Evidence", "INVESTIGATE / EVIDENCE", "Inspect the bounded, redacted records behind a business signal and share a context-preserving link.")
    out += [rect(x, 144, cw, 70, PAPER, LINE, 10), icon("lock", x+20, 170, 17, MUTED), text(x+48, 172, "Evidence is server-observed and privacy-filtered", 13, INK, 650), text(x+48, 192, "Some events may be omitted because the response is capped. Payloads are redacted.", 11, MUTED), button(x+cw-154, 162, 134, "Copy link", "secondary", "external")]
    out += [rect(x, 230, cw, 94, BLUE_SOFT, "#c5d6f4", 10), text(x+20, 258, "Selected issue", 11, BLUE, 700, letter=1), text(x+20, 283, "run_query latency", 17, INK, 700), text(x+250, 283, "1,124 eligible calls · threshold p95 > 1.2s · confidence medium", 11, MUTED)]
    out += [rect(x, 342, cw, 304, PAPER, LINE, 10), text(x+20, 374, "Observed events", 17, INK, 700), text(x+20, 398, "Bounded result · 40 of 60 records shown", 11, MUTED), text(x+22, 438, "Time", 11, FAINT, 700), text(x+170, 438, "Session", 11, FAINT, 700), text(x+310, 438, "Capability", 11, FAINT, 700), text(x+510, 438, "Outcome", 11, FAINT, 700), text(x+670, 438, "Origin", 11, FAINT, 700)]
    rows = [("10:42:18", "s_9a31", "run_query", "Completed", "Legacy/Unknown"), ("10:41:56", "s_9a31", "run_query", "Error", "Server"), ("10:40:07", "s_78b2", "run_query", "Completed", "Server"), ("10:38:44", "s_78b2", "run_query", "Redacted", "Server")]
    for i, row in enumerate(rows):
        yy = 472 + i*38
        out += [f'<line x1="{x+20}" y1="{yy+13}" x2="{x+cw-20}" y2="{yy+13}" stroke="{LINE}"/>', text(x+22, yy, row[0], 12, MUTED), text(x+170, yy, row[1], 12, INK, 600), text(x+310, yy, row[2], 12, INK, 600), text(x+510, yy, row[3], 12, row[3]=="Error" and RED or MUTED, 600), text(x+670, yy, row[4], 12, FAINT)]
    out += [text(x+20, 622, "Some events may be omitted because the response is capped.", 11, MUTED), button(x+cw-196, 608, 176, "Narrow period or scope", "primary", "search")]
    return finish(out)


def setup(w, h):
    out, x, cw = shell(w, h, "setup", "Setup", "CONFIGURE / SETUP", "Make the data understandable before sharing it with the business team.")
    out += [rect(x, 144, cw, 64, "#f3f5f3", LINE, 10), icon("info", x+18, 166, 16, MUTED), text(x+44, 170, "Connection state", 13, INK, 650), text(x+44, 190, "Live mode is selected. TrackMCP does not infer connection health from this state.", 11, MUTED)]
    out += [rect(x, 230, cw, 380, PAPER, LINE, 10), text(x+20, 262, "Business readiness", 17, INK, 700), text(x+20, 286, "These steps make the Overview useful to a non-developer.", 11, MUTED)]
    steps = [("Define explicit workflow outcomes", "Required for Work completed numerator and denominator.", True), ("Name the important capabilities", "Plain-English names appear in Journeys and Quality.", True), ("Choose a default time range", "The review starts with 7, 30, or 90 days.", True), ("Invite the business stakeholder", "Share Overview first; keep Evidence as the detail path.", False)]
    for i, (a,b,done) in enumerate(steps):
        yy = 332 + i*62
        out += [icon("check" if done else "setup", x+24, yy-15, 18, BRAND_DARK if done else MUTED), text(x+58, yy-1, a, 13, INK, 650), text(x+58, yy+19, b, 11, MUTED), button(x+cw-158, yy-18, 138, "Review setup" if done else "Start setup", "soft" if done else "primary", "arrow")]
    out += [rect(x, 632, cw, 58, BLUE_SOFT, "#c5d6f4", 10), text(x+20, 658, "Need a technical answer?", 12, INK, 650), text(x+176, 658, "Open Evidence after the business question is clear.", 11, MUTED), button(x+cw-146, 644, 126, "Open Evidence", "secondary", "evidence")]
    return finish(out)


def navigation():
    w, h = 520, 680
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">', f'<rect width="{w}" height="{h}" fill="{CANVAS}"/>', rect(24, 22, 300, 636, PAPER, LINE, 14), logo(48, 48), text(48, 108, "QBO MCP", 13, INK, 650), text(48, 129, "Production workspace", 11, FAINT)]
    y=178
    for name, label in [("overview","Overview"),("journeys","Journeys"),("quality","Quality"),("issues","Issues")]:
        active = label == "Overview"
        if active: out.append(rect(38, y-24, 272, 40, INK, INK, 8))
        out += [icon(name, 56, y-12, 17, PAPER if active else MUTED), text(84, y+1, label, 13, PAPER if active else "#46524b", 600 if active else 500)]
        y += 50
    out += [text(48, 402, "MORE", 10, FAINT, 700, letter=1.3), icon("users", 56, 418, 17, MUTED), text(84, 431, "AI clients", 13, "#46524b", 500), icon("evidence", 56, 468, 17, MUTED), text(84, 481, "Evidence", 13, "#46524b", 500), icon("setup", 56, 518, 17, MUTED), text(84, 531, "Setup", 13, "#46524b", 500), text(48, 602, "Technical evidence stays one click away.", 11, MUTED)]
    return finish(out)


def interactions():
    w,h=1040,700
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',f'<rect width="{w}" height="{h}" fill="{CANVAS}"/>',text(32,42,"Interaction examples",24,INK,700),text(32,68,"Rendered state inventory for business-first controls and truthful data states.",13,MUTED)]
    states=[("Default",button(32,102,150,"Review evidence","primary","arrow")),("Hover",button(208,102,150,"Review evidence","soft","arrow")),("Focus-visible",f'<rect x="392" y="100" width="160" height="38" rx="8" fill="{PAPER}" stroke="{BLUE}" stroke-width="3"/><rect x="397" y="105" width="150" height="28" rx="5" fill="none" stroke="#bcd0f0"/><text x="408" y="124" font-family="Inter" font-size="12" font-weight="600" fill="{INK}">Review evidence</text>'),("Pressed",f'<rect x="568" y="102" width="150" height="34" rx="7" fill="#0e522a"/><text x="583" y="124" font-family="Inter" font-size="12" font-weight="600" fill="white">Review evidence</text>'),("Disabled",button(734,102,150,"Review evidence","secondary","arrow",True))]
    for label,node in states: out += [text(int(node.split('x="')[1].split('"')[0]) if 'x="' in node else 32, 88, label, 11, FAINT, 700), node]
    cards=[("Loading",rect(32,188,185,128,"#f3f5f3",LINE,10)+icon("refresh",52,213,18,MUTED)+text(82,226,"Loading trace evidence",13,INK,650)+text(52,258,"Keep the previous trace hidden.",11,MUTED)),("Retry",rect(237,188,185,128,RED_SOFT,"#efc3bf",10)+icon("refresh",257,213,18,RED)+text(287,226,"Could not load evidence",13,INK,650)+button(257,254,92,"Retry","secondary","refresh")),("Tooltip",rect(442,188,185,128,PAPER,LINE,10)+icon("info",462,213,18,MUTED)+text(492,226,"Threshold",13,INK,650)+rect(460,247,142,44,INK,INK,6)+text(472,274,"Minimum eligible calls",11,PAPER,600)),("Keyboard",rect(647,188,185,128,PAPER,LINE,10)+icon("keyboard",667,213,18,MUTED)+text(697,226,"Keyboard path",13,INK,650)+text(667,258,"Tab: source > range > action",11,MUTED)),("Success",rect(32,344,185,128,BRAND_SOFT,"#b7ddc4",10)+icon("check",52,369,18,BRAND_DARK)+text(82,382,"Outcome saved",13,INK,650)+text(52,414,"Explicit event received.",11,MUTED)),("Error",rect(237,344,185,128,RED_SOFT,"#efc3bf",10)+icon("issues",257,369,18,RED)+text(287,382,"Live data error",13,INK,650)+text(257,414,"Retry without sample fallback.",11,MUTED)),("Empty",rect(442,344,185,128,PAPER,LINE,10)+icon("search",462,369,18,FAINT)+text(492,382,"No live data",13,INK,650)+text(462,414,"No events in this period.",11,MUTED)),("Insufficient data",rect(647,344,185,128,BLUE_SOFT,"#c5d6f4",10)+icon("info",667,369,18,BLUE)+text(697,382,"Need more data",13,INK,650)+text(667,414,"Minimum 30 calls; saw 7.",11,MUTED))]
    for _,node in cards: out.append(node)
    out += [rect(32,512,800,90,PAPER,LINE,10), icon("users",54,536,17,BRAND_DARK), text(84,540,"Live data",13,INK,650), text(84,563,"Source selected explicitly. No freshness or health claim is implied.",11,MUTED), rect(420,526,1,42,LINE,LINE,0), icon("evidence",448,536,17,BLUE), text(478,540,"Example data",13,INK,650), text(478,563,"Selected explicitly. Example records are never substituted silently.",11,MUTED)]
    return finish(out)


def state_strip():
    w,h=1100,260
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',f'<rect width="{w}" height="{h}" fill="{CANVAS}"/>',text(28,36,"Truthful data states",20,INK,700)]
    states=[("Live empty","No live data available","No events were observed in the selected period.",PAPER,LINE,"info"),("Live error","Live data could not be loaded","Retry the request; Example data remains opt-in.",RED_SOFT,"#efc3bf","issues"),("Example data","Example data selected","This view uses illustrative records.",BLUE_SOFT,"#c5d6f4","evidence"),("Insufficient","More data may be required","Minimum 30 eligible calls; saw 7.",BLUE_SOFT,"#c5d6f4","info")]
    for i,(a,b,c,fill,stroke,ic) in enumerate(states):
        x=28+i*264
        out += [rect(x,62,242,150,fill,stroke,10),icon(ic,x+18,82,17,RED if ic=="issues" else BLUE if ic in ("evidence","info") else MUTED),text(x+46,94,a,11,FAINT,700,letter=.8),text(x+18,126,b,14,INK,650),text(x+18,153,c,11,MUTED),text(x+18,183,"Source is explicit",10,FAINT)]
    return finish(out)


FILES={
    "proposed-overview-1280.svg": overview(1280,800),
    "proposed-overview-1440.svg": overview(1440,900),
    "proposed-adoption-1280.svg": adoption(1280,800),
    "proposed-adoption-1440.svg": adoption(1440,900),
    "proposed-journeys-1280.svg": journeys(1280,800),
    "proposed-journeys.svg": journeys(1280,800),
    "proposed-quality-1280.svg": quality(1280,800),
    "proposed-quality.svg": quality(1280,800),
    "proposed-quality-1440.svg": quality(1440,900),
    "proposed-capabilities-1280.svg": capabilities(1280,800),
    "proposed-capabilities-1440.svg": capabilities(1440,900),
    "proposed-issues-1280.svg": issues(1280,800),
    "proposed-issues.svg": issues(1280,800),
    "proposed-issues-1440.svg": issues(1440,900),
    "proposed-evidence-1280.svg": evidence(1280,800),
    "proposed-evidence.svg": evidence(1280,800),
    "proposed-evidence-1440.svg": evidence(1440,900),
    "proposed-setup-1280.svg": setup(1280,800),
    "proposed-setup-1440.svg": setup(1440,900),
    "proposed-navigation.svg": navigation(),
    "proposed-interactions.svg": interactions(),
    "state-strip.svg": state_strip(),
}

for name, content in FILES.items():
    (SCREENS / name).write_text(content + "\n", encoding="utf-8")

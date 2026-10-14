"""Twenty-plus standalone charts. Teaching figures are labeled as such."""

from __future__ import annotations

import math


def esc(text: str) -> str:
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg(width: int, height: int, title: str, body: str) -> str:
    return (
        f'<svg class="chart-svg" viewBox="0 0 {width} {height}" role="img" aria-label="{esc(title)}">'
        f"<title>{esc(title)}</title>{body}</svg>"
    )


def erlang_b(n: int, traffic: float) -> float:
    b = 1.0
    for k in range(1, n + 1):
        b = (traffic * b) / (k + traffic * b)
    return b


def erlang_c(n: int, traffic: float) -> float:
    if n <= traffic:
        return 1.0
    b = erlang_b(n, traffic)
    denom = n - traffic * (1 - b)
    if denom <= 0:
        return 1.0
    return (n * b) / denom


def service_level(n: int, traffic: float) -> float:
    if n <= traffic:
        return 0.0
    pw = erlang_c(n, traffic)
    sl = 1 - pw * math.exp((-(n - traffic) * 20) / 180)
    return max(0.0, min(1.0, sl))


def build_charts() -> list[dict]:
    charts = [
        license_chart(),
        cqd_chart(),
        erlang_chart(),
        cert_timeline(),
        feature_timeline(),
        dscp_chart(),
        codec_chart(),
        skill_chart(),
        port_chart(),
        queue_chart(),
        emergency_chart(),
        recording_chart(),
        model_chart(),
        hop_chart(),
        shrinkage_chart(),
        proxy_chart(),
        response_chart(),
        bypass_chart(),
        resource_chart(),
        bandwidth_chart(),
        exam_status_chart(),
        wfm_chart(),
    ]
    return charts


def license_chart() -> dict:
    rows = [
        ("User who dials the PSTN", [1, 1, 0, 0]),
        ("Meeting dial-in number", [0, 0, 1, 0]),
        ("Auto attendant identity", [0, 0, 0, 1]),
        ("Direct Routing common-area phone", [1, 0, 0, 0]),
    ]
    headers = ["Teams Phone", "Calling Plan", "Audio Conferencing", "Resource account"]
    body = ""
    for i, header in enumerate(headers):
        body += f'<text x="{230 + i * 150}" y="28" text-anchor="middle" fill="var(--muted)" font-size="11">{esc(header)}</text>'
    for r, (label, flags) in enumerate(rows):
        y = 52 + r * 48
        body += f'<text x="16" y="{y + 18}" fill="var(--ink)" font-size="13">{esc(label)}</text>'
        for c, flag in enumerate(flags):
            color = "#3ee0c3" if flag else "#243642"
            mark = "Yes" if flag else "No"
            body += f'<rect x="{175 + c * 150}" y="{y}" width="110" height="28" rx="8" fill="{color}"/>'
            ink = "#04221c" if flag else "var(--muted)"
            body += f'<text x="{230 + c * 150}" y="{y + 18}" text-anchor="middle" fill="{ink}" font-size="12">{mark}</text>'
    return {
        "id": "license",
        "title": "Licensing comparison",
        "note": "Which add-on the scenario needs. Not a price list. Teams Premium is absent on purpose.",
        "svg": svg(860, 260, "Licensing comparison", body),
    }


def cqd_chart() -> dict:
    # Teaching sample, not a tenant extract.
    jitter = [18, 22, 21, 28, 41, 36, 24, 19]
    loss = [0.4, 0.6, 0.5, 1.1, 3.4, 2.2, 0.8, 0.5]
    body = '<text x="16" y="24" fill="var(--ink)" font-size="14">Teaching sample, not a live tenant</text>'
    body += '<path d="M 50 200 H 820 M 50 40 V 200" stroke="var(--muted)" fill="none"/>'
    def poly(values, scale, color):
        pts = []
        for i, value in enumerate(values):
            x = 70 + i * 90
            y = 200 - value * scale
            pts.append(f"{x},{y:.1f}")
        return f'<polyline points="{" ".join(pts)}" fill="none" stroke="{color}" stroke-width="3"/>'
    body += poly(jitter, 3.2, "#3ee0c3")
    body += poly(loss, 28, "#ff7d92")
    for i in range(8):
        body += f'<text x="{70 + i * 90}" y="222" text-anchor="middle" fill="var(--muted)" font-size="11">W{i+1}</text>'
    body += '<text x="70" y="248" fill="#3ee0c3" font-size="12">Jitter ms</text>'
    body += '<text x="220" y="248" fill="#ff7d92" font-size="12">Loss %</text>'
    return {
        "id": "cqd",
        "title": "CQD quality trends",
        "note": "A made-up eight-week building. Use it to practice reading a bend. Confirm thresholds in the current data dictionary.",
        "svg": svg(860, 270, "CQD quality trends", body),
    }


def erlang_chart() -> dict:
    body = '<path d="M 50 220 H 820 M 50 30 V 220" stroke="var(--muted)" fill="none"/>'
    pts = []
    for n in range(10, 25):
        sl = service_level(n, 12)
        x = 60 + (n - 10) * 48
        y = 210 - sl * 170
        pts.append(f"{x},{y:.1f}")
        body += f'<text x="{x}" y="240" text-anchor="middle" fill="var(--muted)" font-size="11">{n}</text>'
        body += f'<circle cx="{x}" cy="{y:.1f}" r="4" fill="#3ee0c3"/>'
    body += f'<polyline points="{" ".join(pts)}" fill="none" stroke="#a89bff" stroke-width="2"/>'
    body += '<text x="16" y="24" fill="var(--ink)" font-size="14">Service level versus agents. 12 erlangs, 20 seconds, 180 second handle.</text>'
    return {
        "id": "erlang",
        "title": "Erlang C service level",
        "note": "Standard teaching form. Not a forecast for a real queue.",
        "svg": svg(860, 260, "Erlang C curve", body),
    }


def cert_timeline() -> dict:
    events = [
        (40, "31 Mar 2026", "MS-900 retired"),
        (180, "18 Jun 2026", "AB-250 beta ends"),
        (320, "30 Jun 2026", "AI-900 retired"),
        (520, "Jul 31 2026", "MB-280 retired"),
        (760, "14 Oct 2026", "This campus checked"),
        (900, "21–27 Oct", "SC-900 and MS-700 updates"),
    ]
    body = '<path d="M 30 80 H 1040" stroke="#3ee0c3" stroke-width="3"/>'
    for x, when, what in events:
        body += f'<circle cx="{x}" cy="80" r="7" fill="#f0b429"/>'
        body += f'<text x="{x}" y="58" text-anchor="middle" fill="var(--muted)" font-size="11">{esc(when)}</text>'
        body += f'<text x="{x}" y="112" text-anchor="middle" fill="var(--ink)" font-size="12">{esc(what)}</text>'
    return {
        "id": "certs",
        "title": "Certification timeline",
        "note": "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta.",
        "svg": svg(1080, 160, "Certification timeline", body),
    }


def feature_timeline() -> dict:
    rows = [
        ("Calling Plans, Operator Connect, Teams Phone Mobile, Direct Routing", "Current PSTN choices"),
        ("Connect, Extend, Unify", "Current contact-center model names"),
        ("Compliance recording policy and application instance", "Current recording gate"),
        ("Survivable Branch Appliance", "Limited local PSTN, not full cloud"),
        ("Location-based routing", "Toll-bypass control"),
    ]
    body = ""
    for i, (name, state) in enumerate(rows):
        y = 20 + i * 44
        body += f'<rect x="16" y="{y}" width="14" height="28" fill="#3ee0c3"/>'
        body += f'<text x="42" y="{y + 14}" fill="var(--ink)" font-size="13">{esc(name)}</text>'
        body += f'<text x="42" y="{y + 30}" fill="var(--muted)" font-size="12">{esc(state)}</text>'
    return {
        "id": "features",
        "title": "Feature status, not a launch history",
        "note": "What is documented as of 14 October 2026. This chart does not invent release years.",
        "svg": svg(860, 250, "Feature status", body),
    }


def bar_rows(title: str, rows: list[tuple[str, float, str]], note: str, chart_id: str) -> dict:
    top = max(value for _, value, _ in rows) or 1
    body = ""
    for i, (label, value, display) in enumerate(rows):
        y = 16 + i * 36
        w = 8 + (value / top) * 420
        body += f'<text x="8" y="{y + 16}" fill="var(--ink)" font-size="13">{esc(label)}</text>'
        body += f'<rect x="250" y="{y}" width="{w:.0f}" height="20" rx="6" fill="#3ee0c3"/>'
        body += f'<text x="{258 + w:.0f}" y="{y + 15}" fill="var(--muted)" font-size="12">{esc(display)}</text>'
    height = 24 + len(rows) * 36
    return {"id": chart_id, "title": title, "note": note, "svg": svg(860, height, title, body)}


def dscp_chart() -> dict:
    return bar_rows(
        "DSCP marks",
        [("Audio EF", 46, "46"), ("Video AF41", 34, "34"), ("Sharing AF21", 18, "18"), ("Signaling CS5", 40, "40")],
        "From the Teams QoS article. Signaling is not configurable.",
        "dscp",
    )


def codec_chart() -> dict:
    return bar_rows(
        "Layer-3 bandwidth class",
        [("G.711 20 ms", 80, "80 kbit/s"), ("G.722 20 ms", 80, "80 kbit/s"), ("G.729 20 ms", 24, "24 kbit/s"), ("Ethernet G.711", 87.2, "87.2 kbit/s")],
        "Header math from the QoS article. SILK is variable and is not on this chart.",
        "codec",
    )


def skill_chart() -> dict:
    return bar_rows(
        "AB-250 skill weights, low end of the published range",
        [("Deploy", 15, "15–20%"), ("Channels", 30, "30–35%"), ("Agents and AI", 10, "10–15%"), ("Work distribution", 10, "10–15%"), ("Rep experience", 15, "15–20%"), ("Analytics", 10, "10–15%")],
        "Study guide checked 14 October 2026.",
        "ab250",
    )


def port_chart() -> dict:
    return bar_rows(
        "Client source ports",
        [("Audio", 20, "50000–50019"), ("Video", 20, "50020–50039"), ("Share", 20, "50040–50059"), ("Signaling", 20, "50070–50089")],
        "Equal ranges, different jobs. Browser joins do not use them.",
        "ports",
    )


def queue_chart() -> dict:
    return bar_rows(
        "Queue methods, teaching weight",
        [("Attendant", 4, "Rings available agents together"), ("Serial", 2, "List order"), ("Round robin", 3, "Remembers the last agent"), ("Longest idle", 3, "Idle time")],
        "Not a volume chart. The words are the difference.",
        "queue",
    )


def emergency_chart() -> dict:
    return bar_rows(
        "Who routes the emergency call",
        [("Calling Plan", 2, "Microsoft, in supported countries"), ("Operator Connect", 3, "The operator"), ("Direct Routing", 4, "Your SBC and carrier"), ("VPN pool", 1, "Often not a dispatchable site")],
        "Do not place a real emergency call to test this.",
        "emergency",
    )


def recording_chart() -> dict:
    return bar_rows(
        "Recording types",
        [("Convenience", 1, "Teams meeting storage"), ("Compliance", 3, "Policy bot and partner retention"), ("Screen", 2, "A separate product")],
        "Compliance is not convenience recording with a stricter name.",
        "recording",
    )


def model_chart() -> dict:
    return bar_rows(
        "Contact center models",
        [("Connect", 1, "SBC"), ("Extend", 2, "Graph and client"), ("Unify", 3, "ACS-native")],
        "Names on Learn as of 14 October 2026.",
        "models",
    )


def hop_chart() -> dict:
    return bar_rows(
        "Hop guidance",
        [("Client to edge", 5, "About 3–5"), ("ISP to Microsoft", 3, "About 3"), ("Media over VPN", 1, "Avoid")],
        "Guidance, not a promise of one-way delay.",
        "hops",
    )


def shrinkage_chart() -> dict:
    return bar_rows(
        "Roster at 30 percent shrinkage",
        [("10 on the phone", 14.3, "14.3 roster"), ("14 on the phone", 20, "20 roster"), ("20 on the phone", 28.6, "28.6 roster")],
        "Roster = agents / (1 − shrinkage). A planning factor, not a forecast.",
        "shrink",
    )


def proxy_chart() -> dict:
    return bar_rows(
        "Signaling names",
        [("Commercial", 3, "sip, sip2, sip3"), ("GCC High", 1, "sip.pstnhub.gov.teams.microsoft.us"), ("DoD", 1, "sip.pstnhub.dod.teams.microsoft.us")],
        "TCP 5061. Do not mix the clouds.",
        "proxies",
    )


def response_chart() -> dict:
    return bar_rows(
        "SIP responses you will actually see",
        [("100 Trying", 1, "Working"), ("180 Ringing", 2, "Alerting"), ("183", 2, "Early media"), ("200", 3, "Answer"), ("488", 4, "Codecs"), ("503", 4, "Out of service")],
        "Read the code on the hop that generated it.",
        "sip",
    )


def bypass_chart() -> dict:
    return bar_rows(
        "Where media goes",
        [("Processor", 2, "Default"), ("Bypass", 2, "Same site, flag on"), ("VPN", 3, "Usually not a bypass site"), ("LBR interaction", 3, "Check both designs")],
        "Signaling stays with Teams in every row.",
        "bypass",
    )


def resource_chart() -> dict:
    return bar_rows(
        "Resource account license",
        [("Resource Account license", 1, "Required even with no number"), ("Teams Phone Standard", 3, "Wrong SKU for the app"), ("One license change", 2, "Swap, do not stack")],
        "Assigning Teams Phone Standard to the resource account can break the app.",
        "resource",
    )


def bandwidth_chart() -> dict:
    return bar_rows(
        "Two concurrent G.711 calls",
        [("Payload", 128, "128 kbit/s"), ("Layer 3", 160, "160 kbit/s"), ("Ethernet + 18 bytes", 174.4, "174.4 kbit/s")],
        "At least two media ports per concurrent call, budgeted separately from bandwidth.",
        "bandwidth",
    )


def exam_status_chart() -> dict:
    return bar_rows(
        "Exam status on 14 October 2026",
        [("MS-700", 3, "Still live, no replacement"), ("AB-250", 3, "Contact center"), ("AB-210", 2, "In beta, MB-280 successor"), ("MB-280", 1, "Retired Jul 31 2026"), ("AZ-900", 3, "Live"), ("SC-900", 3, "Update 21 Oct")],
        "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta.",
        "exam-status",
    )


def wfm_chart() -> dict:
    return bar_rows(
        "What WFM wants from the queue",
        [("Offered", 4, "Interval"), ("Answered", 3, "Interval"), ("Abandoned", 2, "Interval"), ("AHT", 3, "Seconds"), ("Adherence", 2, "Schedule versus actual")],
        "Daily totals hide the hour that missed. Export the interval.",
        "wfm",
    )

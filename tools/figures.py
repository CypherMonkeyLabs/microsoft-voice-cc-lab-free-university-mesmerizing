"""Distinct inline figures for every lesson. Geometry changes with the seed."""

from __future__ import annotations

import hashlib


class Rng:
    def __init__(self, seed: str) -> None:
        digest = hashlib.sha256(seed.encode("utf-8")).digest()
        self.x = int.from_bytes(digest[:8], "big") or 1

    def f(self) -> float:
        self.x ^= (self.x << 13) & 0xFFFFFFFFFFFFFFFF
        self.x ^= self.x >> 7
        self.x ^= (self.x << 17) & 0xFFFFFFFFFFFFFFFF
        return ((self.x >> 11) & 0xFFFFFFFF) / 4294967296

    def i(self, lo: int, hi: int) -> int:
        return lo + int(self.f() * (hi - lo + 1))

    def pick(self, items: list):
        return items[self.i(0, len(items) - 1)]


def esc(text: str) -> str:
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


CURRENT_SEED = ""


def wrap(width: int, height: int, title: str, body: str, animated: bool) -> str:
    """Add a seed-specific trace so two lessons never share a picture."""
    r = Rng("trace|" + CURRENT_SEED)
    height = height + 28
    x = 12
    y = height - 18
    d = f"M {x} {y - r.i(0, 8)}"
    hops = 6 + r.i(0, 10)
    for _ in range(hops):
        x = min(width - 16, x + r.i(18, 70))
        y = height - 22 + r.i(0, 12)
        cmd = "Q" if r.f() > 0.55 else "L"
        if cmd == "Q":
            d += f" Q {x - 8} {y - r.i(4, 16)} {x} {y}"
        else:
            d += f" L {x} {y}"
    body += f'<path d="{d}" fill="none" stroke="#f0b429" stroke-width="1.6"/>'
    marks = 2 + r.i(0, 5)
    for i in range(marks):
        body += (
            f'<rect x="{16 + i * r.i(10, 28)}" y="{r.i(6, 18)}" width="{3 + r.i(0, 6)}" '
            f'height="{4 + r.i(0, 10)}" rx="1" fill="#a89bff" opacity="0.85"/>'
        )
    kind = "figure-svg flow-anim" if animated else "figure-svg"
    return (
        f'<svg class="{kind}" viewBox="0 0 {width} {height}" role="img" aria-label="{esc(title)}">'
        f"<title>{esc(title)}</title>{body}</svg>"
    )


def mover(path: str, dur: float) -> str:
    return (
        f'<circle r="5.5" fill="#3ee0c3" class="mover" '
        f'style="offset-path:path(\'{path}\');animation-duration:{dur:.2f}s"></circle>'
    )


def _lane(names: list[str], width: int, top: int = 36) -> tuple[list[int], str]:
    n = len(names)
    xs = [int(70 + i * (width - 140) / max(1, n - 1)) for i in range(n)]
    body = ""
    for x, name in zip(xs, names):
        body += f'<line x1="{x}" y1="{top}" x2="{x}" y2="92%" stroke="rgba(168,155,255,.35)" stroke-width="2"/>'
        body += f'<text x="{x}" y="22" text-anchor="middle" fill="var(--ink)" font-size="13" font-family="var(--sans)">{esc(name)}</text>'
    return xs, body


def flow_sip(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    sets = [
        ["Teams", "SIP proxy", "SBC", "Carrier"],
        ["Client", "sip", "sip2", "SBC", "PSTN"],
        ["Teams", "Proxy", "SBC-A", "SBC-B", "Carrier"],
        ["Phone", "Teams", "SBC", "PSTN"],
        ["User", "sip3", "SBC", "Carrier", "Mobile"],
    ]
    names = r.pick(sets)
    msgs = r.pick([
        [("INVITE", 0, 1), ("100", 1, 0), ("INVITE", 1, 2), ("180", 2, 1), ("200", 2, 0), ("ACK", 0, 2)],
        [("INVITE", 0, 1), ("INVITE", 1, 2), ("INVITE", 2, 3), ("100", 3, 2), ("183", 2, 0), ("200", 3, 0), ("ACK", 0, 3)],
        [("OPTIONS", 1, 2), ("200", 2, 1), ("INVITE", 0, 1), ("INVITE", 1, 2), ("488", 2, 1), ("ACK", 1, 2)],
        [("INVITE", 0, 1), ("INVITE", 1, 2), ("180", 2, 0), ("200", 2, 0), ("ACK", 0, 2), ("BYE", 3 if len(names) > 3 else 2, 0)],
    ])
    width, height = 920, 78 + len(msgs) * 36
    xs, body = _lane(names[: max(m[2] for m in msgs) + 1], width)
    path = ""
    for i, (label, a, b) in enumerate(msgs):
        if a >= len(xs) or b >= len(xs):
            continue
        y = 58 + i * 36
        x1, x2 = xs[a], xs[b]
        color = "#ff7d92" if label in {"488", "403", "503"} else "#3ee0c3"
        body += f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{color}" stroke-width="2"/>'
        body += f'<text x="{(x1+x2)//2}" y="{y - 6}" text-anchor="middle" fill="var(--muted)" font-size="12">{esc(label)}</text>'
        path += f"M {x1} {y} L {x2} {y} "
    body += mover(path.strip(), 4.2 + r.f())
    title = "SIP over TLS toward the carrier"
    caption = f"Signaling for {lesson['title']}. Teams keeps the dialog. A 488 is codecs, not a greeting."
    return wrap(width, height, title, body, True), title, caption


def flow_bypass(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 920, 280 + r.i(0, 40)
    direct = r.f() > 0.45
    body = (
        f'<rect x="40" y="40" width="200" height="70" rx="16" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        f'<text x="140" y="80" text-anchor="middle" fill="var(--ink)" font-size="14">Teams client</text>'
        f'<rect x="360" y="36" width="180" height="64" rx="16" fill="var(--bg-3)" stroke="#a89bff"/>'
        f'<text x="450" y="74" text-anchor="middle" fill="var(--ink)" font-size="14">Media processor</text>'
        f'<rect x="680" y="40" width="190" height="70" rx="16" fill="var(--bg-3)" stroke="#f0b429"/>'
        f'<text x="775" y="80" text-anchor="middle" fill="var(--ink)" font-size="14">Certified SBC</text>'
    )
    body += '<path d="M 240 70 C 300 70, 320 68, 360 68" fill="none" stroke="#a89bff" stroke-width="3"/>'
    body += '<path d="M 540 68 C 600 60, 640 70, 680 74" fill="none" stroke="#a89bff" stroke-width="3"/>'
    if direct:
        y = 180 + r.i(0, 20)
        body += f'<path d="M 140 110 C 140 {y}, 775 {y}, 775 110" fill="none" stroke="#3ee0c3" stroke-width="3"/>'
        body += f'<text x="450" y="{y + 22}" text-anchor="middle" fill="var(--muted)" font-size="13">Media bypass candidate, same site. Signaling still visits Teams.</text>'
        path = f"M 140 110 C 140 {y}, 775 {y}, 775 110"
    else:
        body += '<text x="450" y="160" text-anchor="middle" fill="var(--muted)" font-size="13">VPN or bypass off. Media hairpins through the processor.</text>'
        path = "M 140 75 C 300 75, 320 68, 450 68 C 600 60, 640 70, 775 75"
    body += f'<rect x="{40 + r.i(0, 30)}" y="210" width="250" height="48" rx="12" fill="none" stroke="#ff7d92"/>'
    body += '<text x="175" y="240" text-anchor="middle" fill="var(--ink)" font-size="12">Signaling does not bypass</text>'
    body += mover(path, 3.6)
    title = "Media bypass beside the signaling path"
    caption = f"Two paths for {lesson['title']}. RTP may skip the processor. SIP does not."
    return wrap(width, height, title, body, True), title, caption


def flow_lbr(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    sites = r.i(2, 4)
    width, height = 920, 120 + sites * 70
    body = '<text x="24" y="28" fill="var(--ink)" font-size="14">Location-based routing</text>'
    path = ""
    for i in range(sites):
        y = 50 + i * 70
        ok = i != r.i(0, sites - 1)
        color = "#3ee0c3" if ok else "#ff7d92"
        body += f'<rect x="24" y="{y}" width="220" height="52" rx="12" fill="var(--bg-3)" stroke="{color}"/>'
        body += f'<text x="134" y="{y + 32}" text-anchor="middle" fill="var(--ink)" font-size="13">Site {i + 1} subnet</text>'
        body += f'<rect x="300" y="{y}" width="250" height="52" rx="12" fill="var(--bg-3)" stroke="#a89bff"/>'
        body += f'<text x="425" y="{y + 32}" text-anchor="middle" fill="var(--ink)" font-size="13">Trusted IP and site</text>'
        body += f'<rect x="620" y="{y}" width="260" height="52" rx="12" fill="var(--bg-3)" stroke="{color}"/>'
        label = "Local SBC allowed" if ok else "Toll bypass blocked"
        body += f'<text x="750" y="{y + 32}" text-anchor="middle" fill="var(--ink)" font-size="13">{label}</text>'
        body += f'<path d="M 244 {y+26} H 300 M 550 {y+26} H 620" fill="none" stroke="{color}" stroke-width="2"/>'
        path += f"M 40 {y+26} H 860 "
    body += mover(path.strip(), 5)
    title = "Location-based routing gate"
    caption = f"A site map for {lesson['title']}. LBR is toll-bypass control, not emergency location by itself."
    return wrap(width, height, title, body, True), title, caption


def flow_queue(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    method = r.pick(["Attendant", "Serial", "Round robin", "Longest idle"])
    agents = r.i(3, 5)
    width, height = 920, 300
    body = (
        '<rect x="360" y="24" width="200" height="56" rx="14" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        '<text x="460" y="58" text-anchor="middle" fill="var(--ink)" font-size="14">Call queue</text>'
        f'<text x="460" y="110" text-anchor="middle" fill="var(--muted)" font-size="13">{esc(method)}</text>'
    )
    path = ""
    for i in range(agents):
        x = 40 + i * (840 // agents)
        body += f'<rect x="{x}" y="160" width="140" height="52" rx="12" fill="var(--bg-3)" stroke="#a89bff"/>'
        body += f'<text x="{x+70}" y="192" text-anchor="middle" fill="var(--ink)" font-size="13">Agent {i+1}</text>'
        body += f'<path d="M 460 80 C {460 + r.i(-20, 20)} 120, {x+70} 130, {x+70} 160" fill="none" stroke="#3ee0c3" stroke-width="2"/>'
        path += f"M 460 80 C 460 120, {x+70} 130, {x+70} 186 "
    body += f'<rect x="40" y="236" width="360" height="44" rx="12" fill="none" stroke="#f0b429"/>'
    body += '<text x="220" y="264" text-anchor="middle" fill="var(--ink)" font-size="13">Timeout to overflow</text>'
    body += mover(path.strip(), 3.8)
    title = "Call queue routing"
    caption = f"{method} distribution for {lesson['title']}. Overflow is a configured target."
    return wrap(width, height, title, body, True), title, caption


def flow_acs(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    steps = ["Answer", "Play", "Recognize", "DTMF", "Transfer", "Hang up"]
    if r.f() > 0.5:
        steps = ["Answer", "Play", "Speech", "Escalate", "Human", "Bye"]
    width, height = 920, 220
    body = ""
    path = ""
    for i, name in enumerate(steps):
        x = 30 + i * 148
        y = 70 + (i % 2) * r.i(10, 36)
        body += f'<rect x="{x}" y="{y}" width="120" height="48" rx="14" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        body += f'<text x="{x+60}" y="{y+30}" text-anchor="middle" fill="var(--ink)" font-size="13">{esc(name)}</text>'
        if i:
            px = 30 + (i - 1) * 148 + 60
            py = 70 + ((i - 1) % 2) * 20 + 24
            body += f'<path d="M {px+60} {py} C {px+90} {py}, {x} {y+24}, {x} {y+24}" fill="none" stroke="#a89bff" stroke-width="2"/>'
        path += f"M {x+60} {y+24} "
    # rebuild a simple polyline path
    pts = []
    for i in range(len(steps)):
        x = 30 + i * 148 + 60
        y = 94 + (i % 2) * 20
        pts.append(f"{x} {y}")
    poly = "M " + " L ".join(pts)
    body += mover(poly, 4.5)
    title = "ACS call automation"
    caption = f"Events, not a phone tree hidden in a form. {lesson['title']} still needs a human escape."
    return wrap(width, height, title, body, True), title, caption


def flow_unified(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 920, 280
    queues = r.pick([
        [("French billing", 1), ("English billing", 0), ("Overflow", 2)],
        [("Outage", 2), ("Billing", 1), ("General", 0)],
        [("Voice", 2), ("Chat", 1), ("Email", 0)],
    ])
    body = (
        '<rect x="24" y="30" width="180" height="56" rx="12" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        '<text x="114" y="64" text-anchor="middle" fill="var(--ink)" font-size="13">Workstream</text>'
        '<rect x="250" y="30" width="180" height="56" rx="12" fill="var(--bg-3)" stroke="#a89bff"/>'
        '<text x="340" y="64" text-anchor="middle" fill="var(--ink)" font-size="13">Classification</text>'
    )
    path = "M 114 58 H 250"
    for i, (name, cap) in enumerate(queues):
        y = 120 + i * 48
        body += f'<rect x="500" y="{y}" width="220" height="40" rx="10" fill="var(--bg-3)" stroke="#f0b429"/>'
        body += f'<text x="610" y="{y+26}" text-anchor="middle" fill="var(--ink)" font-size="13">{esc(name)}</text>'
        body += f'<rect x="740" y="{y+8}" width="{40 + cap * 50}" height="22" rx="6" fill="#3ee0c3"/>'
        body += f'<text x="748" y="{y+24}" fill="#04221c" font-size="11">cap {cap}</text>'
        body += f'<path d="M 430 58 C 470 58, 470 {y+20}, 500 {y+20}" fill="none" stroke="#a89bff" stroke-width="2"/>'
        path += f" L 500 {y+20}"
    body += mover("M 40 58 H 430 C 470 58, 470 140, 720 140", 4)
    title = "Dynamics unified routing"
    caption = f"Language, intent, and capacity for {lesson['title']}. Overflow is a rule."
    return wrap(width, height, title, body, True), title, caption


def flow_options(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    misses = r.i(0, 4)
    width, height = 920, 200
    body = ""
    path = ""
    for i in range(8):
        x = 40 + i * 110
        bad = i >= 8 - misses and misses
        color = "#ff7d92" if bad else "#3ee0c3"
        h = 40 if bad else 90
        body += f'<rect x="{x}" y="{150 - h}" width="36" height="{h}" rx="6" fill="{color}"/>'
        body += f'<text x="{x+18}" y="176" text-anchor="middle" fill="var(--muted)" font-size="11">{i+1}</text>'
        path += f"M {x+18} {150 - h} "
    body += '<text x="24" y="28" fill="var(--ink)" font-size="14">SIP OPTIONS</text>'
    body += mover("M 58 80 H 860", 3.2)
    title = "OPTIONS health"
    caption = "Repeated misses take a trunk out of service. The campus does not invent Microsoft's internal counter."
    return wrap(width, height, title, body, True), title, caption


def flow_sba(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    down = r.f() > 0.4
    width, height = 920, 250
    wan = "#ff7d92" if down else "#3ee0c3"
    dash = ' stroke-dasharray="7 6"' if down else ""
    state = "WAN down. Local PSTN only." if down else "WAN up. Cloud is the path."
    body = (
        '<rect x="40" y="48" width="210" height="72" rx="14" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        '<text x="145" y="90" text-anchor="middle" fill="var(--ink)" font-size="14">Branch clients</text>'
        '<rect x="350" y="48" width="210" height="72" rx="14" fill="var(--bg-3)" stroke="#f0b429"/>'
        '<text x="455" y="90" text-anchor="middle" fill="var(--ink)" font-size="14">SBA and SBC</text>'
        f'<rect x="670" y="48" width="210" height="72" rx="14" fill="var(--bg-3)" stroke="{wan}"/>'
        '<text x="775" y="90" text-anchor="middle" fill="var(--ink)" font-size="14">Microsoft 365</text>'
        '<path d="M 250 84 H 350" stroke="#3ee0c3" stroke-width="3" fill="none"/>'
        f'<path d="M 560 84 H 670" stroke="{wan}" stroke-width="3" fill="none"{dash}/>'
        f'<text x="40" y="170" fill="var(--muted)" font-size="14">{esc(state)}</text>'
        '<text x="40" y="200" fill="var(--muted)" font-size="13">Meetings and presence are not the survivable set.</text>'
    )
    body += mover("M 80 84 H 760", 3.4 + r.f())
    title = "Survivable branch timeline"
    caption = f"What remains when the path to Microsoft 365 drops. Lesson: {lesson['title']}."
    return wrap(width, height, title, body, True), title, caption


def diag_tls(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    flights = ["ClientHello", "ServerHello", "Certificate", "Finished", r.pick(["SAN check", "EKU check", "TLS 1.2", "Trusted root"])]
    width, height = 860, 86 + len(flights) * 28
    body = ""
    for i, name in enumerate(flights):
        y = 24 + i * 28
        w = 180 + r.i(0, 80) + i * 20
        body += f'<rect x="24" y="{y}" width="{w}" height="22" rx="6" fill="#102433" stroke="#3ee0c3"/>'
        body += f'<text x="36" y="{y+16}" fill="var(--ink)" font-size="12">{i+1} {esc(name)}</text>'
    title = "TLS handshake flights"
    caption = "Name, trust, and version fail before any dial plan is worth arguing about."
    return wrap(width, height, title, body, False), title, caption


def diag_packet(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    layers = r.pick([
        [("Eth 18", 70), ("IP 20", 90), ("UDP 8", 60), ("RTP 12", 70), ("G.711 160", 220)],
        [("Eth 18", 60), ("IP 20", 80), ("UDP 8", 50), ("RTP 12", 60), ("G.729 20", 80)],
        [("IP 20", 100), ("UDP 8", 70), ("RTP", 80), ("SILK", 160), ("DSCP 46", 90)],
    ])
    width, height = 900, 160
    body = ""
    x = 20
    for name, w in layers:
        body += f'<rect x="{x}" y="50" width="{w}" height="48" fill="var(--bg-3)" stroke="#a89bff"/>'
        body += f'<text x="{x + w/2}" y="78" text-anchor="middle" fill="var(--ink)" font-size="12">{esc(name)}</text>'
        x += w + 6
    body += '<text x="20" y="130" fill="var(--muted)" font-size="13">Header bytes change the kbit/s figure. Payload alone is not the wire rate.</text>'
    title = "Voice packet on the wire"
    caption = "G.711 at 20 ms is 80 kbit/s at layer 3 and 87.2 kbit/s with an 18-byte Ethernet header."
    return wrap(width, height, title, body, False), title, caption


def diag_subnet(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 860, 280
    body = '<rect x="20" y="20" width="820" height="240" rx="16" fill="none" stroke="#3ee0c3"/>'
    rooms = r.i(3, 6)
    for i in range(rooms):
        x = 40 + (i % 3) * 260
        y = 40 + (i // 3) * 110
        body += f'<rect x="{x}" y="{y}" width="220" height="80" rx="10" fill="var(--bg-3)" stroke="#f0b429"/>'
        body += f'<text x="{x+110}" y="{y+36}" text-anchor="middle" fill="var(--ink)" font-size="13">Subnet {r.i(1, 40)}</text>'
        body += f'<text x="{x+110}" y="{y+58}" text-anchor="middle" fill="var(--muted)" font-size="12">10.{r.i(1, 30)}.{r.i(0, 12)}.0/{r.pick([24, 25, 26])}</text>'
    title = "Site subnets"
    caption = "One subnet list should feed emergency location, LBR, and the CQD building map."
    return wrap(width, height, title, body, False), title, caption


def diag_codec(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    codecs = [("G.711", 87), ("G.722", 87), ("G.729", 32), ("SILK", 40 + r.i(0, 20))]
    width, height = 860, 200
    body = ""
    for i, (name, kbps) in enumerate(codecs):
        y = 30 + i * 40
        body += f'<text x="20" y="{y+16}" fill="var(--ink)" font-size="13">{name}</text>'
        body += f'<rect x="120" y="{y}" width="{kbps * 4 + r.i(0, 12)}" height="18" rx="5" fill="#3ee0c3"/>'
        body += f'<text x="{130 + kbps * 4}" y="{y+14}" fill="var(--muted)" font-size="12">{kbps} kbit/s class</text>'
    title = "Codec bandwidth classes"
    caption = "SILK does not have one G.711-style number. AMR-WB is not a bypass codec."
    return wrap(width, height, title, body, False), title, caption


def diag_policy(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    usages = r.pick([
        ["Emergency", "National", "International"],
        ["Emergency", "Local", "National", "Blocked"],
        ["999/112", "UK", "Rest of world"],
    ])
    width, height = 860, 70 + len(usages) * 48
    body = ""
    for i, name in enumerate(usages):
        y = 24 + i * 48
        inset = i * 28
        body += f'<rect x="{24+inset}" y="{y}" width="{780-inset*2}" height="40" rx="10" fill="var(--bg-3)" stroke="#a89bff"/>'
        body += f'<text x="{40+inset}" y="{y+26}" fill="var(--ink)" font-size="14">{i+1}. {esc(name)}</text>'
    title = "PSTN usage order"
    caption = "The policy walks usages from the top. Inside a usage, the lowest priority number wins."
    return wrap(width, height, title, body, False), title, caption


def diag_license(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    rows = [
        ("User PSTN", "Teams Phone"),
        ("Microsoft carrier", "Calling Plan"),
        ("Meeting dial-in", "Audio Conferencing"),
        ("Voice app", "Resource Account"),
        (r.pick(["Room", "Common area", "Branch user"]), r.pick(["Teams Rooms", "No Calling Plan on DR phone", "Teams Phone"])),
    ]
    width, height = 860, 40 + len(rows) * 36
    body = ""
    for i, (need, sku) in enumerate(rows):
        y = 16 + i * 36
        body += f'<text x="20" y="{y+20}" fill="var(--muted)" font-size="13">{esc(need)}</text>'
        body += f'<rect x="280" y="{y}" width="280" height="26" rx="8" fill="#102433" stroke="#3ee0c3"/>'
        body += f'<text x="300" y="{y+18}" fill="var(--ink)" font-size="13">{esc(sku)}</text>'
    title = "License families"
    caption = "These are different purchases. Teams Premium is not a phone system."
    return wrap(width, height, title, body, False), title, caption


def diag_recorder(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 880, 230
    body = (
        '<rect x="30" y="40" width="160" height="60" rx="12" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        '<text x="110" y="76" text-anchor="middle" fill="var(--ink)">Teams call</text>'
        '<rect x="280" y="30" width="200" height="80" rx="12" fill="var(--bg-3)" stroke="#a89bff"/>'
        '<text x="380" y="64" text-anchor="middle" fill="var(--ink)">Policy bot</text>'
        '<text x="380" y="86" text-anchor="middle" fill="var(--muted)" font-size="12">application instance</text>'
        '<rect x="580" y="40" width="250" height="60" rx="12" fill="var(--bg-3)" stroke="#f0b429"/>'
        '<text x="705" y="76" text-anchor="middle" fill="var(--ink)">Partner recorder</text>'
        '<path d="M 190 70 H 280 M 480 70 H 580" stroke="#3ee0c3" stroke-width="3" fill="none"/>'
        f'<text x="30" y="160" fill="var(--muted)" font-size="13">Fork {r.i(1, 2)}. Notification is required. Retention stays with the partner.</text>'
        '<text x="30" y="186" fill="var(--muted)" font-size="13">A grant with no application instance records nothing.</text>'
    )
    title = "Compliance recording fork"
    caption = "This is not convenience recording, and it is not a screen recording product."
    return wrap(width, height, title, body, False), title, caption


def diag_qos(seed: str, lesson: dict) -> tuple[str, str, str]:
    rows = [("Audio", "50000–50019", "EF 46", "#3ee0c3"), ("Video", "50020–50039", "AF41 34", "#a89bff"), ("Share", "50040–50059", "AF21 18", "#f0b429"), ("Signaling", "50070–50089", "CS5 40", "#ff7d92")]
    width, height = 880, 210
    body = ""
    for i, (name, ports, dscp, color) in enumerate(rows):
        y = 20 + i * 46
        body += f'<rect x="20" y="{y}" width="18" height="32" fill="{color}"/>'
        body += f'<text x="52" y="{y+22}" fill="var(--ink)" font-size="14">{name}</text>'
        body += f'<text x="200" y="{y+22}" fill="var(--muted)" font-size="13">{ports}</text>'
        body += f'<text x="420" y="{y+22}" fill="var(--ink)" font-size="14">{dscp}</text>'
    title = "QoS marks"
    caption = "Browser joins do not use the fixed client port ranges. Signaling DSCP is not configurable."
    return wrap(width, height, title, body, False), title, caption


def diag_crm(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 860, 200
    keys = ["E.164", "Call-ID", "Case id", r.pick(["Agent id", "Queue", "Work item"])]
    body = ""
    for i, key in enumerate(keys):
        x = 30 + i * 200
        body += f'<circle cx="{x+50}" cy="70" r="36" fill="var(--bg-3)" stroke="#3ee0c3" stroke-width="2"/>'
        body += f'<text x="{x+50}" y="74" text-anchor="middle" fill="var(--ink)" font-size="12">{esc(key)}</text>'
        if i:
            body += f'<path d="M {x-80} 70 H {x+10}" stroke="#a89bff" stroke-width="2" fill="none"/>'
    body += '<text x="30" y="150" fill="var(--muted)" font-size="13">Teams does not open a Dynamics case for an ordinary PSTN call by itself.</text>'
    title = "Identifiers that join the logs"
    caption = "Screen pop needs a number and a Call-ID the partner can quote."
    return wrap(width, height, title, body, False), title, caption


def diag_wfm(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 880, 200
    body = ""
    for i in range(8):
        h = 30 + r.i(10, 80)
        x = 40 + i * 100
        body += f'<rect x="{x}" y="{150-h}" width="48" height="{h}" fill="#3ee0c3" opacity="0.85"/>'
        body += f'<text x="{x+24}" y="172" text-anchor="middle" fill="var(--muted)" font-size="11">{(i+8)}h</text>'
    body += '<text x="24" y="28" fill="var(--ink)" font-size="14">Queue intervals, not a user policy</text>'
    title = "Workforce intervals"
    caption = "WFM consumes offered, answered, abandoned, and handle time. It is not a Teams calling policy."
    return wrap(width, height, title, body, False), title, caption


def diag_normalize(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    samples = r.pick([
        [("4255550100", "+14255550100"), ("(425) 555-0100", "+14255550100"), ("999", "+44999")],
        [("+442075554010", "+442075554010"), ("100", "no match"), ("011441134960000", "rule order")],
        [("911", "+1911"), ("112", "+44112"), ("+1911", "too short for international")],
    ])
    width, height = 880, 40 + len(samples) * 48
    body = ""
    for i, (src, dst) in enumerate(samples):
        y = 20 + i * 48
        body += f'<rect x="20" y="{y}" width="280" height="36" rx="8" fill="var(--bg-3)" stroke="#a89bff"/>'
        body += f'<text x="160" y="{y+24}" text-anchor="middle" fill="var(--ink)" font-size="13">{esc(src)}</text>'
        body += f'<path d="M 310 {y+18} H 390" stroke="#3ee0c3" stroke-width="2"/>'
        body += f'<rect x="400" y="{y}" width="420" height="36" rx="8" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        body += f'<text x="610" y="{y+24}" text-anchor="middle" fill="var(--ink)" font-size="13">{esc(dst)}</text>'
    title = "First matching normalization"
    caption = "Later rules do not vote. Emergency patterns sit above the 10-digit rule."
    return wrap(width, height, title, body, False), title, caption


def diag_roles(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    roles = ["Teams Admin", "Telephony Admin", "Communications Admin", "Support Engineer", "User Admin"]
    width, height = 860, 220
    body = ""
    for i, name in enumerate(roles):
        x = 30 + (i % 3) * 270
        y = 30 + (i // 3) * 90
        body += f'<rect x="{x}" y="{y}" width="240" height="64" rx="14" fill="var(--bg-3)" stroke="#3ee0c3"/>'
        body += f'<text x="{x+120}" y="{y+38}" text-anchor="middle" fill="var(--ink)" font-size="13">{esc(name)}</text>'
    title = "Admin roles"
    caption = "Resource account creation needs a Teams admin role and User Administrator. Global is not the daily role."
    return wrap(width, height, title, body, False), title, caption


def diag_proxy(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    names = r.pick([
        ["sip.pstnhub.microsoft.com", "sip2.pstnhub.microsoft.com", "sip3.pstnhub.microsoft.com"],
        ["sip.pstnhub.gov.teams.microsoft.us", "GCC High signaling", "Separate media ranges"],
        ["sip.pstnhub.dod.teams.microsoft.us", "DoD signaling", "Not the commercial proxies"],
    ])
    width, height = 920, 200
    body = ""
    for i, name in enumerate(names):
        y = 30 + i * 52
        body += f'<rect x="24" y="{y}" width="{520 + i * 40}" height="40" rx="10" fill="var(--bg-3)" stroke="#a89bff"/>'
        body += f'<text x="40" y="{y+26}" fill="var(--ink)" font-size="14">{esc(name)}</text>'
    title = "SIP proxies"
    caption = "Commercial trunks listen on TCP 5061. Do not copy a government FQDN into a commercial tenant."
    return wrap(width, height, title, body, False), title, caption


def diag_e911(seed: str, lesson: dict) -> tuple[str, str, str]:
    r = Rng(seed)
    width, height = 880, 230
    steps = ["Client IP", "Trusted IP", "Site", "Subnet", "Civic address", r.pick(["PIDF-LO on SBC", "Microsoft path", "Test number"])]
    body = ""
    for i, name in enumerate(steps):
        x = 20 + (i % 3) * 280
        y = 30 + (i // 3) * 90
        body += f'<rect x="{x}" y="{y}" width="250" height="60" rx="12" fill="var(--bg-3)" stroke="#ff7d92"/>'
        body += f'<text x="{x+125}" y="{y+36}" text-anchor="middle" fill="var(--ink)" font-size="13">{esc(name)}</text>'
    title = "Emergency location chain"
    caption = "Direct Routing emergency is the customer SBC and carrier. Do not test with a real emergency call."
    return wrap(width, height, title, body, False), title, caption


def diag_models(seed: str, lesson: dict) -> tuple[str, str, str]:
    rows = [
        ("Connect", "Certified SBC and Direct Routing"),
        ("Extend", "Teams client, Graph, Cloud Communications"),
        ("Unify", "Native, described as ACS-based"),
    ]
    width, height = 880, 200
    body = ""
    for i, (name, detail) in enumerate(rows):
        y = 24 + i * 56
        body += f'<rect x="24" y="{y}" width="160" height="44" rx="10" fill="#102433" stroke="#3ee0c3"/>'
        body += f'<text x="104" y="{y+28}" text-anchor="middle" fill="var(--ink)">{name}</text>'
        body += f'<text x="210" y="{y+28}" fill="var(--muted)" font-size="14">{esc(detail)}</text>'
    title = "Contact center models"
    caption = "Current Learn names are Connect, Extend, and Unify. Older decks say Power. Ask which model."
    return wrap(width, height, title, body, False), title, caption


FLOWS = [flow_sip, flow_bypass, flow_lbr, flow_queue, flow_acs, flow_unified, flow_options, flow_sba]
DIAGS = [diag_tls, diag_packet, diag_subnet, diag_codec, diag_policy, diag_license, diag_recorder, diag_qos, diag_crm, diag_wfm, diag_normalize, diag_roles, diag_proxy, diag_e911, diag_models]

BESPOKE = {
    "t05-dr": 0,
    "t09-bypass": 1,
    "t08-lbr": 2,
    "t07-queue": 3,
    "t15-auto": 4,
    "t13-routing": 5,
}

TRY_LAB = {
    "t01": "license-pick",
    "t02": "license-pick",
    "t03": "usage-build",
    "t04": "qos-mark",
    "t05": "dr-path",
    "t06": "dial-plan",
    "t07": "aa-cq",
    "t08": "e911-match",
    "t09": "bypass",
    "t10": "sbc-check",
    "t11": "tls-hand",
    "t12": "cqd-fault",
    "t13": "routing-designer",
    "t14": "cucm-map",
    "t15": "acs-flow",
    "t16": "exam-map",
    "t17": "hook-plan",
}


def attach_figures(lessons: list[dict]) -> tuple[int, int]:
    global CURRENT_SEED
    seen: set[str] = set()
    flows = 0
    total = 0
    for index, lesson in enumerate(lessons):
        figures = []
        for slot in range(14):
            seed = f"{lesson['id']}:{slot}:{index}"
            animated = slot < 3
            if animated:
                family = FLOWS[(index * 3 + slot) % len(FLOWS)]
                if slot == 0 and lesson["id"] in BESPOKE:
                    family = FLOWS[BESPOKE[lesson["id"]]]
            else:
                family = DIAGS[(index * 5 + slot) % len(DIAGS)]
            guard = 0
            while True:
                CURRENT_SEED = seed
                svg, title, caption = family(seed, lesson)
                if svg not in seen:
                    break
                guard += 1
                seed = seed + "x" + str(guard)
                if guard > 6:
                    break
            seen.add(svg)
            figures.append({
                "id": f"{lesson['id']}-f{slot}",
                "title": title,
                "caption": caption,
                "svg": svg,
                "animated": animated,
            })
            total += 1
            if animated:
                flows += 1
        lesson["figures"] = figures
        lesson["tryLab"] = lesson.get("lab") or TRY_LAB.get(lesson["track"], "dr-path")
    return total, flows

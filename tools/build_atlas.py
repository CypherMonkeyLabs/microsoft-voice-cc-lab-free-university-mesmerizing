#!/usr/bin/env python3
"""Write the Diagram Atlas. Hand-built SVGs, no CDN, no vendor document copy."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "campus" / "data" / "atlas.json"

DR = "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"
QOS = "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"
IPS = "https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges"
PSTN = "https://learn.microsoft.com/en-us/microsoftteams/pstn-connectivity"
LIC = "https://learn.microsoft.com/en-us/microsoftteams/teams-phone-licensing"
EMERG = "https://learn.microsoft.com/en-us/microsoftteams/what-are-emergency-locations-addresses-and-call-routing"
REC = "https://learn.microsoft.com/en-us/microsoftteams/teams-compliance-recording-setup"
ACS = "https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/call-automation"
CC = "https://learn.microsoft.com/en-us/microsoftteams/teams-contact-center"
MS700 = "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ms-700"
CHECKED = "2026-10-15"


def flow(title: str, aria: str, nodes: list[tuple[str, str]], note: str) -> str:
    width = 880
    height = 210
    gap = width / (len(nodes) + 1)
    parts = [
        f'<svg class="atlas-svg" viewBox="0 0 {width} {height}" role="img" aria-label="{aria}">',
        f"<title>{title}</title>",
    ]
    path = []
    for index, (label, detail) in enumerate(nodes):
        x = gap * (index + 1)
        y = 78
        if index:
            path.append(f"L {x - 28:.0f} {y}")
        else:
            path.append(f"M {x:.0f} {y}")
        parts.append(
            f'<rect x="{x - 54:.0f}" y="48" width="108" height="58" rx="14" fill="var(--bg-3)" stroke="var(--teal)"></rect>'
        )
        parts.append(
            f'<text x="{x:.0f}" y="74" text-anchor="middle" fill="var(--ink)" font-size="13" font-family="sans-serif">{label}</text>'
        )
        parts.append(
            f'<text x="{x:.0f}" y="94" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="sans-serif">{detail}</text>'
        )
    d = " ".join(path)
    parts.append(f'<path class="flow-line" d="{d}" fill="none" stroke="var(--violet)" stroke-width="3"></path>')
    parts.append(
        f'<circle class="atlas-packet" r="6" fill="var(--cc-accent-3)" style="offset-path: path(\'{d}\'); animation: ride 3.6s linear infinite"><title>Packet</title></circle>'
    )
    parts.append(
        f'<text x="{width / 2:.0f}" y="28" text-anchor="middle" fill="var(--muted)" font-size="13" font-family="sans-serif">{note}</text>'
    )
    parts.append("</svg>")
    return "".join(parts)


def tree(title: str, aria: str, root_label: str, branches: list[tuple[str, str]]) -> str:
    width = 860
    height = 280
    parts = [
        f'<svg class="atlas-svg" viewBox="0 0 {width} {height}" role="img" aria-label="{aria}">',
        f"<title>{title}</title>",
        f'<rect x="330" y="16" width="200" height="44" rx="12" fill="var(--bg-3)" stroke="var(--amber)"></rect>',
        f'<text x="430" y="44" text-anchor="middle" fill="var(--ink)" font-size="14" font-family="sans-serif">{root_label}</text>',
    ]
    step = width / (len(branches) + 1)
    for index, (label, detail) in enumerate(branches):
        x = step * (index + 1)
        parts.append(f'<path d="M 430 60 L {x:.0f} 120" fill="none" stroke="var(--violet)" stroke-width="2"></path>')
        parts.append(
            f'<rect x="{x - 70:.0f}" y="120" width="140" height="64" rx="12" fill="var(--bg-3)" stroke="var(--teal)"></rect>'
        )
        parts.append(
            f'<text x="{x:.0f}" y="146" text-anchor="middle" fill="var(--ink)" font-size="13" font-family="sans-serif">{label}</text>'
        )
        parts.append(
            f'<text x="{x:.0f}" y="166" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="sans-serif">{detail}</text>'
        )
    parts.append("</svg>")
    return "".join(parts)


def ladder(title: str, aria: str, actors: list[str], rungs: list[tuple[int, int, str]]) -> str:
    width = 880
    height = 64 + len(rungs) * 36
    gap = width / (len(actors) + 1)
    parts = [
        f'<svg class="atlas-svg" viewBox="0 0 {width} {height}" role="img" aria-label="{aria}">',
        f"<title>{title}</title>",
    ]
    xs = []
    for index, actor in enumerate(actors):
        x = gap * (index + 1)
        xs.append(x)
        parts.append(
            f'<text x="{x:.0f}" y="22" text-anchor="middle" fill="var(--ink)" font-size="13" font-family="sans-serif">{actor}</text>'
        )
        parts.append(
            f'<line x1="{x:.0f}" y1="32" x2="{x:.0f}" y2="{height - 16}" stroke="var(--line)" stroke-width="2"></line>'
        )
    motion = []
    for index, (a, b, label) in enumerate(rungs):
        y = 56 + index * 36
        x1, x2 = xs[a], xs[b]
        parts.append(
            f'<line x1="{x1:.0f}" y1="{y}" x2="{x2:.0f}" y2="{y}" stroke="var(--teal)" stroke-width="2" marker-end="url(#arr)"></line>'
        )
        parts.append(
            f'<text x="{(x1 + x2) / 2:.0f}" y="{y - 6}" text-anchor="middle" fill="var(--muted)" font-size="12" font-family="sans-serif">{label}</text>'
        )
        motion.append(f"M {x1:.0f} {y} L {x2:.0f} {y}")
    d = motion[len(motion) // 2]
    parts.insert(
        2,
        '<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--teal)"></path></marker></defs>',
    )
    parts.append(
        f'<circle class="atlas-packet" r="5" fill="var(--cc-accent-3)" style="offset-path: path(\'{d}\'); animation: ride 2.8s linear infinite"></circle>'
    )
    parts.append("</svg>")
    return "".join(parts)


def stacks(title: str, aria: str, rows: list[tuple[str, str]]) -> str:
    width = 760
    height = 36 + len(rows) * 48
    parts = [
        f'<svg class="atlas-svg" viewBox="0 0 {width} {height}" role="img" aria-label="{aria}">',
        f"<title>{title}</title>",
    ]
    for index, (label, detail) in enumerate(rows):
        y = 16 + index * 48
        inset = index * 18
        parts.append(
            f'<rect x="{40 + inset}" y="{y}" width="{680 - inset * 2}" height="40" rx="10" fill="var(--bg-3)" stroke="var(--teal)"></rect>'
        )
        parts.append(
            f'<text x="{56 + inset}" y="{y + 26}" fill="var(--ink)" font-size="14" font-family="sans-serif">{label} · {detail}</text>'
        )
    parts.append("</svg>")
    return "".join(parts)


SPECS: list[dict] = [
    {
        "id": "dr-ladder",
        "title": "Direct Routing ladder",
        "kind": "flow",
        "topic": "ladder",
        "animated": True,
        "caption": "Commercial SIP/TLS on 5061, then media. Signaling stays with Teams.",
        "source": DR,
        "svg": ladder(
            "Direct Routing ladder",
            "INVITE ladder from Teams through the SBC to the carrier",
            ["Teams", "SBC", "Carrier"],
            [(0, 1, "INVITE TLS 5061"), (1, 0, "100 Trying"), (1, 2, "INVITE"), (2, 1, "180 / 200"), (1, 0, "200 OK"), (0, 1, "ACK")],
        ),
    },
    {
        "id": "options-health",
        "title": "OPTIONS health",
        "kind": "flow",
        "topic": "ladder",
        "animated": True,
        "caption": "Repeated misses take the trunk out of service. Failover needs a second gateway on the route.",
        "source": DR,
        "svg": flow("OPTIONS health", "OPTIONS from the proxy to the SBC and back", [("Proxy", "sip"), ("SBC", "200 OK"), ("Route", "in service"), ("Backup", "priority 2")], "OPTIONS, not a ping"),
    },
    {
        "id": "tls-handshake",
        "title": "TLS handshake",
        "kind": "flow",
        "topic": "security",
        "animated": True,
        "caption": "The paired FQDN must be in the certificate name. A private CA stops SIP before OPTIONS.",
        "source": DR,
        "svg": flow("TLS handshake", "ClientHello through Finished", [("Hello", "TLS 1.2+"), ("Cert", "public CA"), ("Name", "SAN match"), ("Done", "SIP starts")], "5061 never opens if this fails"),
    },
    {
        "id": "media-bypass",
        "title": "Media bypass choice",
        "kind": "flow",
        "topic": "media",
        "animated": True,
        "caption": "Signaling still uses Teams. Bypass is only a candidate on a network that can reach the SBC.",
        "source": DR,
        "svg": flow("Media bypass", "Signaling through Teams and a possible direct media path", [("Client", "media"), ("Teams", "signal"), ("SBC", "local RTP"), ("Carrier", "PSTN")], "Bypass does not move SIP"),
    },
    {
        "id": "e911-match",
        "title": "Emergency location match",
        "kind": "flow",
        "topic": "emergency",
        "animated": True,
        "caption": "A subnet or BSSID needs a civic address. A VPN pool is not the headquarters.",
        "source": EMERG,
        "svg": flow("Emergency location", "Client network to a location record to the SBC", [("Client", "BSSID"), ("LIS", "civic"), ("SBC", "emergency"), ("PSAP", "route")], "Do not place a live test call"),
    },
    {
        "id": "migration-cutover",
        "title": "Migration cutover",
        "kind": "flow",
        "topic": "migration",
        "animated": True,
        "caption": "Teaching order: inventory, identity, one normalization owner, pilot, cutover, hypercare.",
        "source": PSTN,
        "svg": flow("Migration cutover", "Six cutover stages", [("Inventory", "export"), ("Identity", "online"), ("Numbers", "one owner"), ("Pilot", "one site"), ("Cut", "boring"), ("Care", "CQD")], "Not a carrier porting contract"),
    },
    {
        "id": "queue-overflow",
        "title": "Queue overflow",
        "kind": "flow",
        "topic": "routing",
        "animated": True,
        "caption": "The resource account is licensed as a resource account. Overflow is a rule.",
        "source": "https://learn.microsoft.com/en-us/microsoftteams/create-a-phone-system-call-queue",
        "svg": flow("Queue overflow", "Attendant to queue to overflow", [("Number", "resource"), ("Attendant", "hours"), ("Queue", "method"), ("Overflow", "timeout")], "First match, then the queue"),
    },
    {
        "id": "recording-fork",
        "title": "Compliance recording fork",
        "kind": "flow",
        "topic": "recording",
        "animated": True,
        "caption": "A certified recorder, an application instance, an enabled policy, and a grant.",
        "source": REC,
        "svg": flow("Recording fork", "Call forked to a certified recorder", [("Caller", "PSTN"), ("Teams", "policy"), ("Recorder", "certified"), ("Store", "notice")], "Teams Premium does not replace this"),
    },
    {
        "id": "acs-automation",
        "title": "ACS call automation",
        "kind": "flow",
        "topic": "architecture",
        "animated": True,
        "caption": "Answer, play, recognize, then a human escape. This sketch does not place a call.",
        "source": ACS,
        "svg": flow("ACS automation", "Call automation sequence", [("Answer", "connected"), ("Play", "prompt"), ("Recognize", "DTMF"), ("Transfer", "human")], "Hangup is a choice, not the default"),
    },
    {
        "id": "coexist-trombone",
        "title": "Coexistence trombone",
        "kind": "flow",
        "topic": "migration",
        "animated": True,
        "caption": "During dual-running, a CUCM phone reaches a moved user through the SBC. That is not the steady state.",
        "source": CC,
        "svg": flow("Coexistence", "CUCM and Teams joined by a certified SBC", [("CUCM", "stays"), ("SBC", "bridge"), ("Teams", "moved"), ("Normalize", "one owner")], "Both sides must not add +44"),
    },
    {
        "id": "qos-mark",
        "title": "QoS mark path",
        "kind": "flow",
        "topic": "network",
        "animated": True,
        "caption": "Audio 50000–50019 at DSCP 46 when the client can mark. Browsers do not use that range.",
        "source": QOS,
        "svg": flow("QoS mark", "Client mark through the WAN", [("Client", "EF 46"), ("Switch", "trust"), ("WAN", "queue"), ("Far end", "CQD")], "Signaling ports are not configurable"),
    },
    {
        "id": "sba-survive",
        "title": "Survivable branch",
        "kind": "flow",
        "topic": "deployment",
        "animated": True,
        "caption": "The appliance only helps calls it was built to keep. It is not a second Teams cloud.",
        "source": "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-survivable-branch-appliance",
        "svg": flow("Survivable branch", "Branch path when the WAN to Microsoft 365 drops", [("Phone", "branch"), ("SBA", "local"), ("WAN", "down"), ("PSTN", "local trunk")], "Cloud voicemail does not follow"),
    },
    {
        "id": "unified-routing",
        "title": "Unified routing",
        "kind": "flow",
        "topic": "routing",
        "animated": True,
        "caption": "Language, intent, and capacity pick the queue. Overflow is explicit.",
        "source": "https://learn.microsoft.com/en-us/dynamics365/contact-center/",
        "svg": flow("Unified routing", "Intake to classification to queue", [("Intake", "channel"), ("Intent", "outage"), ("Capacity", "free"), ("Queue", "assign")], "Teaching workstream, not a tenant"),
    },
    {
        "id": "invite-dialog",
        "title": "Dialog messages",
        "kind": "flow",
        "topic": "ladder",
        "animated": True,
        "caption": "200 OK without ACK leaves the INVITE transaction open. BYE ends the dialog.",
        "source": DR,
        "svg": ladder(
            "Dialog messages",
            "INVITE, provisional responses, ACK, and BYE",
            ["UAC", "Proxy", "UAS"],
            [(0, 1, "INVITE"), (1, 2, "INVITE"), (2, 1, "180"), (2, 1, "200"), (1, 0, "200"), (0, 2, "ACK"), (0, 2, "BYE")],
        ),
    },
    {
        "id": "trouble-tree",
        "title": "Troubleshooting tree",
        "kind": "diagram",
        "topic": "troubleshooting",
        "animated": False,
        "caption": "Split no dial tone, TLS failure, OPTIONS misses, silence, one user, and a whole subnet.",
        "source": "https://learn.microsoft.com/en-us/microsoftteams/cqd-what-is-call-quality-dashboard",
        "svg": tree(
            "Troubleshooting tree",
            "Symptom branches for Teams voice",
            "Call fails",
            [("No tone", "license / route"), ("TLS down", "certificate"), ("Silence", "UDP media"), ("One user", "Analytics"), ("Subnet", "CQD")],
        ),
    },
    {
        "id": "architecture-tenant",
        "title": "Tenant architecture",
        "kind": "diagram",
        "topic": "architecture",
        "animated": False,
        "caption": "Identity, license, policy, then dial tone. The SBC belongs to one tenant.",
        "source": DR,
        "svg": stacks(
            "Tenant architecture",
            "Layers from Entra ID to the carrier",
            [("Carrier", "PSTN"), ("Certified SBC", "verified domain"), ("Teams Phone", "voice route"), ("Entra ID", "user or resource")],
        ),
    },
    {
        "id": "deployment-steps",
        "title": "Deployment sequence",
        "kind": "diagram",
        "topic": "deployment",
        "animated": False,
        "caption": "The plan page order: requirements, certified SBC, DNS and firewall, connect, routing, licenses, validate.",
        "source": DR,
        "svg": flow("Deployment sequence", "Seven deployment steps from the plan page", [("Review", "network"), ("SBC", "certified"), ("Firewall", "both lists"), ("Connect", "pair"), ("Route", "policy"), ("License", "Phone"), ("Validate", "pilot")], "Checked on the plan page 15 Oct 2026"),
    },
    {
        "id": "firewall-two-lists",
        "title": "Two firewall lists",
        "kind": "diagram",
        "topic": "network",
        "animated": False,
        "caption": "Direct Routing plan: 52.112.0.0/14 and 52.120.0.0/14. Teams client optimize: 52.112.0.0/14 and 52.122.0.0/15. They are not the same list.",
        "source": IPS,
        "svg": tree(
            "Two firewall lists",
            "Direct Routing SBC ranges beside Teams client optimize ranges",
            "Which path?",
            [("SBC signal", "52.112/14"), ("SBC media", "52.120/14"), ("Client optimize", "52.122/15"), ("IPv6 media", "1063:100::/40")],
        ),
    },
    {
        "id": "pstn-four",
        "title": "Four PSTN choices",
        "kind": "diagram",
        "topic": "architecture",
        "animated": False,
        "caption": "Calling Plans, Operator Connect, Teams Phone Mobile, and Direct Routing can share a tenant. They are not one license.",
        "source": PSTN,
        "svg": tree(
            "Four PSTN choices",
            "Four ways a Teams user reaches the PSTN",
            "Teams Phone",
            [("Calling Plan", "Microsoft"), ("Operator Connect", "carrier"), ("Phone Mobile", "SIM"), ("Direct Routing", "your SBC")],
        ),
    },
    {
        "id": "license-stack",
        "title": "License stack",
        "kind": "diagram",
        "topic": "licensing",
        "animated": False,
        "caption": "Teams Phone is not a Calling Plan. A resource account is not an agent license. Teams Premium fills none of these.",
        "source": LIC,
        "svg": stacks(
            "License stack",
            "Separate purchases for phone, carrier, and resource accounts",
            [("Teams", "the client"), ("Teams Phone", "enterprise voice"), ("PSTN add-on", "one of four"), ("Resource account", "attendant or queue")],
        ),
    },
    {
        "id": "dial-plan-order",
        "title": "Normalization order",
        "kind": "diagram",
        "topic": "routing",
        "animated": False,
        "caption": "The first matching normalization rule wins. Later rules do not vote.",
        "source": "https://learn.microsoft.com/en-us/microsoftteams/create-and-manage-dial-plans",
        "svg": flow("Normalization order", "First matching dial-plan rule", [("Dialed", "digits"), ("Rule 1", "specific"), ("Rule 2", "skipped"), ("E.164", "route")], "Put the narrow pattern first"),
    },
    {
        "id": "sbc-geo",
        "title": "Geo-redundant SBC pair",
        "kind": "diagram",
        "topic": "deployment",
        "animated": False,
        "caption": "London and Manchester only fail over when the voice route lists the next gateway.",
        "source": DR,
        "svg": tree(
            "Geo-redundant SBC pair",
            "Two gateways in front of three SIP proxies",
            "Three proxies",
            [("London", "priority 1"), ("Manchester", "priority 2"), ("Certificate", "name match"), ("SBA", "branch only")],
        ),
    },
    {
        "id": "cert-path",
        "title": "Certification path",
        "kind": "diagram",
        "topic": "career",
        "animated": False,
        "caption": "MS-700 is still live. AB-250 is the contact-center exam. AB-210 does not replace MS-700.",
        "source": MS700,
        "svg": stacks(
            "Certification path",
            "Exams this campus will name, as of 14 October 2026",
            [("MS-700", "Teams admin, live"), ("AB-250", "contact center"), ("AZ-900 / SC-900", "fundamentals"), ("MB-280", "retired 31 Jul 2026")],
        ),
    },
    {
        "id": "ecosystem-seams",
        "title": "Ecosystem seams",
        "kind": "diagram",
        "topic": "architecture",
        "animated": False,
        "caption": "Recording, WFM, emergency location, analytics, CRM, and agents attach at named seams.",
        "source": CC,
        "svg": tree(
            "Ecosystem seams",
            "Systems around the call",
            "Teams Phone",
            [("Record", "policy"), ("WFM", "intervals"), ("E911", "civic"), ("CRM", "screen pop"), ("Agent", "human escape")],
        ),
    },
    {
        "id": "cqd-split",
        "title": "CQD versus one user",
        "kind": "diagram",
        "topic": "troubleshooting",
        "animated": False,
        "caption": "A building is Call Quality Dashboard. One person and one call is Call Analytics.",
        "source": "https://learn.microsoft.com/en-us/microsoftteams/use-call-analytics-to-troubleshoot-poor-call-quality",
        "svg": tree(
            "CQD versus one user",
            "Which tool matches the evidence",
            "Poor audio",
            [("One user", "Analytics"), ("One subnet", "CQD"), ("DSCP 0", "mark stripped"), ("VPN", "split tunnel")],
        ),
    },
    {
        "id": "copilot-escape",
        "title": "Agent with a human escape",
        "kind": "diagram",
        "topic": "architecture",
        "animated": False,
        "caption": "A topic can answer. The escape to a person is part of the design, not a failure.",
        "source": "https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio",
        "svg": flow("Human escape", "Bot topic to a queue", [("Caller", "intent"), ("Topic", "answer"), ("Escape", "digit or word"), ("Queue", "person")], "Do not trap the caller"),
    },
    {
        "id": "career-ladder",
        "title": "Career ladder",
        "kind": "diagram",
        "topic": "career",
        "animated": False,
        "caption": "Roles this lab will name. Salary bands are unverified.",
        "source": MS700,
        "svg": stacks(
            "Career ladder",
            "Study paths next to the work",
            [("Voice engineer", "MS-700"), ("Contact center", "AB-250"), ("SBC specialist", "no separate exam here"), ("Recording", "SC-900 language")],
        ),
    },
    {
        "id": "port-stack",
        "title": "Port stack",
        "kind": "diagram",
        "topic": "network",
        "animated": False,
        "caption": "5061 is signaling. 3478–3481 and 49152–53247 are Direct Routing media. Client QoS ranges are a third list.",
        "source": QOS,
        "svg": stacks(
            "Port stack",
            "Three different port lists",
            [("SIP/TLS", "TCP 5061"), ("DR media", "UDP 3478-3481 and 49152-53247"), ("Client audio", "50000-50019 DSCP 46"), ("Client signaling", "50070-50089 DSCP 40")],
        ),
    },
]


def main() -> None:
    rows = []
    for spec in SPECS:
        svg = spec["svg"]
        if "<svg" not in svg:
            raise SystemExit(spec["id"])
        rows.append(
            {
                "id": spec["id"],
                "title": spec["title"],
                "kind": spec["kind"],
                "topic": spec["topic"],
                "animated": spec["animated"],
                "caption": spec["caption"],
                "source": spec["source"],
                "accessed": CHECKED,
                "svg": svg,
            }
        )
    mermaid_path = ROOT / "tools" / "mermaid_flow.svg"
    if mermaid_path.exists():
        raw = mermaid_path.read_text(encoding="utf-8")
        raw = raw.replace('id="flow"', 'id="mermaid-dr-flow"').replace("#flow", "#mermaid-dr-flow")
        rows.append(
            {
                "id": "mermaid-dr-flow",
                "title": "Mermaid call path",
                "kind": "diagram",
                "topic": "architecture",
                "animated": False,
                "caption": "Rendered at build time with mermaid 11.12.0 from a four-node flowchart. The library is vendored for offline rebuilds and is not loaded from a CDN when you open the campus.",
                "source": DR,
                "accessed": CHECKED,
                "svg": raw,
            }
        )
    animated = sum(1 for row in rows if row["animated"])
    if len(rows) < 25 or animated < 12:
        raise SystemExit(f"atlas too small {len(rows)} animated {animated}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"checked": CHECKED, "items": rows}, ensure_ascii=True), encoding="utf-8")
    print(f"atlas {len(rows)} diagrams, {animated} animated -> {OUT}")


if __name__ == "__main__":
    main()

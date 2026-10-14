"""Curriculum for the Microsoft Voice & Contact Center Lab. Facts checked 2026-10-14."""

from __future__ import annotations

import random
from collections import defaultdict

CHECKED = "2026-10-14"
EXAM_FACT = (
    "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. "
    "MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta."
)

SOURCES = {
    "pstn": ("PSTN connectivity options", "https://learn.microsoft.com/en-us/microsoftteams/pstn-connectivity"),
    "lic": ("Teams Phone licensing", "https://learn.microsoft.com/en-us/microsoftteams/teams-phone-licensing"),
    "addon": ("Teams add-on licensing", "https://learn.microsoft.com/en-us/microsoftteams/teams-add-on-licensing/microsoft-teams-add-on-licensing"),
    "vra": ("Teams Phone Resource Account licenses", "https://learn.microsoft.com/en-us/microsoftteams/teams-add-on-licensing/virtual-user"),
    "ra": ("Manage resource accounts", "https://learn.microsoft.com/en-us/microsoftteams/aa-cq-manage-resource-accounts"),
    "prereq": ("Voice app prerequisites and licensing", "https://learn.microsoft.com/en-us/microsoftteams/aa-cq-reference-prerequisites-licensing"),
    "dr": ("Plan Direct Routing", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"),
    "qos": ("QoS in Microsoft Teams", "https://learn.microsoft.com/en-us/microsoftteams/qos-in-teams"),
    "rec": ("Introduction to Teams recording", "https://learn.microsoft.com/en-us/microsoftteams/teams-recording-policy"),
    "recsetup": ("Set up compliance recording", "https://learn.microsoft.com/en-us/microsoftteams/teams-compliance-recording-setup"),
    "recps": ("New-CsTeamsComplianceRecordingPolicy", "https://learn.microsoft.com/en-us/powershell/module/teams/new-csteamscompliancerecordingpolicy?view=teams-ps"),
    "cc": ("Teams contact center integration models", "https://learn.microsoft.com/en-us/microsoftteams/teams-contact-center"),
    "tpe": ("Teams Phone extensibility", "https://learn.microsoft.com/en-us/azure/communication-services/concepts/interop/tpe/teams-phone-extensibility-overview"),
    "tpeblog": ("Teams Phone extensibility announcement", "https://techcommunity.microsoft.com/blog/microsoftteamsblog/streamline-your-contact-center-telephony-with-teams-phone-extensibility/4450515"),
    "ab250": ("Study guide AB-250", "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250"),
    "ab250c": ("Dynamics 365 Contact Center AI Engineer Associate", "https://learn.microsoft.com/en-us/credentials/certifications/d365-contact-center-ai-engineer-associate/"),
    "ab250blog": ("AB-250 certification announcement", "https://techcommunity.microsoft.com/blog/skills-hub-blog/new-microsoft-certified-dynamics-365-contact-center-ai-engineer-associate-certif/4494119"),
    "ms700": ("Study guide MS-700", "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ms-700"),
    "ms700c": ("Teams Administrator Associate", "https://learn.microsoft.com/en-us/credentials/certifications/m365-teams-administrator-associate/"),
    "retire": ("Retired certification exams", "https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams"),
    "partner": ("Partner Center July 2026 announcements", "https://learn.microsoft.com/en-us/partner-center/announcements/2026-july"),
    "sc900": ("Security, Compliance, and Identity Fundamentals", "https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/"),
    "az900": ("Azure Fundamentals", "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/"),
    "mb280": ("Study guide MB-280", "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-280"),
    "phone": ("Set up Teams Phone", "https://learn.microsoft.com/en-us/microsoftteams/setting-up-your-phone-system"),
    "cqd": ("What is Call Quality Dashboard", "https://learn.microsoft.com/en-us/microsoftteams/cqd-what-is-call-quality-dashboard"),
    "calla": ("Use Call Analytics", "https://learn.microsoft.com/en-us/microsoftteams/use-call-analytics-to-troubleshoot-poor-call-quality"),
    "vm": ("Cloud Voicemail", "https://learn.microsoft.com/en-us/microsoftteams/cloud-voicemail"),
    "sba": ("Survivable Branch Appliance", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-survivable-branch-appliance"),
    "lbr": ("Location-based routing", "https://learn.microsoft.com/en-us/microsoftteams/location-based-routing-plan"),
    "emerg": ("Emergency locations, addresses, and routing", "https://learn.microsoft.com/en-us/microsoftteams/what-are-emergency-locations-addresses-and-call-routing"),
    "bypass": ("Media bypass with Direct Routing", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-plan"),
    "dial": ("Create and manage dial plans", "https://learn.microsoft.com/en-us/microsoftteams/create-and-manage-dial-plans"),
    "route": ("Manage voice routing policies", "https://learn.microsoft.com/en-us/microsoftteams/manage-voice-routing-policies"),
    "aa": ("Set up an auto attendant", "https://learn.microsoft.com/en-us/microsoftteams/create-a-phone-system-auto-attendant"),
    "cq": ("Set up a call queue", "https://learn.microsoft.com/en-us/microsoftteams/create-a-phone-system-call-queue"),
    "oc": ("Plan Operator Connect", "https://learn.microsoft.com/en-us/microsoftteams/operator-connect-plan"),
    "tpm": ("Plan Teams Phone Mobile", "https://learn.microsoft.com/en-us/microsoftteams/teams-phone-mobile-plan"),
    "calling": ("Calling Plans", "https://learn.microsoft.com/en-us/microsoftteams/calling-plans-for-office-365"),
    "sbcs": ("Certified SBCs for Direct Routing", "https://learn.microsoft.com/en-us/microsoftteams/direct-routing-border-controllers"),
    "sipgw": ("SIP Gateway", "https://learn.microsoft.com/en-us/microsoftteams/sip-gateway-plan"),
    "net": ("Prepare the network for Teams", "https://learn.microsoft.com/en-us/microsoftteams/prepare-network"),
    "roles": ("Use Teams admin roles", "https://learn.microsoft.com/en-us/microsoftteams/using-admin-roles"),
    "acs": ("Azure Communication Services Call Automation", "https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/call-automation"),
    "speech": ("Azure AI Speech overview", "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview"),
    "copilot": ("Copilot Studio overview", "https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio"),
    "d365": ("Dynamics 365 Contact Center", "https://learn.microsoft.com/en-us/dynamics365/contact-center/"),
    "audiocodes": ("AudioCodes session border controllers", "https://www.audiocodes.com/solutions-products/products/session-border-controllers"),
    "ribbon": ("Ribbon Communications", "https://ribboncommunications.com/"),
    "oracle": ("Oracle Session Border Controller", "https://www.oracle.com/communications/session-border-controller/"),
    "cube": ("Cisco Unified Border Element", "https://www.cisco.com/c/en/us/products/unified-communications/unified-border-element/index.html"),
    "foundry": ("Azure AI Foundry documentation", "https://learn.microsoft.com/en-us/azure/ai-foundry/"),
}


def cite(*keys: str) -> list[dict]:
    rows = []
    for key in keys:
        title, url = SOURCES[key]
        rows.append({"title": title, "url": url, "accessed": CHECKED})
    return rows


def build_payload() -> dict:
    from bosses import build_bosses
    from charts import build_charts
    from faults import build_faults
    from figures import attach_figures
    from lesson_rows import LESSON_ROWS
    from make_audio import CLIPS
    from scenario_rows import SCENARIO_ROWS

    tracks = track_defs()
    lessons = [parse_lesson(row) for row in LESSON_ROWS]
    illustrations, flows = attach_figures(lessons)
    glossary = build_glossary()
    quiz = build_quiz(glossary)
    cards = build_cards(glossary)
    scenarios = [parse_scenario(row) for row in SCENARIO_ROWS]
    labs = lab_defs()
    exams = exam_defs()
    mind = mind_map()
    sources = [
        {"title": title, "url": url, "accessed": CHECKED, "used": key}
        for key, (title, url) in SOURCES.items()
    ]
    return {
        "checked": CHECKED,
        "examFact": EXAM_FACT,
        "tracks": tracks,
        "lessons": lessons,
        "labs": labs,
        "glossary": glossary,
        "quiz": quiz,
        "cards": cards,
        "scenarios": scenarios,
        "exams": exams,
        "map": mind,
        "sources": sources,
        "charts": build_charts(),
        "faults": build_faults(),
        "bosses": build_bosses(),
        "audio": [{key: value for key, value in clip.items() if key != "text"} for clip in CLIPS],
        "illustrations": illustrations,
        "flows": flows,
    }


def parse_lesson(row: tuple) -> dict:
    (lid, track, title, minutes, why, depends, p1, p2, flow, chart_title, chart_note, bars, lab, say, fault, listen, keys) = row
    return {
        "id": lid,
        "track": track,
        "title": title,
        "minutes": minutes,
        "why": why,
        "depends": [part.strip() for part in depends.split(";") if part.strip()],
        "body": [p1, p2],
        "flow": parse_flow(flow),
        "chart": {"title": chart_title, "note": chart_note, "bars": parse_bars(bars)},
        "lab": lab or None,
        "say": say,
        "fault": fault,
        "listen": listen,
        "sources": cite(*keys.split(",")),
    }


def parse_flow(text: str) -> list[dict]:
    steps = []
    for part in text.split(";"):
        label, detail = part.split("|", 1)
        steps.append({"label": label.strip(), "detail": detail.strip()})
    return steps


def parse_bars(text: str) -> list[dict]:
    bars = []
    for part in text.split(";"):
        label, value, display = part.split("|", 2)
        bars.append({"label": label.strip(), "value": float(value), "display": display.strip()})
    return bars


def track_defs() -> list[dict]:
    rows = [
        ("t01", "01", "🧭", "Foundations", [], "A voice change is a tenant change. Identity, domain, and admin role decide whether the later work can exist.", "You can name the tenant boundary, the account types, and the admin roles before anyone mentions an SBC.", "Identity before dial tone", "Order of operations, not a volume.", "Directory|1|Entra ID;Domain|2|Verified;License|3|Assigned;Policy|4|Granted", "lic,roles"),
        ("t02", "02", "🎫", "Licensing", ["t01"], "The wrong SKU looks like a routing bug. Teams Phone, Calling Plans, Audio Conferencing, resource accounts, and Teams Premium are different purchases.", "You can pick a license set for a user, a room, and a voice app, and say what Teams Premium does not include.", "Separate purchases", "Each bar is a distinct license family, not a price.", "Teams Phone|2|User PSTN;Calling Plan|3|Microsoft carrier;Audio Conferencing|2|Meeting dial-in;Resource account|1|Voice app", "lic,vra"),
        ("t03", "03", "⌨️", "PowerShell and admin", ["t01"], "The portal hides order. The shell shows the object you actually changed, and it is how compliance recording is assigned.", "You can read a user, name the cmdlet family, and refuse to guess parameters you have not checked.", "Read, then change", "Sequence of a safe change.", "Read|1|Get-;Create|2|New-;Change|3|Set-;Assign|4|Grant-", "roles"),
        ("t04", "04", "📶", "Network and QoS", ["t01"], "Teams audio dies in the same queues as file copies unless the path is short and the mark survives.", "You can recite the port and DSCP table and say why a VPN is not a media design.", "DSCP values from the QoS article", "Bar length is the DSCP mark, not a traffic volume.", "Audio|46|EF 46;Video|34|AF41;Share|18|AF21;Signaling|40|CS5", "qos,net"),
        ("t05", "05", "☎️", "PSTN connectivity", ["t02", "t04"], "Every external call uses one of four connectivity options. Mixing them is allowed. Pretending they are the same license is not.", "You can choose Calling Plan, Operator Connect, Teams Phone Mobile, or Direct Routing for a specific user population.", "Who carries the call", "Teaching weight of how much you operate.", "Calling Plan|1|Microsoft operates;Operator Connect|2|Carrier operates;Phone Mobile|2|Mobile operator;Direct Routing|4|You operate the SBC", "pstn,dr"),
        ("t06", "06", "🔀", "Routing and dial plans", ["t03", "t05"], "Normalization and routing are two steps. A number that is not E.164 never gets a fair chance at a voice route.", "You can walk usages in order, apply first-match normalization, and explain Islands mode.", "First match, then route", "Teaching sequence.", "Normalize|1|Dial plan;Usage|2|Policy order;Route|3|Regex;Gateway|4|SBC priority", "dial,route,dr"),
        ("t07", "07", "📥", "Attendants and queues", ["t02", "t06"], "The number people publish is often a voice app, not a human. The resource account is the identity of that app.", "You can design an attendant, a queue, overflow, and the license on the resource account.", "Voice app, not a user", "Required objects.", "Resource account|1|Identity;Attendant|2|Menu;Queue|3|Agents;Overflow|4|Timeout", "aa,cq,vra"),
        ("t08", "08", "🚨", "Emergency, LBR, survivability", ["t04", "t05", "t06"], "Emergency calling is a design gate, not a checkbox after go-live. Location-based routing and branch survivability use the same network map.", "You can explain dynamic location, who routes a Direct Routing emergency call, and what an SBA is for.", "Location before the carrier", "Teaching sequence for a site.", "Trusted IP|1|Edge;Subnet|2|Site;Address|3|Civic;Route|4|SBC or Microsoft", "emerg,lbr,sba"),
        ("t09", "09", "🎧", "Devices and media", ["t04", "t05"], "Phones, rooms, and media bypass change where RTP flows. Signaling still belongs to Teams.", "You can decide bypass versus the media processor and license a room without inventing a Calling Plan.", "Two media paths", "Path choice, not a quality score.", "Processor|2|Default;Bypass|2|Same site;SIP Gateway|1|Analog;Room|1|Own SKU", "bypass,sipgw,dr"),
        ("t10", "10", "🧱", "Session border controllers", ["t05"], "Microsoft supports Direct Routing on certified SBCs. AudioCodes, Ribbon, Oracle, and Cisco CUBE are families you will meet. The support path starts with the vendor.", "You can say what certification buys, and what you still configure on each family.", "Certified or unsupported", "Shared gate, then vendor detail.", "Certified list|1|Microsoft;Vendor guide|2|Release you run;Firewall|3|Current ranges;Failover|4|Rehearsed", "sbcs,dr,cube"),
        ("t11", "11", "🔐", "TLS, certificates, SIP", ["t10"], "A dial-plan argument is wasted when the certificate name is wrong. OPTIONS tell you the trunk is alive.", "You can walk a TLS failure, the three SIP proxies, and the codec list including the AMR-WB bypass limit.", "Handshake before INVITE", "Failure order.", "TLS version|1|1.2+;Name|2|SAN matches;Trust|3|Public CA;OPTIONS|4|200 OK", "dr"),
        ("t12", "12", "🔎", "Troubleshooting", ["t04", "t06", "t11"], "Call Analytics is one call. CQD is a building. The SBC trace is the ladder. Mixing them up wastes the hour.", "You can pick the tool that matches the scope of the fault and name one hypothesis.", "Scope the evidence", "Which tool, not a made-up rate.", "One call|1|Call Analytics;Building|2|CQD;Trunk|3|OPTIONS;Ladder|4|SBC trace", "cqd,calla,qos"),
        ("t13", "13", "🗂️", "Dynamics contact center", ["t01", "t07"], "Dynamics 365 Contact Center is Microsoft’s CCaaS. Unified routing, channels, and Copilot are the job, and AB-250 is the exam that matches it.", "You can name workstreams, queues, capacity, and the published AB-250 skill weights.", "AB-250 skill weights, low end of the published range", "Study guide accessed 14 October 2026. Ranges are wider than the bar.", "Deploy|15|15–20%;Channels|30|30–35%;Agents and AI|10|10–15%;Work distribution|10|10–15%;Rep experience|15|15–20%;Analytics|10|10–15%", "ab250,d365"),
        ("t14", "14", "🔗", "Coexistence and CCaaS", ["t05", "t10", "t13"], "Connect, Extend, and Unify are different media paths. CUCM, Webex, UCCE, Genesys, and Amazon Connect each need a named bridge, not a slogan.", "You can say which model a design is, and where CUBE sits between CUCM and Teams.", "Three models on Learn", "Current names as of 14 October 2026.", "Connect|1|SBC;Extend|2|Graph and client;Unify|3|ACS-native", "cc,tpe"),
        ("t15", "15", "🤖", "ACS, Speech, Copilot", ["t13"], "Call Automation is a server-side call with events. Speech and Copilot Studio can sit in the recognize step. Foundry is where you evaluate a model, not a second phone system.", "You can sketch answer, play, recognize, and transfer, with a human escape.", "IVR as events", "Teaching sequence of one call.", "Answer|1|Connected;Play|2|Prompt;Recognize|3|DTMF or speech;Transfer|4|Human", "acs,speech,copilot"),
        ("t16", "16", "🗺️", "Certifications and status", ["t01", "t13"], EXAM_FACT, "You can correct a retired exam number without bluffing a replacement.", "Status on 14 October 2026", "3 means a live target, 2 means in beta, 1 means retired. Not a difficulty score.", "MS-700|3|Still live, no replacement;AB-250|3|Contact center;AB-210|2|In beta, successor to MB-280;AZ-900|3|Fundamentals;SC-900|3|Updates 21 Oct 2026;MB-280|1|Retired Jul 31 2026", "ms700,ab250,retire,partner"),
        ("t17", "17", "🌐", "Ecosystem", ["t08", "t12", "t13", "t14", "t15"], "The call is not finished when it rings. Recording, workforce management, emergency location, analytics, CRM, and agents attach at seams you can name.", "You can draw the mind map, configure a compliance-recording gate, and say which identifier joins the logs.", "Sister systems", "Each bar is a system that must not be confused with Teams Phone itself.", "Recording|2|Policy bot;WFM|2|Queue intervals;E911|3|Location;Power BI|2|After CQD;CRM|2|Screen pop;Agent|2|With escape", "rec,cqd,emerg,cc"),
    ]
    tracks = []
    for tid, num, emoji, title, depends, why, outcome, chart_title, note, bars, keys in rows:
        tracks.append({
            "id": tid,
            "num": num,
            "emoji": emoji,
            "title": title,
            "depends": depends,
            "why": why,
            "outcome": outcome,
            "chart": {"title": chart_title, "note": note, "bars": parse_bars(bars)},
        })
    return tracks


def lab_defs() -> list[dict]:
    return [
        {"id": "dr-path", "title": "Direct Routing call path", "track": "t05", "minutes": 12, "summary": "Walk Teams, the dial plan, the voice route, TLS to the SBC, and the carrier. Inject a dead trunk or a bad certificate."},
        {"id": "route-match", "title": "Voice-routing policy matcher", "track": "t06", "minutes": 8, "summary": "Walk PSTN usages in order and take the first matching voice route."},
        {"id": "dial-plan", "title": "Dial-plan normalization tester", "track": "t06", "minutes": 8, "summary": "First matching normalization rule wins. Later rules do not get a vote."},
        {"id": "aa-cq", "title": "Auto attendant and call queue builder", "track": "t07", "minutes": 10, "summary": "Check hours, menu, queue method, resource-account license, overflow, and outbound funding."},
        {"id": "sbc-check", "title": "SBC configuration checklist", "track": "t10", "minutes": 10, "summary": "Shared gate for AudioCodes, Ribbon, Oracle, and Cisco CUBE. Saved only in this browser."},
        {"id": "tls-hand", "title": "Certificate and TLS handshake", "track": "t11", "minutes": 8, "summary": "Step ClientHello through Finished, and stop on a name mismatch, a private CA, or TLS 1.0."},
        {"id": "cqd-fault", "title": "CQD find the fault", "track": "t12", "minutes": 10, "summary": "Five short cases. Pick the fault that fits the evidence, not the tool you happen to like."},
        {"id": "license-pick", "title": "Licensing picker", "track": "t02", "minutes": 8, "summary": "Turn a few questions into a license set, including the resource account and the Teams Premium trap."},
        {"id": "cucm-map", "title": "CUCM to Teams translator", "track": "t14", "minutes": 8, "summary": "CSS, partition, route pattern, and translation pattern, beside the Teams object that is actually close."},
        {"id": "routing-designer", "title": "Unified routing designer", "track": "t13", "minutes": 8, "summary": "Language, intent, and capacity decide the queue. Overflow is a rule, not a surprise."},
        {"id": "acs-flow", "title": "ACS call-automation flow", "track": "t15", "minutes": 8, "summary": "Answer, play, recognize, transfer, hang up. Press a digit and read the event."},
        {"id": "erlang", "title": "Erlang C calculator", "track": "t17", "minutes": 10, "summary": "Erlangs, probability of waiting, service level, and a shrinkage roster. Labeled as a teaching model."},
        {"id": "exam-map", "title": "Exam readiness map", "track": "t16", "minutes": 8, "summary": "Rate yourself against the exams that are actually live on 14 October 2026."},
        {"id": "qos-mark", "title": "QoS marker", "track": "t04", "minutes": 5, "summary": "Port range, DSCP, and class for audio, video, sharing, and signaling."},
        {"id": "e911-match", "title": "Emergency location matcher", "track": "t08", "minutes": 6, "summary": "A teaching topology: subnet to site to civic address, including a VPN pool that is not dispatchable."},
        {"id": "options-health", "title": "SIP OPTIONS health", "track": "t11", "minutes": 5, "summary": "Missed OPTIONS move a trunk from in service to out of the route."},
        {"id": "bypass", "title": "Media bypass decider", "track": "t09", "minutes": 6, "summary": "Same site, VPN, location-based routing, and the bypass flag. Signaling does not bypass."},
        {"id": "coexist", "title": "Coexistence bridge", "track": "t14", "minutes": 6, "summary": "CUCM ranges, Teams numbers, and one owner for normalization."},
        {"id": "usage-build", "title": "PSTN usage and route builder", "track": "t06", "minutes": 8, "summary": "Add a route and test a number against the policy you just made."},
        {"id": "bandwidth", "title": "Codec bandwidth", "track": "t04", "minutes": 6, "summary": "G.711 at 20 ms is 80 kbit/s at layer 3 and 87.2 kbit/s with an 18-byte Ethernet header."},
        {"id": "ivr-intent", "title": "IVR intent and escape", "track": "t15", "minutes": 6, "summary": "A keyword stand-in for a Copilot Studio topic, plus the human escape."},
        {"id": "sba-time", "title": "Survivable Branch Appliance timeline", "track": "t08", "minutes": 5, "summary": "What still works when the path to Microsoft 365 is down, and what does not."},
        {"id": "record-policy", "title": "Compliance recording builder", "track": "t17", "minutes": 8, "summary": "Certified recorder, application instance, enabled policy, grant, and notification."},
        {"id": "integrate-map", "title": "Integration map", "track": "t17", "minutes": 6, "summary": "Pick a goal. See the systems you actually touch, and the ones you should not pretend Teams includes."},
        {"id": "hook-plan", "title": "Future-integration hooks", "track": "t17", "minutes": 6, "summary": "Seams you can leave with products that exist today. Each missing seam has a failure."},
    ]


def exam_defs() -> list[dict]:
    return [
        {"id": "ms700", "code": "MS-700", "name": "Microsoft 365 Certified: Teams Administrator Associate", "status": "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement.", "next": "Study the MS-700 guide, including network and troubleshooting objectives. There is no replacement exam.", "live": True},
        {"id": "ab250", "code": "AB-250", "name": "Dynamics 365 Contact Center AI Engineer Associate", "status": "The contact-center exam. Beta window was public through 18 June 2026. Confirm the live seat on Learn. AB-210 is not this exam.", "next": "Map the six published skill groups, especially channels at 30–35%.", "live": True},
        {"id": "ab210", "code": "AB-210", "name": "Dynamics 365 Sales AI Consultant Associate", "status": "AB-210 is in beta. It is the successor to MB-280. It is not a replacement for MS-700 and it is not the contact-center exam.", "next": "Study AB-210 only if the role is sales. It is in beta. The contact-center exam is AB-250.", "live": False},
        {"id": "mb280", "code": "MB-280", "name": "Dynamics 365 Customer Experience Analyst Associate", "status": "MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta. It was not the contact-center exam.", "next": "Do not book it. AB-210 is its successor and is in beta. AB-250 is the contact-center exam.", "live": False},
        {"id": "az900", "code": "AZ-900", "name": "Azure Fundamentals", "status": "Still the fundamentals exam. Not on the retirement list checked 14 October 2026.", "next": "Use it for ACS, Speech, and identity context, not as a voice exam.", "live": True},
        {"id": "sc900", "code": "SC-900", "name": "Security, Compliance, and Identity Fundamentals", "status": "Live. English version scheduled to update on 21 October 2026.", "next": "Read it for Entra ID, compliance recording’s trust boundary, and Conditional Access side effects.", "live": True},
        {"id": "ms900", "code": "MS-900", "name": "Microsoft 365 Fundamentals", "status": "Retired 31 March 2026.", "next": "Do not book it.", "live": False},
        {"id": "ai900", "code": "AI-900", "name": "Azure AI Fundamentals", "status": "Retired 30 June 2026.", "next": "Use product docs for Speech and Copilot Studio instead of this retired exam.", "live": False},
    ]


def mind_map() -> dict:
    nodes = [
        ("rec", "Recording", 120, 90, "#/lesson/t17-rec"),
        ("entra", "Entra ID", 340, 90, "#/lesson/t01-entra"),
        ("exo", "Voicemail", 560, 90, "#/lesson/t01-vm"),
        ("crm", "CRM", 120, 450, "#/lesson/t17-crm"),
        ("dial", "Dial plan", 340, 270, "#/lesson/t06-norm"),
        ("teams", "Teams Phone", 560, 270, "#/lesson/t05-four"),
        ("sbc", "SBC", 780, 270, "#/lesson/t10-cert"),
        ("pstn", "Carrier", 1000, 270, "#/lesson/t05-dr"),
        ("bot", "Copilot", 120, 630, "#/lesson/t17-ai"),
        ("acs", "ACS", 340, 450, "#/lesson/t15-auto"),
        ("aa", "Queue", 560, 450, "#/lesson/t07-ra"),
        ("e911", "E911", 780, 450, "#/lesson/t17-e911"),
        ("cucm", "CUCM", 1000, 450, "#/lesson/t14-cucm"),
        ("wfm", "WFM", 340, 630, "#/lesson/t17-wfm"),
        ("d365", "Dynamics", 560, 630, "#/lesson/t13-what"),
        ("pbi", "Power BI", 780, 630, "#/lesson/t17-pbi"),
        ("bridge", "Bridges", 1000, 630, "#/lesson/t17-bridges"),
    ]
    edges = [
        ("entra", "teams", "homed online"),
        ("exo", "teams", "voicemail"),
        ("dial", "teams", "normalize"),
        ("teams", "sbc", "TLS 5061"),
        ("sbc", "pstn", "trunk"),
        ("sbc", "e911", "emergency"),
        ("teams", "aa", "resource acct"),
        ("teams", "rec", "policy bot"),
        ("aa", "d365", "CCaaS queue"),
        ("d365", "acs", "voice channel"),
        ("acs", "bot", "recognize"),
        ("d365", "crm", "case"),
        ("d365", "wfm", "intervals"),
        ("teams", "pbi", "CQD export"),
        ("sbc", "cucm", "coexistence"),
        ("cucm", "bridge", "one normalizer"),
        ("bot", "aa", "human escape"),
    ]
    return {
        "nodes": [{"id": a, "label": b, "x": c, "y": d, "href": e} for a, b, c, d, e in nodes],
        "edges": [{"from": a, "to": b, "label": c} for a, b, c in edges],
    }


def build_glossary() -> list[dict]:
    rows: list[dict] = []

    def add(term: str, track: str, plain: str, why: str, config: str, fault: str, source: str) -> None:
        rows.append({
            "term": term,
            "track": track,
            "plain": plain,
            "why": why,
            "config": config,
            "fault": fault,
            "source": source,
            "accessed": CHECKED,
        })

    # Core narrative terms are appended from glossary_core.add_core
    from glossary_core import add_core
    add_core(add)

    families = [
        ("Audio", "50000–50019", "46", "EF", "Expedited Forwarding"),
        ("Video", "50020–50039", "34", "AF41", "Assured Forwarding 41"),
        ("Application sharing", "50040–50059", "18", "AF21", "Assured Forwarding 21"),
        ("Calling and meetings signaling", "50070–50089", "40", "CS5", "Class Selector 5"),
    ]
    for kind, ports, dscp, klass, phrase in families:
        add(
            f"{kind} DSCP {dscp}",
            "t04",
            f"Microsoft’s QoS article recommends DSCP {dscp} ({klass}, {phrase}) for Teams {kind.lower()}, with initial client source ports {ports}.",
            "A mark only helps if every hop agrees. Audio waiting in the default queue is how words drop out.",
            "Enable QoS markers in the Teams admin center and match the port range on the network. Signaling ports are not configurable.",
            f"{kind} packets in the documented port range arrive at the WAN edge marked 0.",
            SOURCES["qos"][1],
        )
        add(
            f"{kind} port range {ports}",
            "t04",
            f"The recommended initial client source ports for {kind.lower()} are {ports}. Browser joins do not use these fixed ranges.",
            "Port-based ACLs are how routers mark traffic from devices that cannot set DSCP themselves.",
            "Keep the ranges adjacent and non-overlapping if you resize them. Do not resize the signaling range.",
            "An ACL matches the wrong range, so video is queued as audio or as best effort.",
            SOURCES["qos"][1],
        )

    cmdlets = [
        ("Connect-MicrosoftTeams", "Opens a PowerShell session against the tenant that holds the voice configuration."),
        ("Get-CsOnlineUser", "Reads the online user, including voice policy and number fields you should inspect before a change."),
        ("New-CsOnlinePSTNGateway", "Pairs a Direct Routing SBC by the FQDN you will present on the certificate."),
        ("Set-CsOnlinePSTNGateway", "Changes settings on a paired SBC, including media bypass and SIP signaling options documented for that cmdlet."),
        ("Get-CsOnlinePSTNGateway", "Shows the paired gateways and the status fields the module returns."),
        ("Set-CsOnlinePstnUsage", "Maintains the tenant’s list of PSTN usage names."),
        ("New-CsOnlineVoiceRoute", "Creates a voice route with a number pattern and one or more gateways."),
        ("New-CsOnlineVoiceRoutingPolicy", "Creates a policy whose ordered PSTN usages a user is allowed to match."),
        ("Grant-CsOnlineVoiceRoutingPolicy", "Assigns a voice routing policy to a user."),
        ("New-CsTenantDialPlan", "Creates a tenant dial plan that holds normalization rules."),
        ("Grant-CsTenantDialPlan", "Assigns a tenant dial plan to a user."),
        ("Set-CsPhoneNumberAssignment", "Assigns or removes a phone number from a user or resource account."),
        ("New-CsAutoAttendant", "Creates an auto attendant voice app."),
        ("New-CsCallQueue", "Creates a call queue voice app."),
        ("New-CsOnlineApplicationInstance", "Creates an application instance. Resource accounts and compliance-recording bots both use this family. Confirm the parameters for the object you mean."),
        ("New-CsTeamsComplianceRecordingPolicy", "Creates the policy that invites a recording application into new calls and meetings."),
        ("New-CsTeamsComplianceRecordingApplication", "Attaches a recording application instance to a compliance recording policy."),
        ("Grant-CsTeamsComplianceRecordingPolicy", "Assigns the compliance recording policy to a user. Assignment alone is not enough without the application instance."),
        ("Get-CsTeamsComplianceRecordingPolicy", "Reads the compliance recording policies in the tenant."),
        ("New-CsOnlineLisCivicAddress", "Starts an emergency civic address. Confirm the current CsOnlineLis noun before you run it."),
    ]
    for name, plain in cmdlets:
        add(
            name,
            "t03",
            plain + " Confirm the parameter set with Get-Help in the module version you have.",
            "Interviewers ask for the object model more than for a memorized script. A wrong parameter against production is not a lab.",
            "Run it first in a lab tenant. Read with Get- before Set- or Grant-.",
            "The portal shows a success toast and the shell shows the old policy still assigned.",
            SOURCES["dr"][1],
        )

    responses = [
        ("100 Trying", "The next hop received the INVITE and is working on it. Dialog is not up."),
        ("180 Ringing", "The far end is alerting. You may not have media yet."),
        ("183 Session Progress", "Early media may be present. Do not treat it as an answer."),
        ("200 OK", "The INVITE succeeded. ACK completes the dialog. BYE ends it later."),
        ("ACK", "Completes the INVITE transaction after 200 OK."),
        ("BYE", "Ends an established dialog. The other side answers 200 OK."),
        ("CANCEL", "Gives up an INVITE that has not been answered yet."),
        ("OPTIONS", "A health check. Teams uses it to see whether the SBC is answering."),
        ("403 Forbidden", "The request was understood and refused. Often policy, identity, or a route the trunk will not accept."),
        ("404 Not Found", "The user or number is not known at that hop."),
        ("408 Request Timeout", "No final response in time. Look at firewalls and the next hop, not at the greeting."),
        ("480 Temporarily Unavailable", "The target exists and cannot take the call right now."),
        ("486 Busy Here", "The target is busy."),
        ("487 Request Terminated", "The INVITE ended because of CANCEL or a similar abort."),
        ("488 Not Acceptable Here", "Codecs or SDP could not be agreed. A classic empty codec intersection."),
        ("503 Service Unavailable", "The hop is overloaded or deliberately out of service. Fail over if you have another gateway."),
    ]
    for code, plain in responses:
        add(code, "t11", plain, "A ladder without response codes is a story. The code is the branch.", "Capture the Call-ID and read the code on the hop that generated it.", "Someone restarts the SBC because a 180 looked slow, while the 488 was the real fault.", SOURCES["dr"][1])

    codecs = [
        ("G.711", 160, "64 kbit/s payload. At 20 ms, layer 3 is 80 kbit/s and Ethernet with an 18-byte header is 87.2 kbit/s."),
        ("G.722", 160, "Wideband payload at 64 kbit/s. The header math matches G.711 when the packet is 160 bytes every 20 ms."),
        ("G.729", 20, "8 kbit/s payload, 20 bytes at 20 ms. Layer 3 is 24 kbit/s. Direct Routing can offer it. Confirm the SBC allows it."),
        ("SILK", 0, "A Teams codec on the Direct Routing list. Bitrate varies, so do not quote a single G.711-style figure for it."),
        ("AMR-WB", 0, "On the Direct Routing codec list for non-bypass calls only. Do not expect it on a media-bypass path."),
    ]
    for name, payload, plain in codecs:
        add(name, "t11", plain, "An empty codec intersection is a 488, not a mystery outage.", "Order codecs on the SBC deliberately. Do not leave a lab default in production.", "Bypass is on and AMR-WB was the only common codec, so the call fails.", SOURCES["dr"][1])

    roles = [
        ("Teams Administrator", "Broad Teams administration, including many voice settings."),
        ("Teams Telephony Administrator", "Voice-focused administration of calling and phone numbers."),
        ("Teams Communications Administrator", "Meetings and voice communications configuration, without the full Teams admin scope."),
        ("Teams Communications Support Engineer", "Troubleshooting access, including call analytics for users."),
        ("Teams Communications Support Specialist", "Narrower troubleshooting access than the engineer role."),
        ("User Administrator", "Required together with a Teams admin role when you create and license resource accounts."),
    ]
    for name, plain in roles:
        add(name, "t01", plain + " Check the current role article before you grant Global Administrator out of habit.", "Day-to-day voice work should not sit in a global role.", "Assign the smallest role that can do the change.", "A project uses one global admin account for every SBC change, and nobody can see who did what.", SOURCES["roles"][1])

    methods = [
        ("Attendant routing", "Rings the agents who are available at the same time, within the queue’s limits."),
        ("Serial routing", "Rings agents in the order you listed, one after another."),
        ("Round robin", "Remembers who took the last call and starts after them."),
        ("Longest idle", "Offers the call to the agent who has been idle longest."),
    ]
    for name, plain in methods:
        add(name, "t07", plain + " Presence-based routing can skip an agent who is already in a call or a meeting.", "The method is a business promise. Serial is cruel to the person on top if you forget.", "Set it on the call queue and test with two agents, one busy and one free.", "Every call hits the same person because the method is serial and the list never rotates.", SOURCES["cq"][1])

    extras_done = {row["term"] for row in rows}
    # Deterministic filler is not used. Core + families must clear 300.
    if len(rows) < 300:
        raise SystemExit(f"glossary short: {len(rows)}")
    # Uniqueness
    terms = [row["term"] for row in rows]
    if len(terms) != len(set(terms)):
        dupes = [term for term in terms if terms.count(term) > 1]
        raise SystemExit(f"duplicate terms: {set(dupes)}")
    return rows


def build_quiz(glossary: list[dict]) -> list[dict]:
    by_track: dict[str, list[dict]] = defaultdict(list)
    for item in glossary:
        by_track[item["track"]].append(item)
    quiz = []
    for item in glossary:
        pool = [other for other in by_track[item["track"]] if other["term"] != item["term"]]
        if len(pool) < 3:
            pool = [other for other in glossary if other["term"] != item["term"]]
        rng = random.Random("q1:" + item["term"])
        picks = rng.sample(pool, 3)
        choices = [item["plain"]] + [pick["plain"] for pick in picks]
        order = [0, 1, 2, 3]
        rng.shuffle(order)
        ordered = [choices[i] for i in order]
        answer = order.index(0)
        quiz.append({
            "id": "q-" + str(len(quiz) + 1),
            "track": item["track"],
            "q": f"Which description of {item['term']} is accurate?",
            "choices": ordered,
            "answer": answer,
            "explain": item["plain"] + " " + item["why"] + f" Source: {item['source']} accessed {item['accessed']}.",
            "source": item["source"],
        })
        rng2 = random.Random("q2:" + item["term"])
        picks2 = rng2.sample(pool, 3)
        names = [item["term"]] + [pick["term"] for pick in picks2]
        order2 = [0, 1, 2, 3]
        rng2.shuffle(order2)
        ordered_names = [names[i] for i in order2]
        quiz.append({
            "id": "q-" + str(len(quiz) + 1),
            "track": item["track"],
            "q": f"A colleague reports: {item['fault']} Where do you start?",
            "choices": ordered_names,
            "answer": order2.index(0),
            "explain": item["fault"] + " " + item["config"] + f" Source: {item['source']} accessed {item['accessed']}.",
            "source": item["source"],
        })
    # Keep a stable, reviewed slice above the 300 floor without shipping thousands of near-duplicates.
    selected = []
    seen = set()
    for item in quiz:
        if item["q"] in seen:
            continue
        seen.add(item["q"])
        selected.append(item)
        if len(selected) >= 680:
            break
    return selected


def build_cards(glossary: list[dict]) -> list[dict]:
    cards = []
    for item in glossary:
        cards.append({
            "track": item["track"],
            "front": item["term"],
            "back": item["plain"] + " Why it matters: " + item["why"],
        })
        if item["config"] and len(cards) < 520:
            cards.append({
                "track": item["track"],
                "front": "How do you approach " + item["term"] + "?",
                "back": item["config"] + " If it fails: " + item["fault"],
            })
    unique = []
    seen = set()
    for card in cards:
        if card["front"] in seen:
            continue
        seen.add(card["front"])
        unique.append(card)
    return unique


def parse_scenario(row: tuple) -> dict:
    sid, title, track, brief, prompt, choices, answer, debrief, source = row
    return {
        "id": sid,
        "title": title,
        "track": track,
        "brief": brief,
        "prompt": prompt,
        "choices": list(choices),
        "answer": answer,
        "debrief": debrief,
        "source": source,
    }

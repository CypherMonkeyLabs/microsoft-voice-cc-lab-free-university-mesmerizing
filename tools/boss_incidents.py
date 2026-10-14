"""Multi-step boss incidents. Syslog is synthetic. No production host is addressed."""

from __future__ import annotations


def step(prompt: str, choices: list[str], answer: int, explain: str) -> dict:
    return {"q": prompt, "choices": choices, "answer": answer, "explain": explain}


INCIDENTS = {
    "ms700": {
        "title": "London primary goes quiet after the certificate renewal",
        "brief": "Users in London hear fast busy. Manchester still places PSTN calls. The change window renewed the London certificate an hour ago. This is a study incident, not a live SBC.",
        "syslog": (
            "2026-10-14T14:02:11Z sbc-lon sip[2201]: OPTIONS from sip.pstnhub.microsoft.com:5061\n"
            "2026-10-14T14:02:11Z sbc-lon tls[2201]: handshake fail peer=sip.pstnhub.microsoft.com "
            "alert=certificate_unknown reason=hostname mismatch SAN=sbc-lon.contoso.example "
            "presented=sbc-old.contoso.example\n"
            "2026-10-14T14:02:41Z sbc-lon sip[2201]: OPTIONS miss count=3 trunk=London-Primary\n"
            "2026-10-14T14:03:02Z teams-route: gateway sbc-lon.contoso.example marked unavailable\n"
            "2026-10-14T14:03:05Z teams-route: failover candidate sbc-lon-b.contoso.example priority=2 "
            "result=not_on_route\n"
            "2026-10-14T14:06:18Z sbc-man sip[884]: OPTIONS 200 OK peer=sip2.pstnhub.microsoft.com"
        ),
        "steps": [
            step(
                "What failed first?",
                ["The dial plan stripped +44", "TLS name check. The presented name is not the paired FQDN", "CQD loss in the HQ subnet", "The resource account license"],
                1,
                "The syslog stops at the handshake. SAN sbc-lon was paired. The certificate presented sbc-old. SIP never starts.",
            ),
            step(
                "London users fail and Manchester users do not. Why is that expected?",
                ["Manchester uses a different Teams client build", "Each gateway has its own certificate and route. Manchester is still answering OPTIONS", "Media bypass is a country setting", "Islands mode only applies in London"],
                1,
                "OPTIONS 200 from sbc-man shows that trunk is up. The London pair is the broken object.",
            ),
            step(
                "The failover line says the priority-2 gateway is not on the route. What do you change?",
                ["Add the second London SBC to the voice route, then retest OPTIONS", "Buy a Calling Plan for every user", "Switch the tenant to Islands", "Disable media bypass on Manchester"],
                0,
                "A route with one gateway has nowhere to fail. Pair and list the second SBC before you call the design redundant.",
            ),
            step(
                "Which exam still covers this Teams admin work on 14 October 2026?",
                ["MB-280", "AB-210", "MS-700, which is live, with a skills update on Oct 27 2026, and is not retired", "AI-900"],
                2,
                "MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement.",
            ),
        ],
    },
    "ab250": {
        "title": "French billing lands in the English queue",
        "brief": "A Dynamics 365 Contact Center voice work item from a French caller opens on the English general queue. The SBC ladder for the same call is healthy. Capacity on French billing is zero.",
        "syslog": (
            "2026-10-14T09:14:02Z cc-routing workstream=Voice-Billing language=fr-FR intent=billing\n"
            "2026-10-14T09:14:02Z cc-routing queue=French-Billing capacity_free=0 overflow=English-General\n"
            "2026-10-14T09:14:03Z cc-routing assigned queue=English-General agent=blake\n"
            "2026-10-14T09:14:03Z sbc-lon sip: INVITE +33155550100 100/180/200 Call-ID=lab-fr-01\n"
            "2026-10-14T09:14:04Z teams-media: bypass=false processor=active codec=G.711"
        ),
        "steps": [
            step(
                "Where is the fault?",
                ["The SBC certificate", "Workstream classification is fine. French billing had no capacity, so overflow fired", "The dial plan", "DSCP was stripped"],
                1,
                "The route log names the overflow. A healthy SIP ladder means you stay in the contact-center rules.",
            ),
            step(
                "What should overflow be, if French agents are required?",
                ["A French overflow or a voicemail you can explain, not a silent English queue", "Drop the call", "Send it to the carrier as 911", "Convert the work item into a Calling Plan"],
                0,
                "Overflow is a rule a reviewer can read. Surprise language changes are the bug.",
            ),
            step(
                "Which exam matches this work?",
                ["MS-700 only", "AB-250, the Dynamics 365 Contact Center exam", "MB-280", "AB-210"],
                1,
                "AB-250 is the contact-center exam. AB-210 is the sales successor to MB-280 and is in beta.",
            ),
            step(
                "The SBC still matters on this ticket because",
                ["Unified routing replaces Direct Routing", "Voice still has a telephony path. This log shows that path succeeded", "CQD is the workstream", "Resource accounts mark DSCP"],
                1,
                "Channels are the heavy AB-250 skill. The trunk is a neighbor, and here it is not the fault.",
            ),
        ],
    },
    "mb280": {
        "title": "Change board lists MB-280 as the voice gate",
        "brief": "A cutover ticket says nobody may touch the SBC until they pass MB-280. The attachment is an SBC syslog from this morning. The exam list was checked 14 October 2026.",
        "syslog": (
            "2026-10-14T11:40:00Z change-board: gate=MB-280 required before SBC production change\n"
            "2026-10-14T11:41:12Z sbc-lon tls: certificate expires 2026-11-02 CN=sbc-lon.contoso.example\n"
            "2026-10-14T11:41:12Z sbc-lon sip: OPTIONS 200 OK count=1440\n"
            "2026-10-14T11:42:01Z catalog: MB-280 retirement=2026-07-31 successor=AB-210 status=beta\n"
            "2026-10-14T11:42:01Z catalog: MS-700 status=live skills_update=2026-10-27 replacement=none"
        ),
        "steps": [
            step(
                "What is wrong with the gate on the ticket?",
                ["MB-280 is the Teams voice exam", "MB-280 retired Jul 31 2026. It was the customer-experience exam, not the SBC exam", "MB-280 replaced MS-700 on Oct 27", "The syslog shows a name mismatch"],
                1,
                "The catalog line is the fact. The OPTIONS line shows the trunk is currently healthy. The process gate is the bug.",
            ),
            step(
                "Which exam succeeded MB-280?",
                ["AB-210, in beta. It is not a replacement for MS-700", "AB-250", "MS-220", "AI-900"],
                0,
                "MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta.",
            ),
            step(
                "Who should be allowed to change the voice route?",
                ["Anyone who once booked MB-280", "A person using the Teams admin role that can do the change, with MS-700 as the study target if they want the certification", "A sales consultant because AB-210 is in beta", "The carrier, because OPTIONS returned 200"],
                1,
                "Certification is not the change approval. MS-700 is the live Teams admin exam. There is no replacement.",
            ),
            step(
                "The certificate expiry in the log is",
                ["Proof the handshake already failed", "A date to monitor. OPTIONS are healthy today. Do not confuse a future expiry with this ticket's exam mistake", "A reason to disable the Manchester SBC", "An MB-280 skill"],
                1,
                "Read the code that is actually failing. Here the failing object is the written gate, not TLS.",
            ),
        ],
    },
    "ab210": {
        "title": "Sales pilot attached to the emergency route",
        "brief": "A sponsor wants the AB-210 sales agent to answer the main number, including after-hours callers who might be reporting an emergency. The SBC log shows the attendant pilot.",
        "syslog": (
            "2026-10-14T16:18:44Z aa-main: after-hours target=sales-agent-pilot\n"
            "2026-10-14T16:18:44Z sales-agent: topic=qualify-lead escape=none\n"
            "2026-10-14T16:19:02Z sbc-lon sip: INVITE +44999 from aa-main Call-ID=lab-em-04\n"
            "2026-10-14T16:19:02Z sbc-lon route: emergency pattern matched gateway=sbc-lon.contoso.example\n"
            "2026-10-14T16:19:03Z sales-agent: unrecognized utterance action=hangup"
        ),
        "steps": [
            step(
                "What must change before any pilot?",
                ["Point emergency and the after-hours operator at a human path that is tested. The agent does not own 999", "Replace the SBC with AB-210", "Retire MS-700", "Enable media bypass"],
                0,
                "The log shows 999 hitting a bot that hangs up on an unknown utterance. That is the incident.",
            ),
            step(
                "AB-210's job is",
                ["Teams phone administration", "Dynamics 365 sales AI consulting. It is in beta and it succeeds MB-280", "Contact center channels", "Direct Routing design"],
                1,
                "AB-210 is in beta. It is the successor to MB-280. It is not the contact-center exam and it does not replace MS-700.",
            ),
            step(
                "The contact-center exam, if the queue is the real product, is",
                ["AB-210", "AB-250", "MB-280", "AZ-900"],
                1,
                "AB-250 is Dynamics 365 Contact Center. Do not book the sales beta for that seat.",
            ),
            step(
                "A sales topic is still valid when",
                ["It is the emergency route", "The project is actually a sales conversation, with a human escape, on a number that is not the emergency pilot", "It marks DSCP 46", "It renews the certificate"],
                1,
                "Keep the sales agent on a sales number. Keep emergency on the voice route you can trace.",
            ),
        ],
    },
    "az900": {
        "title": "Region move blamed for a one-way audio ticket",
        "brief": "Platform moved a resource group. The same afternoon a branch reports one-way audio. The SBC syslog and the Azure activity log are both attached.",
        "syslog": (
            "2026-10-14T08:01:11Z activity: resourceGroup=voice-lab action=move region=uk-south result=Succeeded\n"
            "2026-10-14T08:40:22Z sbc-man media: rtp in=0 rtp out=412 codec=G.711 peer=10.30.4.15\n"
            "2026-10-14T08:40:22Z sbc-man media: acl=office-return missing udp/49152-53247 from branch\n"
            "2026-10-14T08:40:23Z teams-client: bypass=true signaling=ok\n"
            "2026-10-14T08:41:00Z azure-advisor: no PSTN calls are placed by a resource group move"
        ),
        "steps": [
            step(
                "Which log explains the silence?",
                ["The resource group move", "The branch ACL is not returning media. RTP in is zero while signaling is up", "A missing Teams Phone license", "The dial plan"],
                1,
                "One-way audio with a completed INVITE is a media path. The Azure move succeeded and does not carry RTP.",
            ),
            step(
                "What is the AZ-900-level distinction?",
                ["A resource group and a voice route are the same object", "They are different control planes. Region is a residency constraint, not a SIP response code", "Regions assign resource account licenses", "Foundry pairs SBCs"],
                1,
                "Use the shared nouns. Do not debug TLS inside a resource group.",
            ),
            step(
                "Media bypass being on means",
                ["Signaling skipped Teams", "RTP was supposed to run between the client and the SBC. The missing return ports match that path", "The call used the media processor only", "Emergency location moved"],
                1,
                "Bypass does not move SIP. It moves media. The ACL has to include that path.",
            ),
            step(
                "AZ-900 on 14 October 2026",
                ["Retired with AI-900", "Was not on the retirement list. AI-900 retired 30 June 2026", "Replaced MS-700", "Is the contact-center exam"],
                1,
                "AZ-900 was still the fundamentals exam. It is context, not the voice design exam.",
            ),
        ],
    },
    "sc900": {
        "title": "Conditional Access looks like a dead trunk",
        "brief": "A new phone at the branch never registers. The SBC OPTIONS are healthy. The sign-in log is the other attachment. SC-900's English outline was scheduled to update on 21 October 2026.",
        "syslog": (
            "2026-10-14T07:55:01Z sbc-lon sip: OPTIONS 200 OK\n"
            "2026-10-14T07:56:40Z entra signin user=kiosk04 result=failure "
            "error=53003 ConditionalAccess blocked client=TeamsPhone ip=10.30.4.40\n"
            "2026-10-14T07:56:41Z teams-phone: registration=failed reason=signin\n"
            "2026-10-14T07:57:02Z ca-policy: name=Block-legacy-and-untrusted grant=untrusted-location\n"
            "2026-10-14T07:58:18Z audit: no Set-CsOnlinePSTNGateway in the last 24h"
        ),
        "steps": [
            step(
                "What is down?",
                ["The SBC trunk", "The phone cannot sign in. Conditional Access blocked the branch address", "The certificate SAN", "The voice route regex"],
                1,
                "OPTIONS 200 and an empty gateway audit say the trunk did not change. Error 53003 is the sign-in.",
            ),
            step(
                "The durable fix is",
                ["Disable all Conditional Access", "Name the branch as a trusted location, or exclude the device on purpose, and write down the exception", "Grant Global Administrator to the kiosk account", "Turn off OPTIONS"],
                1,
                "Least privilege still applies. An exception you cannot explain becomes the next outage.",
            ),
            step(
                "Recording's trust boundary, if this kiosk must be recorded, is",
                ["Teams stores the legal archive", "The partner recorder stores the media. Notification is required", "CQD stores the audio", "The dial plan stores the audio"],
                1,
                "SC-900 is the vocabulary for that boundary. The partner still owns retention.",
            ),
            step(
                "SC-900 and MS-700 dates",
                ["Both are retirements", "SC-900 English update 21 October 2026. MS-700 skills update 27 October 2026. Neither date is a retirement", "SC-900 replaced MS-700", "MB-280 is the identity exam"],
                1,
                "Read both pages again before you book. A skills update is not a retirement.",
            ),
        ],
    },
}

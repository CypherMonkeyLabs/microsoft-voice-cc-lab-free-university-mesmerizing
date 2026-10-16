"""Pro tips, interview traps, and a cheat sheet for each track."""

from __future__ import annotations

TIPS: dict[str, dict[str, object]] = {
    "t01": {
        "tips": [
            "Confirm the tenant, the verified domain, and the admin role before you touch a voice route.",
            "A resource account is disabled for interactive sign-in. It still needs the license the voice app requires.",
            "Calling Plan, Operator Connect, Teams Phone Mobile, and Direct Routing can live in one tenant. They are not the same purchase.",
        ],
        "traps": [
            "Treating a guest, or an admin in the wrong tenant, as if they can grant a voice routing policy.",
            "Opening an SBC ticket when the domain is unverified and the user has no Teams Phone license.",
        ],
        "sheet": (
            "Tenant boundary\n"
            "  Identity   Entra ID user, room, or resource account\n"
            "  Domain     verified before phone numbers\n"
            "  Role       Teams administrator, named\n"
            "  Order      identity, license, policy, then dial tone"
        ),
    },
    "t02": {
        "tips": [
            "Teams Phone lets a user be an enterprise voice user. A Calling Plan is Microsoft acting as the carrier, bought separately.",
            "An auto attendant or call queue resource account usually needs a free virtual-user license, not a Calling Plan, unless that app places outbound calls.",
            "Teams Premium does not include Teams Phone or a phone number.",
        ],
        "traps": [
            "Buying a Calling Plan and expecting Direct Routing to start working.",
            "Licensing every resource account with a Calling Plan because the queue has a phone number.",
        ],
        "sheet": (
            "Teams Phone      user can be enterprise voice\n"
            "Calling Plan     Microsoft is the PSTN carrier\n"
            "Operator Connect carrier operates, you assign\n"
            "Phone Mobile     mobile operator\n"
            "Direct Routing   you operate the SBC\n"
            "Resource account its own license, not the agent's\n"
            "Teams Premium    not a phone system"
        ),
    },
    "t03": {
        "tips": [
            "Read with Get- before you Set- or Grant-.",
            "Set-CsTeamsCallingPolicy changes the policy object. Grant-CsTeamsCallingPolicy assigns that policy to a user.",
            "New-CsOnlineVoiceRoute needs a number pattern, an online PSTN gateway, and a PSTN usage, or the route never matches.",
        ],
        "traps": [
            "Running Set-CsTeamsCallingPolicy against a user principal name and thinking the user changed.",
            "Pasting parameters from a screenshot without checking Get-Help in the module installed on that machine.",
        ],
        "sheet": (
            "Get-     read\n"
            "New-     create\n"
            "Set-     change the object\n"
            "Grant-   assign to a user\n"
            "Remove-  delete\n"
            "Voice route     pattern + gateway + usage\n"
            "Calling policy  the object. Grant assigns it."
        ),
    },
    "t04": {
        "tips": [
            "Mark audio EF / DSCP 46, video AF41 / 34, app sharing AF21 / 18, and signaling CS5 / 40. The mark has to survive the trust boundary.",
            "A short path and enough bandwidth beat a clever queue. A VPN is not a media design.",
            "G.711 at 20 ms is about 80 kbit/s at layer 3, and about 87.2 kbit/s with an 18-byte Ethernet header.",
        ],
        "traps": [
            "Marking DSCP only on the PC and assuming the WAN still honors it.",
            "Treating media bypass as a bandwidth feature. Bypass changes where RTP goes, not the codec math.",
        ],
        "sheet": (
            "Audio      DSCP 46  EF\n"
            "Video      DSCP 34  AF41\n"
            "Sharing    DSCP 18  AF21\n"
            "Signaling  DSCP 40  CS5\n"
            "Confirm the current port ranges on the network article you operate.\n"
            "VPN pools are a bad place for real-time media."
        ),
    },
    "t05": {
        "tips": [
            "One user places a call with one connectivity option. The tenant may mix Calling Plan, Operator Connect, Teams Phone Mobile, and Direct Routing.",
            "Direct Routing signaling uses TLS to the Teams SIP proxies on TCP 5061. The SBC FQDN must be in the certificate SAN.",
            "Media bypass can send RTP between the client and the SBC. Signaling stays with Teams.",
        ],
        "traps": [
            "Using an onmicrosoft.com name, or a sip.pstnhub name, as the SBC FQDN.",
            "Debugging the dial plan when OPTIONS to the trunk are already failing.",
        ],
        "sheet": (
            "Proxies   sip, sip2, sip3 .pstnhub.microsoft.com\n"
            "Signaling TLS 5061\n"
            "OPTIONS   200 OK or the trunk leaves the route\n"
            "INVITE    after a voice route picks a gateway\n"
            "Bypass    RTP may skip the media processor\n"
            "Signaling does not bypass"
        ),
    },
    "t06": {
        "tips": [
            "Normalization is first match. A later rule does not repair a number an earlier rule already rewrote.",
            "A voice routing policy is an ordered list of PSTN usages. The first usage that contains a matching route wins.",
            "Direct Routing needs the user in TeamsOnly. Islands mode does not send that user's PSTN calls through Teams.",
        ],
        "traps": [
            "Debugging the gateway when the dialed string never became E.164.",
            "Creating a route and forgetting to put its PSTN usage on the user's policy, in the right order.",
        ],
        "sheet": (
            "Dialed string\n"
            "  -> tenant dial plan, first matching rule\n"
            "  -> E.164\n"
            "  -> voice routing policy usages, in order\n"
            "  -> first voice route regex that matches\n"
            "  -> online PSTN gateway list\n"
            "Islands mode does not place Direct Routing calls."
        ),
    },
    "t07": {
        "tips": [
            "Assign the phone number to the resource account, and assign the resource account to the auto attendant or call queue.",
            "Overflow and timeout need a destination you have already built. A queue that overflows to itself loops.",
            "Attendant routing, serial, round robin, and conference mode are different. Name the one you configured.",
        ],
        "traps": [
            "Licensing the agents and forgetting the resource account.",
            "Pointing a menu key at a queue that does not exist yet.",
        ],
        "sheet": (
            "Resource account -> license -> voice app -> number\n"
            "Attendant: hours, holidays, menu\n"
            "Menu key -> person, queue, or another attendant\n"
            "Queue: agents, presence, method, overflow, timeout\n"
            "Outbound from the app needs its own calling funding"
        ),
    },
    "t08": {
        "tips": [
            "Dynamic emergency calling walks trusted IP, network site, subnet, and civic address. A VPN pool is often not a dispatchable location.",
            "On Direct Routing you choose whether the SBC or Microsoft routes the emergency call. Say which hop you configured.",
            "A Survivable Branch Appliance keeps a limited set of calls up when the path to Microsoft 365 fails. It does not replace the SBC.",
        ],
        "traps": [
            "Placing a real emergency call to test a lab. Use the matcher and a test policy.",
            "Treating location-based routing and emergency location as the same feature. They share sites and do different jobs.",
        ],
        "sheet": (
            "Trusted IP -> site -> subnet -> civic address\n"
            "Emergency route: Microsoft or your SBC, on purpose\n"
            "LBR: selected PSTN stays on the local gateway\n"
            "SBA: some branch calling during a WAN loss\n"
            "SBA scope is smaller than normal Teams Phone"
        ),
    },
    "t09": {
        "tips": [
            "Media bypass is a media path. SIP signaling still goes to Teams.",
            "A meeting room has its own license. It does not inherit a person's Calling Plan.",
            "SIP Gateway registers compatible phones to Teams. It is not Direct Routing and it is not your SBC.",
        ],
        "traps": [
            "Enabling media bypass and expecting AMR-WB. AMR-WB is not negotiated on the bypass path.",
            "Parking a room account on a personal policy with no device account of its own.",
        ],
        "sheet": (
            "Processor path   client -> Teams media -> SBC\n"
            "Bypass path      client -> SBC on the same site\n"
            "Signaling        always via Teams\n"
            "AMR-WB           not on bypass\n"
            "SIP Gateway      phone registration, not a trunk\n"
            "Room             its own account and SKU"
        ),
    },
    "t10": {
        "tips": [
            "Certification means that SBC software is supported with Direct Routing. You still configure the vendor release you run.",
            "AudioCodes, Ribbon, Oracle, and Cisco CUBE are families. The support path starts with that vendor's guide.",
            "Failover is a second gateway on the voice route that you have rehearsed, not a hostname you hope is warm.",
        ],
        "traps": [
            "Opening a Microsoft case for a firmware or DSP fault the vendor owns.",
            "Cloning the London trunk to Manchester and leaving the certificate name or the OPTIONS target unchanged.",
        ],
        "sheet": (
            "Certified list -> the release you actually run\n"
            "Pair           primary and secondary, both on the route\n"
            "Firewall       current Teams ranges, both directions\n"
            "Rehearse       fail the primary before the site depends on it\n"
            "Vendor first   when the symptom is on the SBC itself"
        ),
    },
    "t11": {
        "tips": [
            "Use TLS 1.2 or higher, a public CA, and a SAN that matches the SBC FQDN. A name mismatch stops the handshake before INVITE.",
            "OPTIONS from the Teams proxies should receive 200 OK. Missed OPTIONS take the trunk out of service.",
            "AMR-WB is not offered when media bypass is on. The rest of the codec list is a negotiation, not a wish.",
        ],
        "traps": [
            "Arguing about the dial plan while the certificate is still issued to the old hostname.",
            "Trusting a private CA for Direct Routing. The trunk wants a public certificate.",
        ],
        "sheet": (
            "ClientHello -> certificate -> SAN matches FQDN -> Finished\n"
            "OPTIONS -> 200 OK\n"
            "INVITE / 100 / 180 / 200 / ACK\n"
            "RTP follows the SDP: processor or bypass\n"
            "TCP 5061, not 5060"
        ),
    },
    "t12": {
        "tips": [
            "One call belongs in Call Analytics. A building or a week of calls belongs in the Call Quality Dashboard. The trunk belongs in OPTIONS and the SBC trace.",
            "Write the hypothesis before you change a dial plan. A certificate miss and a bad normalization rule leave different evidence.",
            "A CQD average is not that one user's call. Do not quote it as if it were.",
        ],
        "traps": [
            "Opening the SBC trace first when Call Analytics already shows the client on a failing Wi-Fi hop.",
            "Calling both Call Analytics and CQD 'the call log.'",
        ],
        "sheet": (
            "One user, one call  -> Call Analytics\n"
            "Many calls, one site -> CQD\n"
            "Trunk up?           -> SIP OPTIONS\n"
            "Ladder wrong?       -> SBC syslog\n"
            "Then change one thing and look again"
        ),
    },
    "t13": {
        "tips": [
            "Dynamics 365 Contact Center is the CCaaS product. AB-250 is the exam that matches it.",
            "AB-210 is the sales successor to MB-280 and is in beta. It does not replace MS-700, and it is not the contact-center exam.",
            "Unified routing uses workstreams, queues, and capacity. A Teams call queue is a different product.",
        ],
        "traps": [
            "Studying AB-210 because the title says AI when the job is the contact center.",
            "Describing a Teams call queue as unified routing.",
        ],
        "sheet": (
            "AB-250 contact center, published ranges\n"
            "  Deploy            15–20%\n"
            "  Channels          30–35%\n"
            "  Agents and AI     10–15%\n"
            "  Work distribution 10–15%\n"
            "  Rep experience    15–20%\n"
            "  Analytics         10–15%\n"
            "Workstream -> queue -> capacity -> representative"
        ),
    },
    "t14": {
        "tips": [
            "Connect, Extend, and Unify are different media paths. Name the model before you name the product.",
            "CUCM to Teams through Direct Routing is a certified SBC, often CUBE, with one owner for normalization.",
            "Webex, UCCE, Genesys, and Amazon Connect each need a named bridge. 'We integrate' is not a design.",
        ],
        "traps": [
            "Mapping a CUCM calling search space onto a Teams dial plan as if the objects were the same.",
            "Letting both CUCM and Teams rewrite the same number.",
        ],
        "sheet": (
            "Connect  SBC between the PBX and Teams\n"
            "Extend   Graph and the client; media stays put\n"
            "Unify    ACS-native contact-center path\n"
            "CUCM     partition, CSS, route pattern\n"
            "Teams    dial plan, usage, route, gateway\n"
            "One system owns normalization"
        ),
    },
    "t15": {
        "tips": [
            "Call Automation is a server-side call: answer, play, recognize, transfer, hang up. Recognize can be DTMF or speech.",
            "Copilot Studio can sit in the recognize step. A transfer to a person is part of the design.",
            "Foundry is where you evaluate a model. It is not a second phone system.",
        ],
        "traps": [
            "Shipping a bot with no human escape and calling it a contact center.",
            "Assuming speech recognition sees media on a path you never forked.",
        ],
        "sheet": (
            "Answer -> Play -> Recognize -> Transfer or Hang up\n"
            "Recognize   DTMF or speech\n"
            "Escape      a queue or a person, on every flow\n"
            "ACS events  are the call\n"
            "Teams policy is not the bot runtime"
        ),
    },
    "t16": {
        "tips": [
            "MS-700 is still live, with a skills update on Oct 27 2026. It is not retired and it has no replacement.",
            "MB-280 retired Jul 31 2026. AB-210 is its successor and is in beta. AB-210 is the sales exam. It does not replace MS-700.",
            "AB-250 is the contact-center exam. AZ-900 and SC-900 are live. The SC-900 English update is 21 Oct 2026. MS-900 and AI-900 are retired. Renewal is not retirement.",
        ],
        "traps": [
            "Telling a candidate that AB-210 replaces MS-700.",
            "Booking a retired exam because a blog still lists it as current.",
        ],
        "sheet": (
            "MS-700   live; skills update Oct 27 2026; no replacement\n"
            "AB-250   contact center\n"
            "AB-210   in beta; successor to MB-280; sales\n"
            "MB-280   retired Jul 31 2026\n"
            "AZ-900   live\n"
            "SC-900   live; English update 21 Oct 2026\n"
            "MS-900   retired\n"
            "AI-900   retired\n"
            "Renewal is not retirement"
        ),
    },
    "t17": {
        "tips": [
            "Compliance recording is a certified recorder, an application instance, an enabled policy, and a grant. The partner stores the media.",
            "Join the logs on an identifier you can name: call id, user, queue, and the recorder's own reference.",
            "The Erlang C calculator in this campus is a teaching model. It is not a workforce-management product.",
        ],
        "traps": [
            "Expecting a Teams call queue to forecast, score adherence, and run quality management.",
            "Enabling recording without a notice and without granting the policy to the right users.",
        ],
        "sheet": (
            "Recording   certified bot, policy, grant, notice\n"
            "WFM         queue intervals; not a Teams feature\n"
            "E911        location, then the carrier route\n"
            "Analytics   CQD, then a model you own, then Power BI\n"
            "CRM         screen pop on an id you store\n"
            "Agent       answer, then a human escape"
        ),
    },
    "t18": {
        "tips": [
            "The Dynamics voice channel page says the channel is built on Azure Communication Services. The representative notification it describes is the Copilot Service workspace, not the Teams client.",
            "The Salesforce help page that opened says Salesforce Voice with Telephony Providers, formerly Service Cloud Voice, is now part of Partner Contact Center.",
        ],
        "traps": [
            "Treating a Teams resource account as proof that the representative answers in the Teams client.",
            "Using a remembered application ID. The Teams Phone page prints one. Copy it from the current page.",
        ],
        "sheet": (
            "CTI          telephone coordinated with a computer\n"
            "Dynamics     ACS voice channel, unified routing\n"
            "Teams number resource account, then Sync from Teams\n"
            "Calling Plan service numbers only, on that page\n"
            "Salesforce   Voice, formerly Service Cloud Voice\n"
            "Record       the id you store, not a matching name"
        ),
    },
    "t19": {
        "tips": [
            "Quote the product name the opened page uses. Amazon’s guide says Amazon Connect Customer is the current name of the product previously called Amazon Connect.",
            "Google’s legal change log records a rename to Gemini Enterprise for Customer Experience. The CCAI Platform docs page opened for this track still uses Contact Center AI Platform.",
        ],
        "traps": [
            "Ranking vendors, or copying a price, a market share, or a certification list this track did not open.",
            "Saying the CCAI Platform docs page was renamed away because a change-log line exists.",
        ],
        "sheet": (
            "Microsoft    voice channel, plus Connect Extend Unify\n"
            "Amazon       Connect Customer, this guide\n"
            "Google docs  Contact Center AI Platform\n"
            "Change log   GECX rename is a separate page\n"
            "No rank      equal bars mean pages opened"
        ),
    },
    "t20": {
        "tips": [
            "Unified routing has two stages on its overview page: classification, then assignment. A voice workstream is push mode only.",
            "A short-term forecast on the forecasting overview is 15-minute intervals for a horizon of up to six weeks (42 days). A long-term forecast is daily, up to three years (1,096 days).",
        ],
        "traps": [
            "Using a quality score or a forecast for employment decisions. Both pages say not to.",
            "Treating the Dynamics recording announcement and a Teams compliance-recording policy as one switch.",
        ],
        "sheet": (
            "Classify    rules and ML models add information\n"
            "Assign      highest capacity, round robin, least active\n"
            "Voice queue least active is the default on that page\n"
            "Forecast    volume and AHT, then capacity, then shifts\n"
            "Quality     indicators score, guardrails do not\n"
            "Not for     compensation, seniority, or rewards"
        ),
    },
}

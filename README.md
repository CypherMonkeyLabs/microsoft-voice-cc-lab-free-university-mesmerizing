# Microsoft Voice & Contact Center Lab

![Microsoft Voice and Contact Center Lab](campus/og-card.png)

A free, offline campus for a voice engineer preparing for Teams Phone and Microsoft contact-center work. One HTML file. No account, no API key, and no CDN. Open it, and it keeps working with the network off.

**Description.** Free offline campus for Teams voice and Microsoft contact-center study: labs, a fault catalog, and cited notes in one HTML file.

**Topics.** `microsoft-teams` `teams-phone` `direct-routing` `contact-center` `dynamics-365` `microsoft-365` `voice` `offline` `education` `study-guide`

Checked **14 October 2026**. This is not a Microsoft, Cisco, AudioCodes, Ribbon, Oracle, Genesys, or Amazon publication. When a vendor page and this file disagree, the vendor page wins. Certification seats move. Read the exam page again before you book.

## Open it

GitHub Pages serves the `campus` folder. Locally:

```bash
python3 -m http.server 8741
```

Then open [http://127.0.0.1:8741/campus/](http://127.0.0.1:8741/campus/). You can also open `campus/index.html` as a file. Search is Ctrl+K or `/`. `[` and `]` move between lessons in a track. Theme cycles dark, light, and high contrast. Listen uses a voice already installed in the browser and does not upload anything.

A zip of the HTML, the social card, and the audio folder is in `releases/microsoft-voice-contact-center-lab.zip`. Unzip it and open the HTML file. The clips live in `audio/` next to that file.

Progress, theme, lab runs, and exam self-ratings stay in `localStorage` under `mvcc-lab-v1`. The file does not ask for a name.

## What is inside

| | |
|---|---|
| Tracks | 17, each with why it matters and what it depends on |
| Lessons | 110, each with three animated flows, at least three diagrams, and a Try it link |
| Illustrations | 1,540 distinct inline SVGs |
| Animated flows | 330 |
| Charts | 22, including licensing, CQD, Erlang C, and the certification and feature timelines |
| Labs | 25, all runnable with no key |
| Quiz | 644 questions, each with an explanation and a source |
| Boss exams | 6: MS-700, AB-250, MB-280, AB-210, AZ-900, SC-900 |
| Flashcards | 607 |
| Scenarios | 24 |
| Glossary | 347 terms, with a config note and a fault |
| Fault catalog | 36 rows: symptom, cause, fix, check, source |
| Audio | 32 offline clips beside the HTML (DTMF, call progress, attendant samples, short intros) |
| Sources | 52, dated 14 October 2026 |

Rebuild the file from the sources, then check the counts:

```bash
python3 tools/build_campus.py
python3 tools/make_og.py
python3 scripts/verify_campus.py
```

## Study order

1. Foundations, licensing, PowerShell, and the network.
2. PSTN connectivity, dial plans, voice routing, attendants, and queues.
3. Emergency calling, devices, SBCs, TLS, and troubleshooting.
4. Dynamics 365 Contact Center, coexistence, ACS, Speech, and Copilot Studio.
5. The exam status board, then the ecosystem track.

If you have one hour: the tenant boundary, Direct Routing, the normalization tester, the voice-routing matcher, and the ecosystem mind map.

## Ecosystem track

Track 17 is the systems around the call, not another Teams policy.

- Glossary, with config and the fault you see when the term is wrong.
- Mind map of Entra ID, Teams Phone, the SBC, the carrier, recording, WFM, emergency location, Dynamics, ACS, Copilot Studio, CQD and Power BI, and CRM.
- Sister technologies: workforce management, compliance recording and quality management (including Teams compliance recording), E911, analytics and Power BI, CRM and screen pop, and AI agents with a human escape.
- Integration maps, cross-platform bridges (CUCM, Webex, UCCE, Genesys, Amazon Connect), and future-integration hooks that use products that exist today.

Labs on that track: Erlang C (labeled as a teaching model), the compliance-recording builder, the integration map, and the hook planner.

## Labs

Direct Routing call path, voice-routing matcher, dial-plan tester, auto attendant and queue builder, SBC checklist, TLS handshake, CQD fault cases, licensing picker, CUCM-to-Teams translator, unified-routing designer, ACS call automation, Erlang C, exam readiness, QoS marker, emergency location, SIP OPTIONS, media bypass, coexistence, usage builder, codec bandwidth, IVR escape, Survivable Branch Appliance, compliance recording, integration map, and future hooks.

Numbers in the labs are samples (`555`, `contoso.example`). Do not place a real emergency call to test a lab.

## Exams named on the status board

MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta.

AB-250 is the Dynamics 365 Contact Center exam; confirm the live seat. AZ-900 and SC-900 are live (SC-900 English update 21 October 2026). MS-900 and AI-900 are retired. Renewal is not retirement. AB-210 is not the contact-center exam and it is not a replacement for MS-700.

## Sister projects

- [UC Lab](https://github.com/cipher0x9/uc-lab-free-university-mesmerizing)
- [AI Lab](https://github.com/cipher0x9/ai-lab-free-university-mesmerizing)
- Design reference: [Gemini Gems gallery](https://cipher0x9.github.io/gemini-gems-free-gallery/site/)

## License

MIT. Copyright (c) 2026 Microsoft Voice & Contact Center Lab. See `LICENSE`.

## Screenshots

Home, with the call path and the seventeen tracks:

![Home](docs/assets/home.png)

Direct Routing call path, after a run:

![Direct Routing lab](docs/assets/lab-direct-routing.png)

Dial-plan normalization, first match wins:

![Dial plan lab](docs/assets/lab-dial-plan.png)

Erlang C, labeled as a teaching model:

![Erlang C lab](docs/assets/lab-erlang.png)

A lesson, with the flow and the chart:

![Direct Routing lesson](docs/assets/lesson-direct-routing.png)

Ecosystem mind map:

![Mind map](docs/assets/ecosystem-map.png)

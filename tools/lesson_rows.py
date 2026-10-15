"""Lesson rows. Each block is one lesson."""

from __future__ import annotations

LESSON_ROWS: list[tuple] = []


def _parse(text: str) -> None:
    blocks = [block.strip() for block in text.split("\n---\n") if block.strip()]
    for block in blocks:
        fields: dict[str, str] = {}
        key = None
        buf: list[str] = []
        for line in block.splitlines():
            if line.startswith("@") and " " not in line[1:]:
                if key:
                    fields[key] = " ".join(part.strip() for part in buf).strip()
                key = line[1:].strip()
                buf = []
            else:
                buf.append(line)
        if key:
            fields[key] = " ".join(part.strip() for part in buf).strip()
        LESSON_ROWS.append(
            (
                fields["id"],
                fields["track"],
                fields["title"],
                int(fields["minutes"]),
                fields["why"],
                fields["depends"],
                fields["p1"],
                fields["p2"],
                fields["flow"],
                fields["chart"],
                fields["note"],
                fields["bars"],
                fields.get("lab", ""),
                fields["say"],
                fields["fault"],
                fields["listen"],
                fields["sources"],
            )
        )


_parse(r'''
---
@id
t01-tenant
@track
t01
@title
The tenant boundary
@minutes
8
@why
Every later object, from a dial plan to a recorder, lives in one tenant. Pairing an SBC in the wrong tenant is a different phone system.
@depends
A directory you can name; a domain you verified
@p1
A Microsoft 365 tenant holds Entra ID, the license pool, Teams policies, and the verified domains. Direct Routing will only pair an SBC FQDN that belongs to one of those verified domains. The default onmicrosoft.com domain is not eligible.
@p2
Before you discuss codecs, say which tenant you are in and whether the users are homed online. Direct Routing is not supported in Islands mode. Those two checks end more outages than a firmware upgrade.
@flow
Tenant|Verified domains;Entra|Users and resource accounts;Policy|Voice routing later;SBC|FQDN in that domain
@chart
What must exist first
@note
Sequence, not a count of customers.
@bars
Domain|1|Verified;Users|2|Homed online;Mode|3|Not Islands;FQDN|4|Paired
@lab

@say
Name the tenant, the verified domain, and that onmicrosoft.com cannot be the SBC name.
@fault
Pairing fails because the FQDN’s domain was never added to this tenant.
@listen
The tenant is the boundary. Pair an SBC only on a verified domain, and do not use Direct Routing for Islands users.
@sources
dr,roles
---
@id
t01-entra
@track
t01
@title
Entra ID accounts voice will use
@minutes
8
@why
Licenses and policies attach to Entra objects. A queue that nobody can find in the directory cannot be licensed.
@depends
The tenant boundary
@p1
Humans, rooms, and resource accounts are Entra objects. Resource accounts are disabled for sign-in on purpose. They represent an auto attendant or a call queue. They are not a shared mailbox someone should open in Outlook as their daily driver.
@p2
Create the object, license it, then grant voice policy. Creating a resource account takes a Teams administrator role and the User Administrator role. Skipping the second role looks like a Teams bug and is an identity-permission miss.
@flow
Create|Entra object;License|SKU;Grant|Policy;Test|Sign-in only if human
@chart
Account types
@note
Teaching categories, not a headcount.
@bars
User|3|Signs in;Room|2|Device account;Resource|1|No sign-in
@lab

@say
Resource accounts do not sign in. Humans and rooms do.
@fault
An admin tries to sign in as the queue and treats the blocked login as an outage.
@listen
Resource accounts are Entra objects that must not sign in. License them after you create them with both admin roles.
@sources
ra,roles
---
@id
t01-roles
@track
t01
@title
Roles that can change voice
@minutes
7
@why
Global Administrator is not a voice habit. The role you use decides what an audit can prove later.
@depends
Entra ID
@p1
Teams Administrator, Teams Telephony Administrator, and Teams Communications Administrator cover different slices of calling and meetings. Support Engineer and Support Specialist are troubleshooting roles, useful for Call Analytics, and the wrong tool for building a dial plan.
@p2
Use the smallest role that can do the change. Keep named accounts. Conditional Access belongs on those admin accounts. A sticky note that holds both the SBC password and a global admin password is the incident, not the recovery.
@flow
Need|The change;Role|Smallest fit;Account|Named human;Access|Conditional Access
@chart
Privilege direction
@note
Narrower as you go right. Not a permission matrix export.
@bars
Global|4|Avoid daily;Teams admin|3|Broad;Telephony|2|Voice;Support|1|Read and troubleshoot
@lab

@say
I will use a telephony or Teams admin role, not a shared global admin.
@fault
Nobody can tell who changed the voice route because the account was shared.
@listen
Use a named Teams or telephony admin. Keep Global Administrator off the daily voice work.
@sources
roles,sc900
---
@id
t01-center
@track
t01
@title
The admin-center map
@minutes
7
@why
Voice objects are split across the Teams admin center, the Microsoft 365 admin center, and PowerShell. Hunting in one pane wastes the outage.
@depends
Roles
@p1
Numbers, voice routing, attendants, and queues are Teams admin center work, with PowerShell beside them. Licenses, including the Teams Phone Resource Account license, are assigned in the Microsoft 365 admin center. Emergency addresses and network topology sit with the voice configuration, not with a random SharePoint site.
@p2
When the portal and the shell disagree, read the user with Get-CsOnlineUser. The effective policy is the one that was actually granted, including grants that came from a group.
@flow
M365 admin|Licenses;Teams admin|Voice;Shell|Effective policy;User|The test call
@chart
Where to click
@note
Places, not a ranking of vendors.
@bars
License|1|Microsoft 365 admin;Voice|2|Teams admin;Truth|3|PowerShell read
@lab

@say
Licenses in one center, voice objects in the other, effective policy from the shell.
@fault
The portal toast says success and the user still has the old policy.
@listen
Assign licenses in the Microsoft 365 admin center. Read the effective voice policy from PowerShell before you celebrate.
@sources
phone,roles
---
@id
t01-vm
@track
t01
@title
Exchange and Cloud Voicemail
@minutes
7
@why
Voicemail is an Exchange dependency. A clean SBC trace can still mean a lost message.
@depends
A mailbox
@p1
Cloud Voicemail deposits the message in the user’s Exchange mailbox. No mailbox, no deposit. Overflow from a queue to voicemail fails the same way if the account that should receive the message has nowhere to put it.
@p2
Debug voicemail only after the call has actually reached the voicemail path. If the ladder dies at the carrier, the mailbox is innocent. If the ladder ends cleanly and the message is missing, the mailbox and the voicemail policy are the next read.
@flow
Call|Reaches voicemail;Service|Cloud Voicemail;Mailbox|Exchange;User|Plays the message
@chart
Where the message lives
@note
Dependency chain.
@bars
Call|1|Answered by voicemail;Deposit|2|Exchange;Client|3|Teams or Outlook
@lab

@say
Cloud Voicemail needs a mailbox. The SBC cannot store the message for you.
@fault
Callers finish the greeting and the user never sees a message.
@listen
Teams voicemail is Cloud Voicemail into Exchange. Check the mailbox when the call itself succeeded.
@sources
vm
---
@id
t01-homed
@track
t01
@title
What homed online means
@minutes
6
@why
A license on a user who is still homed on a legacy registrar will not produce Direct Routing calls.
@depends
The tenant; Entra ID
@p1
Direct Routing expects the user to be homed in Microsoft 365. Islands mode is explicitly unsupported for Direct Routing. Those are registrar and coexistence facts, not SBC opinions.
@p2
Read the user before you assign a voice routing policy. If the pilot group is a mix of online users and leftover coexistence modes, you will debug one trunk twice and learn nothing.
@flow
Read user|Registrar and mode;Fix mode|Leave Islands;Assign|Voice policy;Call|One test number
@chart
Gates before PSTN
@note
Both gates are required.
@bars
Online|1|Homed in Microsoft 365;Mode|1|Not Islands;Policy|1|Granted
@lab

@say
Direct Routing users are homed online, and they are not in Islands mode.
@fault
Half the pilot works. The other half is still in a coexistence mode the plan page excludes.
@listen
Check that the user is homed online and not in Islands mode before you touch the SBC.
@sources
dr
---
@id
t02-stack
@track
t02
@title
The license stack
@minutes
8
@why
The wrong SKU looks like a routing bug and survives every SBC reboot.
@depends
A user object
@p1
A person who places or receives PSTN calls needs Teams and Teams Phone, unless a bundle already includes that capability. Confirm the bundle on the licensing page, because names move. A Calling Plan, Operator Connect, Teams Phone Mobile, or Direct Routing is the connectivity choice on top.
@p2
Microsoft 365 E5 has historically included the phone-system capability and still requires a separate Calling Plan when Microsoft is the carrier. Do not promise PSTN from memory of a bundle.
@flow
Teams|Client;Teams Phone|Phone system;Connectivity|One of four;Test|Inbound and outbound
@chart
Stack height
@note
Required layers for a PSTN user. Not a price.
@bars
Teams|1|Base;Teams Phone|2|System;PSTN option|3|Carrier path
@lab
license-pick
@say
Teams Phone is not a carrier. Name the connectivity option separately.
@fault
Outbound fails and the user has Teams only.
@listen
Assign Teams Phone, then a connectivity option. A Calling Plan is extra even when the phone system came with a suite.
@sources
lic,phone,calling
---
@id
t02-plans
@track
t02
@title
Calling Plan flavors
@minutes
7
@why
Domestic, international, and pay-as-you-go are different purchases. The country list is part of the product.
@depends
Teams Phone
@p1
Calling Plans make Microsoft the carrier. You pick a flavor that matches how the user dials, and you can only buy it where Microsoft sells it. Pay-as-you-go is also the funding pattern, with communications credits, for some voice-app outbound calls.
@p2
A user in a country without Calling Plans needs Operator Connect, Teams Phone Mobile, or Direct Routing. Assigning a SKU that cannot be used is not a routing problem. It is a catalog problem.
@flow
Country|Is the plan sold;Flavor|Domestic or more;Assign|The user;Fund|Credits if the app calls out
@chart
Who operates the PSTN
@note
Calling Plans are the Microsoft-operated end of the scale.
@bars
Domestic|1|In-country;International|2|Broader;Pay as you go|2|Usage
@lab
license-pick
@say
Calling Plans are Microsoft as the carrier, sold only in some countries, in three usual flavors.
@fault
A SKU is assigned in a country where that plan is not offered.
@listen
Domestic, international, and pay-as-you-go are different Calling Plans. Check the country list before you assign one.
@sources
calling,pstn
---
@id
t02-premium
@track
t02
@title
Teams Premium is not PSTN
@minutes
5
@why
Premium is a meeting add-on. Treating it as the phone license produces a design that cannot dial.
@depends
The license stack
@p1
Teams Premium adds meeting and related features. It does not replace Teams Phone, a Calling Plan, Audio Conferencing, or a resource-account license. If a proposal removes Calling Plans because Premium was purchased, the proposal is wrong.
@p2
Say that out loud in the interview. Then go back to the connectivity option the users actually need.
@flow
Need|PSTN or meetings;Premium|Meetings only;Phone|Separate;Carrier|Separate again
@chart
What Premium does not include
@note
Each bar is a license Premium does not replace.
@bars
Teams Phone|1|Still required;Calling Plan|1|Still separate;Audio Conferencing|1|Still separate
@lab
license-pick
@say
Teams Premium does not include a phone system or a carrier.
@fault
Calling Plans are removed from an order because Premium was added.
@listen
Teams Premium is not a PSTN license. Keep Teams Phone and the connectivity option.
@sources
addon,lic
---
@id
t02-resource
@track
t02
@title
Resource account licenses
@minutes
8
@why
Attendants and queues fail closed when the resource account has the wrong SKU, or had the right SKU removed in two steps.
@depends
Resource accounts; Teams Phone in the tenant
@p1
Each auto attendant or call queue that answers needs a resource account with a Microsoft Teams Phone Resource Account license, even when you do not assign a phone number. Tenants with Teams Phone get a zero-cost allotment, and you still have to acquire those licenses.
@p2
Do not assign Teams Phone Standard to a resource account. If you must swap, remove the old license and add the resource-account license in the same license change. A two-step swap can leave the voice app broken. External transfer, callback, and on-behalf outbound also need pay-as-you-go or communications credits.
@flow
Acquire|Zero-cost still acquired;Assign|Resource account SKU;Avoid|Teams Phone Standard;Fund|If it dials out
@chart
Voice-app license gates
@note
Required checks.
@bars
Resource SKU|1|Required;Not Standard|1|Do not assign;Outbound fund|1|If it dials out
@lab
aa-cq
@say
Resource accounts get the Teams Phone Resource Account license, not Teams Phone Standard.
@fault
Queues die after Standard is removed and the new license is added in a second save.
@listen
Use the Teams Phone Resource Account license. Swap licenses in one change, and fund outbound if the app dials the PSTN.
@sources
vra,prereq,ra
---
@id
t02-rooms
@track
t02
@title
Rooms, common area, and shared calling
@minutes
7
@why
Devices and shared numbers have their own license sentences. Copying a user bundle onto a hallway phone wastes money and still may not work.
@depends
The license stack
@p1
A common-area phone on Direct Routing does not need a Calling Plan. Teams Rooms use the current room SKU, not a borrowed user license. Shared Calling lets people place outbound calls through a resource account’s number, and it has its own funding rules.
@p2
Read the current page for the pattern you are about to promise. Room names change. Shared Calling is not a slogan for ‘nobody gets a number and everything still works.’
@flow
Pattern|Room, common area, or shared;SKU|The current one;Number|Who owns it;Test|Inbound to that device
@chart
Do not copy a user bundle
@note
Distinct patterns.
@bars
User|3|Own number;Common area|1|Direct Routing, no Calling Plan;Room|2|Room SKU;Shared calling|2|Resource number
@lab
license-pick
@say
A Direct Routing common-area phone does not need a Calling Plan. A room has its own SKU.
@fault
Every corridor phone was given a user Calling Plan on a Direct Routing design.
@listen
License rooms and common-area phones on purpose. Direct Routing common-area phones do not need a Calling Plan.
@sources
lic,dr
---
@id
t02-defend
@track
t02
@title
A license set you can defend
@minutes
6
@why
Interviews and design reviews both ask for the set, not a brand name.
@depends
The earlier license lessons
@p1
Walk the picker in this order: does the person need PSTN, who is the carrier, do meetings need a dial-in number, is there a room, is there a voice app, does that app dial out. Audio Conferencing is the meeting dial-in. It is not implied by Teams Phone.
@p2
End with the sentence that Teams Premium changed none of those answers. Then cite the licensing page, because bundles move, and this campus was checked on 14 October 2026.
@flow
PSTN?|Yes or no;Carrier|Which option;Meetings|Audio Conferencing;Apps|Resource account
@chart
Picker order
@note
Ask in this order.
@bars
PSTN|1|First;Carrier|2|Second;Meetings|3|Third;Voice app|4|Fourth
@lab
license-pick
@say
I separate Teams Phone, the carrier, Audio Conferencing, the resource account, and Premium.
@fault
One SKU is expected to cover users, rooms, queues, and meeting dial-in.
@listen
Defend a license set by separating the phone system, the carrier, meeting dial-in, and the resource account.
@sources
lic,addon,vra
---
@id
t03-module
@track
t03
@title
The module and the session
@minutes
7
@why
The shell is how you read effective policy and how you assign compliance recording. The portal will not show you every object.
@depends
A role; a lab tenant
@p1
Install the MicrosoftTeams module and connect it to the tenant you named in the foundations track. Confirm you are not in production. Cmdlet parameters move between module versions, so Get-Help in the version you are about to run beats a blog post.
@p2
Compliance recording policies are created and granted in this module. If you only learn the portal, you cannot finish a recorder design.
@flow
Lab tenant|Not production;Connect|MicrosoftTeams;Help|This version;Read|Before write
@chart
Safe session
@note
Order of a session.
@bars
Tenant|1|Confirm;Connect|2|Session;Help|3|Parameters;Read|4|Then change
@lab

@say
I connect the MicrosoftTeams module to a named tenant and read help before I change anything.
@fault
A script from last year removes numbers because a parameter changed meaning.
@listen
Use the MicrosoftTeams module in a lab tenant. Read Get-Help for the version you are running.
@sources
dr,recps
---
@id
t03-objects
@track
t03
@title
Objects you will actually get
@minutes
8
@why
Voice routing is a handful of objects. If you can draw them, the cmdlets are spelling.
@depends
The module
@p1
A dial plan holds normalization rules. A voice route holds a pattern and gateways. A PSTN usage is a name that ties routes to a policy. A voice routing policy is the ordered list of usages you grant to a user. A PSTN gateway is the paired SBC.
@p2
Application instances show up twice in real designs: resource accounts for voice apps, and bots for compliance recording. Confirm which object you are creating before you run New-CsOnlineApplicationInstance.
@flow
Gateway|SBC;Route|Pattern;Usage|Permission name;Policy|Ordered usages;User|Grant
@chart
Object count in a small design
@note
How many objects, not how many users.
@bars
Gateway|2|Pair;Route|3|Patterns;Usage|3|Names;Policy|2|Assigned
@lab
usage-build
@say
Usage, route, policy, gateway. The policy is what the user has. The route is what the pattern does.
@fault
A route exists and no policy grants a usage that contains it.
@listen
Remember gateway, route, usage, and policy. The user only sees the policy you granted.
@sources
route,dial,dr
---
@id
t03-grant
@track
t03
@title
Grant, set, and new
@minutes
6
@why
New creates, set changes, grant assigns. Mixing them up is how a policy is edited and never reaches the user.
@depends
The object model
@p1
New-CsOnlineVoiceRoute creates a route. Set-CsOnlinePstnUsage maintains the usage list. Grant-CsOnlineVoiceRoutingPolicy assigns a policy to a user. Grant-CsTeamsComplianceRecordingPolicy assigns a recorder policy. None of those verbs is a synonym.
@p2
Read with Get- before you Set- or Grant-. Then read again. The second read is the evidence pack, not a personality trait.
@flow
Get|Current;New or Set|The object;Grant|The user;Get|Again
@chart
Verbs
@note
Do not skip the last read.
@bars
Get|1|Before;Change|2|New or Set;Grant|3|Assign;Get|4|After
@lab

@say
Grant assigns to a user. Set changes an object. I read both times.
@fault
The policy text is correct and the user still has Global.
@listen
New creates, set changes, grant assigns. Read the user after you grant.
@sources
route,recps
---
@id
t03-readuser
@track
t03
@title
Reading a user before you change one
@minutes
6
@why
The pilot user is often not the user you think. Group assignment hides the policy you just edited.
@depends
Get-CsOnlineUser
@p1
Get-CsOnlineUser shows voice policy, dial plan, and number fields. Look at the effective values. A group grant can beat the direct assignment you remember from last quarter.
@p2
Test the call as that user, from the client they actually use. A browser join and a certified phone do not take the same media path, and QoS will not treat them the same either.
@flow
Identity|Who;Effective|Policy and plan;Number|Assigned;Client|The real one
@chart
Read list
@note
Four reads before a change.
@bars
Identity|1|User;Policy|2|Effective;Number|3|Assigned;Client|4|Real device
@lab

@say
I read the effective policy with Get-CsOnlineUser before I edit anything.
@fault
You update a policy object that this user does not have.
@listen
Read the effective voice policy, dial plan, and number before you change them.
@sources
route,roles
---
@id
t03-disagree
@track
t03
@title
When the portal and the shell disagree
@minutes
5
@why
The toast is not the directory. The directory is what the next call will use.
@depends
A read cmdlet
@p1
If the Teams admin center shows a policy and the shell shows another, believe the shell long enough to place a test call, then refresh both. Replication delay is real. An hour of firmware changes during that delay is not.
@p2
Write down the time, the cmdlet, and the values. That note is the evidence pack. It is also how you avoid changing three systems because one screen was stale.
@flow
Portal|What it shows;Shell|What it shows;Wait|If they differ;Retest|One call
@chart
Who to believe first
@note
Teaching order during an incident.
@bars
Shell|2|Read this;Call|2|Test;Portal|1|Refresh after
@lab

@say
I will trust a fresh Get- over a stale toast, then place one test call.
@fault
Three changes land during a replication delay and nobody knows which one worked.
@listen
If the portal and the shell disagree, read the shell, wait, and place one test call.
@sources
roles
---
@id
t03-safety
@track
t03
@title
Safety on a lab tenant
@minutes
5
@why
Certificate and routing experiments belong where a mistake cannot take the company’s numbers away.
@depends
A second tenant or a clearly named lab domain
@p1
Pair a lab SBC to a lab domain. Use obviously fake names. Contoso and 555 numbers exist so practice does not point at a real directory. Do not find-and-replace a lab script onto production without reading every name.
@p2
Production changes get one hypothesis, a rollback, and a window. The lab is where you learn that a private CA will not satisfy Direct Routing.
@flow
Lab|Separate domain;Experiment|Certificate and routes;Evidence|What failed;Production|Later, with rollback
@chart
Where experiments go
@note
Lab first.
@bars
Lab|1|First;Evidence|2|Write it;Production|3|With rollback
@lab

@say
I will not discover certificate behavior on the company trunk.
@fault
The lab FQDN is also the production FQDN.
@listen
Experiment in a lab tenant. Do not point a practice script at production by find-and-replace.
@sources
dr
---
@id
t04-path
@track
t04
@title
Shortest path, no media proxy
@minutes
7
@why
Teams media hates hairpins and proxies. Bandwidth is the expensive way to hide a bad path.
@depends
A picture of the real egress
@p1
Microsoft’s QoS and network articles tell you to keep the path short: on the order of three to five hops from the client to your edge, and a short path from the ISP to Microsoft. Proxies in the media path are a known way to damage calls. ExpressRoute is not required.
@p2
Draw the path a branch actually uses. If that branch backhauls across a continent to egress, you already know why RTT is high. A fatter pipe will not shorten the fiber.
@flow
Client|Subnet;Edge|Local egress;ISP|Short hop;Microsoft|Media or SIP
@chart
Hop budget
@note
Planning guidance from the QoS article, not a measurement of your network.
@bars
Client to edge|5|About 3 to 5;ISP to Microsoft|3|About 3
@lab

@say
Local egress, no media proxy, ExpressRoute not required.
@fault
A branch hairpins through headquarters and every call shows long RTT.
@listen
Keep Teams media on a short path to the internet. Do not send it through a proxy or a distant hairpin.
@sources
qos,net
---
@id
t04-table
@track
t04
@title
The port and DSCP table
@minutes
8
@why
This table is the QoS interview. It is also the ACL.
@depends
The path
@p1
The QoS article’s initial ranges are audio UDP or TCP 50000–50019 at DSCP 46 EF, video 50020–50039 at 34 AF41, sharing 50040–50059 at 18 AF21, and calling and meeting signaling 50070–50089 at 40 CS5. Signaling ports are not configurable.
@p2
Browser joins do not use those fixed ranges. Mac and mobile hard-code audio as EF. Windows can follow policy, and the client process to match is ms-teams.exe, not the previous client’s name.
@flow
Audio|46 EF;Video|34 AF41;Share|18 AF21;Signaling|40 CS5
@chart
DSCP marks
@note
Bar length is the DSCP value from the QoS article.
@bars
Audio|46|EF;Video|34|AF41;Share|18|AF21;Signaling|40|CS5
@lab
qos-mark
@say
Audio is 46 on ports 50000 to 50019. I can place the other three without a card.
@fault
An ACL matches the old client or the wrong port range, so marks never land.
@listen
Audio DSCP 46, video 34, sharing 18, signaling 40. Browser joins do not use the fixed client ports.
@sources
qos
---
@id
t04-vpn
@track
t04
@title
VPN and the split tunnel
@minutes
6
@why
A full-tunnel VPN adds delay and hides the office subnet from emergency location and from CQD.
@depends
The port table
@p1
Microsoft recommends that you avoid real-time media on a VPN. QoS inside the tunnel only prioritizes traffic inside a path that is already longer. Split tunnel is the usual way to let media go direct while other traffic stays on the VPN.
@p2
A VPN pool labeled as headquarters will make CQD accuse the wrong building and can make dynamic emergency calling report the wrong place. Treat the VPN range as its own site, or as not a site.
@flow
User|Remote;Tunnel|Corporate apps;Media|Direct if split;Maps|VPN is not HQ
@chart
What the VPN breaks
@note
Qualitative.
@bars
Delay|2|Extra RTT;Mark|2|Often stripped;Map|3|Wrong building
@lab
qos-mark
@say
I keep real-time media off the full-tunnel VPN, and I do not label the VPN pool as HQ.
@fault
Remote users show high jitter and DSCP 0, and CQD draws them inside headquarters.
@listen
Do not send Teams media through a full-tunnel VPN. Do not call the VPN pool a building.
@sources
qos,emerg
---
@id
t04-bw
@track
t04
@title
Bandwidth you can calculate
@minutes
7
@why
64 kbit/s is the payload. The link carries headers too.
@depends
The codec you will offer
@p1
G.711 at 20 milliseconds is 160 bytes of payload. Add 40 bytes of IP, UDP, and RTP and the call is 80 kbit/s per direction at layer 3. Add an 18-byte Ethernet header and it is 87.2 kbit/s. G.729 at the same interval is 20 bytes of payload, 24 kbit/s at layer 3.
@p2
Silence suppression and a different packet interval change the average. Size the busy hour at the packetization you actually configure, in both directions, for the concurrent calls you actually expect. A yearly average divided by eight is not a busy hour.
@flow
Payload|Codec;Headers|40 bytes, plus L2;Interval|20 ms unless you changed it;Times|Concurrent calls
@chart
One G.711 call, kbit/s
@note
Computed from the header formula. One direction.
@bars
Payload|64|64 kbit/s;Layer 3|80|80;Ethernet|87.2|87.2
@lab
bandwidth
@say
G.711 at 20 ms is 80 kbit/s at layer 3 and 87.2 with a typical Ethernet header.
@fault
Thirty calls were planned at 64 kbit/s and the policer drops the rest.
@listen
Count headers. G.711 at 20 milliseconds is 80 kilobits per second at layer 3, 87.2 with Ethernet.
@sources
qos,dr
---
@id
t04-prove
@track
t04
@title
Proving the mark survived
@minutes
6
@why
A client policy that the WAN undoes is not QoS.
@depends
The port table; a capture point
@p1
Capture at the network egress, not only on the PC. You want the DSCP value on the wire after the VPN, the switch, and the router. Port mirroring is the usual way.
@p2
If audio ports 50000–50019 leave the building marked 0, the client policy missed or a device rewrote the mark. Fix that before you argue about codecs.
@flow
Enable|Insert markers;Call|Known port;Capture|At the egress;Compare|DSCP still 46
@chart
Where to look
@note
Sequence.
@bars
Client|1|Policy;LAN|2|May rewrite;Egress|3|The proof
@lab
qos-mark
@say
I capture at the egress and show DSCP 46 still on the audio ports.
@fault
The laptop looks correct and the WAN sees best effort.
@listen
Prove QoS at the network egress. A mark that dies on the VPN is not a design.
@sources
qos
---
@id
t04-er
@track
t04
@title
ExpressRoute is not the requirement
@minutes
5
@why
A private circuit is a purchasing choice. It is not the Teams network requirement.
@depends
The shortest path
@p1
Teams is designed to work over the internet with local egress. If your organization also has ExpressRoute, follow the current network documentation for which traffic belongs there. Do not assume media is automatically better on the private path.
@p2
QoS still has to be consistent on whatever path you chose. A private path with no marks and extra distance is a slower best-effort network.
@flow
Choose|Internet or private;Egress|Local if you can;Mark|Same DSCP story;Measure|RTT and loss
@chart
Decision, not a default
@note
Both can be valid. The article does not require ExpressRoute.
@bars
Internet egress|2|Usual;Private path|1|Only with a reason
@lab

@say
Teams does not require ExpressRoute. Local internet egress is the normal plan.
@fault
Media is forced onto a long private path and delay gets worse.
@listen
Do not buy ExpressRoute to make Teams legal. Design the path, then mark it.
@sources
net,qos
---
@id
t05-four
@track
t05
@title
Four ways to reach the PSTN
@minutes
8
@why
The connectivity option decides who operates the carrier, who you call at 2 a.m., and which license you buy.
@depends
Teams Phone; a network path
@p1
The four options on the connectivity page are Calling Plans, Operator Connect, Teams Phone Mobile, and Direct Routing. Microsoft is the carrier only for Calling Plans. The others use a partner or your SBC. One tenant may use all four for different people.
@p2
Operator Connect for India is its own plan because the regulatory problem is different. Do not hide an India office inside a UK SBC and call it Operator Connect.
@flow
Need|PSTN;Choose|One option per population;License|Matches the option;Route|Matches the license
@chart
How much you operate
@note
Teaching weight, not a fee.
@bars
Calling Plan|1|Microsoft;Operator Connect|2|Carrier;Phone Mobile|2|Mobile operator;Direct Routing|4|Your SBC
@lab
license-pick
@say
Four options. Microsoft is the carrier only for Calling Plans. Mixing them in one tenant is allowed.
@fault
One global route assumes every user has the same carrier.
@listen
Calling Plans, Operator Connect, Teams Phone Mobile, and Direct Routing can share a tenant. They cannot share one careless route.
@sources
pstn,dr
---
@id
t05-cp
@track
t05
@title
Calling Plans in practice
@minutes
6
@why
This is the option with the least SBC work and the least control.
@depends
The four options
@p1
You assign the plan, you receive numbers from Microsoft, and emergency calling in supported countries is part of that service. You still configure emergency locations. You do not pair an SBC for those users.
@p2
If a Calling Plan user also matches a Direct Routing voice route, you may send their calls onto your SBC by accident. The policy has to match the license.
@flow
License|Calling Plan;Numbers|From Microsoft;Location|Still your data;Policy|Do not force your SBC
@chart
What you skip
@note
Relative operational load.
@bars
SBC|0|None for these users;Locations|2|Still required;License|2|Plan plus Phone
@lab
license-pick
@say
Calling Plan users should not inherit a Direct Routing route by accident.
@fault
911 for a Calling Plan user is sent to a foreign SBC by a copied policy.
@listen
Calling Plans use Microsoft as the carrier. Keep those users off a Direct Routing policy you did not intend.
@sources
calling,emerg
---
@id
t05-oc
@track
t05
@title
Operator Connect
@minutes
6
@why
You keep a carrier relationship without operating the SBC.
@depends
Teams Phone; a carrier in the program
@p1
The operator is enabled in the tenant and assigns numbers. You need Teams Phone. You do not need a Microsoft Calling Plan, and you do not run the SBC. India has a separate operator plan.
@p2
Ask the operator which numbers are service numbers for attendants and which are user numbers. A user number that walks out the door with an employee is a publishing problem.
@flow
Carrier|In the program;Enable|Tenant;Numbers|Assigned;Voice app|Service numbers
@chart
What you still own
@note
The carrier operates the trunk.
@bars
SBC|0|Theirs;Numbers|2|You assign;Locations|2|You still map
@lab

@say
Operator Connect is Teams Phone plus a certified carrier. I do not also build an SBC for those same numbers.
@fault
Direct Routing and Operator Connect both claim the same range.
@listen
Operator Connect lets a certified carrier run PSTN for Teams Phone users. Do not duplicate it with an SBC unless you mean to.
@sources
oc,pstn
---
@id
t05-mobile
@track
t05
@title
Teams Phone Mobile
@minutes
6
@why
The SIM number and the Teams number are the same number. That is a gift for frontline staff and a trap for a reception queue.
@depends
A participating mobile operator
@p1
Teams Phone Mobile uses a certified mobile operator. The user’s SIM number is assigned as their Teams number. They need Teams Phone. They do not need a separate Calling Plan for that path.
@p2
Do not put the main queue on someone’s SIM. When that person leaves, the number leaves. CRM matching also fails if the same human presents two caller IDs.
@flow
Operator|Certified mobile;SIM|Becomes the Teams number;User|Frontline;Not|The main queue
@chart
Good fit
@note
Qualitative fit, not a survey.
@bars
Frontline user|3|Good fit;Reception queue|0|Wrong tool
@lab

@say
Teams Phone Mobile makes the SIM number the Teams number. I would not put a queue on it.
@fault
One person has two caller IDs and the CRM matches neither.
@listen
Teams Phone Mobile is for people with a SIM, not for the company’s main queue.
@sources
tpm
---
@id
t05-dr
@track
t05
@title
Direct Routing
@minutes
9
@why
This is the option when you still own trunks, a PBX, analog devices, or a contact-center SBC.
@depends
Teams Phone; a certified SBC; a verified domain
@p1
You pair an SBC FQDN on a verified domain, present a public certificate, signal TLS to sip.pstnhub.microsoft.com and its sip2 and sip3 partners on port 5061, and allow media UDP 3478–3481 and 49152–53247. Firewall rules must allow the published IP ranges, not only today’s DNS answer. GCC High and DoD use different proxy names.
@p2
Users need Teams and Teams Phone, homed online, not in Islands mode. Budget at least two media ports per concurrent call. Microsoft does not support media re-targeting mid-call. Codecs include SILK, G.711, G.722, G.729, and AMR-WB only when bypass is off.
@flow
FQDN|Verified domain;TLS|5061 to three proxies;Media|UDP ranges;Route|Policy on the user
@chart
Ports that matter
@note
Documented destinations. Not a traffic volume.
@bars
SIP|5061|TCP TLS;Media low|3481|3478–3481;Media high|53247|49152–53247
@lab
dr-path
@say
5061 to the three commercial proxies, media on those UDP ranges, certificate name matches the FQDN, user has a route.
@fault
5061 is open, media is not, and both sides hear silence.
@listen
Direct Routing is your certified SBC, TLS on 5061 to the PSTN hubs, and a voice route on a Teams Phone user.
@sources
dr,sbcs
---
@id
t05-mix
@track
t05
@title
Mixing them in one tenant
@minutes
6
@why
The plan page’s own example puts knowledge workers on Operator Connect, frontline on Teams Phone Mobile, contact centers on Direct Routing, and a small office on Calling Plans.
@depends
The four options; voice policies
@p1
Write a table: population, connectivity, policy, who operates the trunk. A contact center on Direct Routing and a headquarters on Operator Connect is a normal tenant, not a compromise.
@p2
The failure mode is a single voice routing policy granted to everyone. Mobile users then hairpin through an SBC they should never touch, or Calling Plan emergency calls leave the country.
@flow
Table|Population to option;Policy|One per population;Test|Each row;Exception|Named, not implied
@chart
Example from the plan page
@note
The plan page’s example populations. Not your org chart.
@bars
Knowledge|2|Operator Connect;Frontline|2|Phone Mobile;Contact center|4|Direct Routing;Small site|1|Calling Plan
@lab
dr-path
@say
I mix options on purpose, with a policy per population.
@fault
One global policy sends every population through one SBC.
@listen
Mix connectivity options with a written table and a separate voice policy for each population.
@sources
dr,pstn
---
@id
t06-norm
@track
t06
@title
Normalize, then route
@minutes
8
@why
Routes match the number after the dial plan. A perfect route that expects E.164 will never see a local habit.
@depends
A dial plan; a voice route
@p1
The person dials 020 7555 4010 or 425 555 0100. The first matching normalization rule rewrites it. Later rules do not run. The voice route then sees the result, usually E.164.
@p2
Put emergency short codes above any catch-all. A rule that turns every three-digit string into an extension will eat 999. Test the raw digits and the normalized form. The route is not wrong just because you typed the raw digits into it.
@flow
Digits|What they dialed;Rule|First match;E.164|What the route sees;Route|Pattern
@chart
Order
@note
You cannot route before you normalize.
@bars
Normalize|1|First;Route|2|Second
@lab
dial-plan
@say
First matching normalization rule wins. I test the route with the normalized number.
@fault
A catch-all rule is first, so the emergency rule never runs.
@listen
Normalize first, first match wins, then let the voice route see E.164.
@sources
dial,route
---
@id
t06-plans
@track
t06
@title
Dial plans and first match
@minutes
7
@why
A branch that dials differently needs its own plan. Editing the global plan does not change a user who has a more specific one.
@depends
Normalization
@p1
Tenant dial plans hold the rules. Grant the plan to the users it describes. A user with a specific plan will not pick up your edit to the global plan.
@p2
Keep rules anchored. A pattern without an end anchor will match a prefix of a longer number and translate the wrong thing. The lab on this campus is a teaching matcher with the same first-match idea, not the Microsoft service.
@flow
Plan|Named;Rules|Specific before general;Grant|The right users;Test|As that user
@chart
Rule order
@note
Earlier rules shadow later ones.
@bars
Emergency|1|First;Specific|2|Next;National|3|Then;Catch-all|4|Last if ever
@lab
dial-plan
@say
Specific rules first, grant the plan to the user, test as that user.
@fault
You edit Global and the branch plan still has the old rule.
@listen
Grant a dial plan to the user who needs it. First match wins, so emergency and specific rules go first.
@sources
dial
---
@id
t06-usage
@track
t06
@title
PSTN usages are the permission
@minutes
7
@why
A route without a usage on the user’s policy is invisible. A usage on the wrong policy is an international bill.
@depends
Routes; users
@p1
PSTN usages are names. Voice routes attach to them. The user’s voice routing policy lists the usages in order. Teams walks that order. This campus’s matcher does the same and says so on the lab.
@p2
Give a branch a policy whose usages stop at national. Give headquarters a policy that continues to international. Do not share one policy and hope the route patterns save you.
@flow
Route|Pattern and SBC;Usage|Named permission;Policy|Ordered usages;User|Grant
@chart
Who may call
@note
Example policies, not a directory.
@bars
Emergency|1|Everyone;National|2|Branch and HQ;International|3|HQ only
@lab
route-match
@say
The usage is the permission. The policy is the ordered list of permissions on the user.
@fault
International works at a branch because that usage was left on the policy.
@listen
PSTN usages are how a policy allows a route. Walk them in order.
@sources
route
---
@id
t06-route
@track
t06
@title
Voice routes and gateways
@minutes
7
@why
The route is a regular expression plus an ordered list of SBCs. CUCM wildcards will not work here.
@depends
Usages
@p1
Anchor the pattern to the normalized number. List gateways with priorities. In this campus, priority 1 is tried first. Confirm the current article before you depend on a production tie-break. A second gateway that has never carried a call is a drawing.
@p2
Unassigned numbers you own should be treated on purpose, usually toward an attendant. A ported block with fifty silent numbers looks like an outage.
@flow
Pattern|Anchored regex;Gateways|Priority order;Usage|Attached;Rehearse|Pull the first SBC
@chart
Gateway list
@note
Priority in the teaching model.
@bars
Primary|1|Tried first;Secondary|2|Failover
@lab
usage-build
@say
The voice route is a regex and a gateway list. I rehearse failover.
@fault
Both SBCs are priority 1 and nobody knows which one took the call.
@listen
A voice route matches the normalized number and tries gateways in priority order. Rehearse the second one.
@sources
route,dr
---
@id
t06-london
@track
t06
@title
A London worked example
@minutes
8
@why
One concrete walk is worth a page of definitions.
@depends
Normalization; usages; routes
@p1
A London user dials a UK national number. Their dial plan emits +44. Their policy lists emergency, then UK national, then international. The UK route matches +44 and prefers sbc-lon, with sbc-man as priority 2. A Manchester-only policy has no international usage, so a US number fails closed.
@p2
An emergency 999 hits a rule that rewrites it to the emergency route, not to an extension and not to the international gateway. If you cannot tell that story with your own site names, you are not ready to change production.
@flow
Dial|UK number;Normalize|+44;Usage|UK national;SBC|London first
@chart
Policy walk
@note
First match in the teaching model.
@bars
Emergency|1|Checked first;UK|2|Matches;International|3|Not needed
@lab
route-match
@say
I can walk one number through normalize, usage, route, and gateway.
@fault
999 matches an international route via another country.
@listen
Walk a number: dial plan, then usages in order, then the route, then the gateway priority.
@sources
route,dial,emerg
---
@id
t06-islands
@track
t06
@title
Islands mode and other hard stops
@minutes
5
@why
Some failures are not routing tweaks. They are unsupported states.
@depends
Homed online; a policy
@p1
Direct Routing is not supported in Islands mode. An SBC FQDN on onmicrosoft.com is not supported. A private CA is not a production certificate. AMR-WB is not a bypass codec. Media cannot be re-targeted mid-call.
@p2
Memorize the hard stops. They save you from debugging a dial plan that was never going to run.
@flow
Mode|Not Islands;Name|Verified domain;Cert|Public CA;Codec|Legal for the path
@chart
Hard stops
@note
Each one is enough to stop the design.
@bars
Islands|1|Unsupported;onmicrosoft.com|1|Unsupported;Private CA|1|Not production;AMR-WB plus bypass|1|Not supported
@lab
dr-path
@say
I list the hard stops before I tune a regex.
@fault
Hours go into a route while the user is still in Islands mode.
@listen
Islands mode, onmicrosoft.com SBC names, private CAs, and AMR-WB with bypass are hard stops.
@sources
dr
---
@id
t07-ra
@track
t07
@title
Resource accounts for voice apps
@minutes
7
@why
The attendant and the queue are not callable until an account represents them.
@depends
The resource-account license
@p1
Create the resource account, assign the Teams Phone Resource Account license, and attach it to the attendant or queue. A phone number is optional until the PSTN must reach that app. The account stays disabled for sign-in.
@p2
At least one Teams Phone license in the tenant turns on the voice-app services. A tenant with zero phone-system licenses will not grow a working queue out of a resource account alone. Read the prerequisite article for the current wording.
@flow
Account|Create;License|Resource SKU;Attach|Attendant or queue;Number|Only if PSTN must reach it
@chart
Required pieces
@note
Number is optional.
@bars
Account|1|Required;License|1|Required;Number|0|Only if published
@lab
aa-cq
@say
The resource account is the voice app’s identity. The number is optional until you publish it.
@fault
The queue exists and has no licensed resource account, so it never answers.
@listen
Every attendant and queue that answers needs a licensed resource account. Add a phone number only if the PSTN must reach it.
@sources
ra,prereq,vra
---
@id
t07-aa
@track
t07
@title
Auto attendant design
@minutes
8
@why
The published company number is usually this object. A sloppy menu is a public defect.
@depends
A resource account
@p1
Set business hours, holidays, a greeting you have rights to play, menu keys, directory search scope, and an operator. Directory search will find people you did not mean to publish if you leave it wide open.
@p2
Each menu key needs a target: a person, a queue, another attendant, voicemail, or an external number. External targets need funding. A key that points nowhere is a silent failure with your logo on it.
@flow
Hours|Open and closed;Greeting|A file you may play;Menu|Keyed targets;Operator|Zero and failures
@chart
Menu completeness
@note
Checks before you publish.
@bars
Hours|1|Set;Holiday|1|Next year loaded;Greeting|1|Owned;Operator|1|Named
@lab
aa-cq
@say
Hours, holidays, greeting, scoped directory, and an operator. Every key has a target.
@fault
The office is closed on a holiday and the attendant still hunts a queue.
@listen
Design the attendant’s hours, holidays, greeting, menu targets, and operator before you publish the number.
@sources
aa,prereq
---
@id
t07-queue
@track
t07
@title
Queue routing methods
@minutes
7
@why
Attendant, serial, round robin, and longest idle are different promises to the people answering.
@depends
Agents who exist
@p1
Attendant routing rings available agents together. Serial walks a list. Round robin remembers the last agent. Longest idle offers the call to the person waiting longest. Presence-based routing can skip someone who is already in a call or a meeting.
@p2
Conference mode changes whether the caller sits in a conference while agents are tried. Test it with two agents, one busy, before you argue about delay. An opt-out flag without a workforce plan means the schedule and the queue disagree by lunchtime.
@flow
Method|Pick one;Presence|Skip or not;Conference|On or off;Test|Two agents
@chart
Methods
@note
Four documented methods. Not a quality score.
@bars
Attendant|1|Together;Serial|2|List order;Round robin|3|Rotate;Longest idle|4|Wait time
@lab
aa-cq
@say
I can define the four routing methods and I will test presence with two agents.
@fault
Serial routing pins every call on the first person, who then opts out.
@listen
Pick attendant, serial, round robin, or longest idle on purpose, then test with one agent busy.
@sources
cq
---
@id
t07-overflow
@track
t07
@title
Timeout, overflow, and outbound funding
@minutes
7
@why
A queue without overflow is a waiting room with a locked door.
@depends
A method; a resource account
@p1
Set a timeout that a human would tolerate, and an overflow target: another queue, a person, voicemail, or an external number. Voicemail overflow needs a mailbox. External overflow, callback, and on-behalf outbound need pay-as-you-go or communications credits on the resource account.
@p2
Callback is an outbound call. A greeting that promises a callback you cannot fund is a falsehood with a phone number on it. Test overflow by making every agent busy, not by reading the setting.
@flow
Timeout|Seconds;Overflow|A real target;Fund|If external;Test|All agents busy
@chart
Outbound cases that need funding
@note
From the voice-app prerequisite article.
@bars
External transfer|1|Fund;Callback|1|Fund;On-behalf dial|1|Fund
@lab
aa-cq
@say
Overflow is a target I have tested. External overflow is funded.
@fault
Callback is enabled and every return call fails because nothing was funded.
@listen
Give every queue a timeout and an overflow you have tested. Fund the resource account if it dials out.
@sources
cq,prereq,vm
---
@id
t07-nest
@track
t07
@title
Nested voice apps
@minutes
6
@why
Real companies are a tree: one attendant, a few queues, an overflow attendant. The tree needs a picture.
@depends
Attendants and queues
@p1
An attendant can send a key to a queue. A queue can overflow to another queue or back to an attendant. Draw it. If you cannot draw it, callers will find the loop before you do.
@p2
Keep one published pilot number. Internal targets do not each need a ported number. A design that ports a number per menu key is paying carrier lead time for a diagram.
@flow
Pilot|One number;Attendant|Keys;Queues|Skills or teams;Overflow|Back to a person or voicemail
@chart
Objects in a small tree
@note
Example size.
@bars
Pilot numbers|1|One;Attendant|1|Front door;Queues|3|Teams
@lab
aa-cq
@say
One pilot number, a drawn tree, no loops, overflow that ends.
@fault
Menu key 1 points at a queue whose overflow points back at the same menu.
@listen
Draw nested attendants and queues. Publish one pilot number, and make sure overflow ends.
@sources
aa,cq
---
@id
t07-numbers
@track
t07
@title
Numbers on voice apps
@minutes
6
@why
The number’s owner decides whether the company keeps it when a human leaves.
@depends
A connectivity option
@p1
Put service numbers on resource accounts. Do not put the main number on a receptionist’s user object. Caller ID for the queue should be chosen, not inherited from whoever built the queue.
@p2
How you get the number depends on the connectivity option: Microsoft inventory, the Operator Connect carrier, or the Direct Routing carrier. Porting is a carrier project with a date, not a PowerShell metaphor.
@flow
Inventory|Where the number lives;Assign|Resource account;Identity|Caller ID;Port|Only if you must
@chart
Who should own the main number
@note
The resource account, not a person.
@bars
Resource account|1|Yes;A user|0|No
@lab
aa-cq
@say
Service numbers sit on resource accounts. Caller ID is a choice.
@fault
The receptionist leaves and the main number is released with their user.
@listen
Assign the company number to a resource account, and set caller ID on purpose.
@sources
phone,ra,pstn
---
@id
t08-gate
@track
t08
@title
Emergency calling is a design gate
@minutes
7
@why
A phone system that cannot reach emergency services is not ready, even if every other demo looks good.
@depends
A connectivity option; a network map
@p1
Treat emergency calling as a gate before go-live. Calling Plans in supported countries use Microsoft’s emergency service, and you still load locations. Direct Routing makes you, the SBC, and the carrier responsible for the call.
@p2
Do not test by placing a real emergency call. Use the carrier’s test process. Do not send emergency calls into a bot so they can be ‘handled.’ Know whether your recorder includes them, and follow the rule you were given.
@flow
Location|Where the client is;Route|Local and boring;Carrier|Accepts the call;Test|Carrier’s process
@chart
Gate, not a follow-up
@note
Do this before the pilot becomes production.
@bars
Location|1|Mapped;Route|1|Dedicated;Test|1|Not a real emergency call
@lab
e911-match
@say
Emergency is a gate. I will not demo a bot on the emergency number.
@fault
999 matches the IVR workstream.
@listen
Finish emergency location and a local route before go-live. Test with the carrier’s process, not a real emergency call.
@sources
emerg,dr
---
@id
t08-dynamic
@track
t08
@title
Dynamic location
@minutes
8
@why
A laptop moves. The address you shouted at install time does not.
@depends
Subnets; civic addresses
@p1
Dynamic emergency calling uses the network Teams can see. In the usual design that means trusted IPs, sites, and subnets tied to validated civic addresses. A dispatchable location is specific enough for responders. One address for five buildings is not.
@p2
Trusted IPs mean ‘this client is inside our network.’ If you list the VPN concentrator, every remote user looks internal. Give the VPN pool no dispatchable headquarters address. The same subnet list should later feed location-based routing and CQD, or the three maps will disagree.
@flow
Trusted IP|Are they internal;Subnet|Which site;Address|Civic and specific;Client|That location
@chart
Topology depth
@note
More specific is safer.
@bars
Tenant default|1|Too vague;Site|2|Better;Floor or place|3|Dispatchable
@lab
e911-match
@say
Trusted IP, subnet, civic address. The VPN pool is not headquarters.
@fault
Remote users inherit the HQ floor because the VPN range was trusted as internal.
@listen
Map trusted IPs, subnets, and civic addresses. Do not give VPN users the headquarters address.
@sources
emerg
---
@id
t08-who
@track
t08
@title
Calling Plans versus Direct Routing emergency
@minutes
7
@why
The client is Teams in both designs. The carrier is not.
@depends
Dynamic location; the connectivity option
@p1
On Calling Plans, Microsoft’s emergency calling path is in play in supported countries, and your job is accurate locations. On Direct Routing, the emergency voice route must prefer the local SBC, and the carrier must accept the call. PIDF-LO can ride in the INVITE. If the SBC strips it, the far end may only see the trunk.
@p2
An emergency calling policy controls notification and lookup. It is not a substitute for the route. On-site security who are not notified will meet responders at the wrong door.
@flow
Plan user|Microsoft path plus locations;Direct Routing user|Your SBC and carrier;Policy|Notify;PIDF-LO|Pass it
@chart
Who routes the emergency call
@note
Different connectivity, different owner.
@bars
Calling Plan|1|Microsoft path;Direct Routing|2|You and the carrier
@lab
e911-match
@say
Calling Plan emergency and Direct Routing emergency are different owners. I will not copy one route onto the other.
@fault
A Calling Plan user’s 911 is forced out a foreign SBC.
@listen
Say who routes the emergency call. Microsoft’s path for Calling Plans, your SBC and carrier for Direct Routing.
@sources
emerg,calling,dr
---
@id
t08-lbr
@track
t08
@title
Location-based routing
@minutes
7
@why
Some countries treat toll bypass as a regulatory problem. Location-based routing is the Teams control.
@depends
Network sites; gateways that belong to those sites
@p1
Location-based routing stops a user in a regulated site from placing or receiving PSTN through a gateway in another site. It uses the same kind of network topology as emergency location. A traveler’s laptop should not egress through another country’s SBC.
@p2
Media bypass can fight this if the media path would egress in the wrong place. Read the current LBR article before you enable bypass at a regulated site. Do not invent an exception in a workshop.
@flow
Site|Regulated;Gateway|Local only;Policy|LBR on;Bypass|Only if the article allows
@chart
What LBR constrains
@note
Qualitative.
@bars
Signaling egress|2|Local SBC;Media egress|2|Check bypass;Emergency|3|Still has to work
@lab
bypass
@say
LBR keeps PSTN in-country. I will re-read it before I enable media bypass there.
@fault
A laptop in one country places PSTN through another country’s SBC.
@listen
Location-based routing stops toll bypass by tying users to local gateways. Check it before you enable media bypass.
@sources
lbr,bypass
---
@id
t08-sba
@track
t08
@title
Survivable Branch Appliance
@minutes
7
@why
A WAN cut should not remove the ability to place a local PSTN call, including emergency.
@depends
Direct Routing; a supported appliance
@p1
A Survivable Branch Appliance keeps a limited calling set for clients that can reach it when Microsoft 365 cannot. It is a Direct Routing feature. Meetings, presence, and the rest of the cloud are not the survivable set. Confirm the feature list for the firmware you run.
@p2
Test a WAN cut in a window. An SBA that has never been tested is a packing slip. Analog devices such as elevators need a path that does not depend on a Teams user signed in through the dead WAN.
@flow
WAN up|Cloud is primary;WAN down|SBA and local SBC;PSTN|Still possible;Cloud apps|Not promised
@chart
During a WAN cut
@note
Teaching split. Confirm the appliance feature list.
@bars
Local PSTN|2|Designed to survive;Meetings|0|Not the point of SBA
@lab
sba-time
@say
SBA is local PSTN survivability for Direct Routing, not a full Teams cloud.
@fault
The WAN fails and emergency calls fail with it because no local path was tested.
@listen
A Survivable Branch Appliance keeps local PSTN up when the branch cannot reach Microsoft 365. Test the cut.
@sources
sba,dr
---
@id
t08-notify
@track
t08
@title
Notification and the test call
@minutes
6
@why
Responders at the wrong door, and a test that called the real emergency service, are both failures.
@depends
An emergency policy; a carrier test process
@p1
Assign the emergency calling policy that notifies the people who can meet responders. Test the notification. A policy that exists and is not assigned notifies nobody.
@p2
Use the carrier’s test number or process. Do not dial the real emergency number from a lab because you were curious. Record the result: location shown, SBC used, who was notified.
@flow
Policy|Assigned;Notify|The right people;Test number|Carrier process;Record|Location and SBC
@chart
Evidence from a test
@note
Write these down.
@bars
Location|1|What was sent;SBC|1|Which trunk;Notify|1|Who was told
@lab
e911-match
@say
I test emergency with the carrier’s process and I check that on-site notification fired.
@fault
The notification policy exists and is assigned to nobody.
@listen
Assign the notification policy and test emergency calling with the carrier’s process, not a real emergency call.
@sources
emerg
---
@id
t09-phones
@track
t09
@title
Certified phones
@minutes
6
@why
A bargain SIP phone is not a Teams client. The certified list is the product boundary.
@depends
Teams Phone; a number
@p1
Teams-certified phones sign in as Teams users and use the Teams media stack. SIP Gateway covers a smaller set of compatible SIP and analog devices, with a smaller feature list. Check the current list before you buy.
@p2
QoS for phones follows the same DSCP story, with device-specific notes in the rooms and devices articles. A phone that never registers is often identity or Conditional Access, not a codec.
@flow
Buy|Certified or SIP Gateway;Identity|Account and license;Access|Conditional Access;Number|Assigned
@chart
Device families
@note
Do not mix them up.
@bars
Teams phone|2|Full client;SIP Gateway|1|Limited devices;Random SIP|0|Not a plan
@lab

@say
I buy from the current certified list, or I use SIP Gateway for the devices it actually supports.
@fault
A generic SIP phone is forced into the design and never registers.
@listen
Use Teams-certified phones or the SIP Gateway device list. Do not invent a third category.
@sources
sipgw,qos
---
@id
t09-rooms
@track
t09
@title
Teams Rooms
@minutes
6
@why
A room account with a user license and a strict Conditional Access policy is a dark screen at the start of a meeting.
@depends
A room SKU; identity
@p1
Rooms use the current Teams Rooms license. Do not borrow a user Calling Plan and hope. The room resource account must be allowed to sign in as a device. Conditional Access that assumes an interactive user will lock it out.
@p2
QoS for Teams Rooms is documented separately for Windows and Android. Include the room in the same DSCP plan as the PCs, and test a call from the room, not only from a laptop.
@flow
SKU|Current room license;Account|Allowed to sign in;CA|Scoped;QoS|Same marks
@chart
Room readiness
@note
Checks.
@bars
License|1|Room SKU;Sign-in|1|Device path;QoS|1|Included
@lab

@say
Rooms get a room license and a Conditional Access exception you can explain.
@fault
The room has a user E5 stack and still cannot sign in.
@listen
License Teams Rooms with the current room SKU and let the device sign in.
@sources
lic,qos
---
@id
t09-analog
@track
t09
@title
SIP Gateway and analog
@minutes
6
@why
Elevators, door phones, and fax machines do not run the Teams client.
@depends
An SBC or SIP Gateway
@p1
Leave analog on a certified SBC or on SIP Gateway when the device is supported. Direct Routing is the usual way to keep those devices when the humans move to Teams. A Calling Plan user license does not create an elevator phone.
@p2
Test the emergency path from the analog device, including during a WAN cut if the device must keep working. An elevator that depends on a cloud sign-in is a bad surprise.
@flow
Device|Analog;Front|SBC or SIP Gateway;Number|Service number;Emergency|Tested from that device
@chart
Where analog sits
@note
Not on a user client.
@bars
SBC|2|Usual;SIP Gateway|1|Listed devices;Teams client|0|Not for elevators
@lab
sba-time
@say
Analog stays on the SBC or SIP Gateway, with an emergency test from that device.
@fault
The elevator is migrated to a Teams user and fails when the WAN fails.
@listen
Keep analog devices on an SBC or SIP Gateway, and test their emergency path.
@sources
sipgw,sba
---
@id
t09-bypass
@track
t09
@title
Media bypass
@minutes
8
@why
Bypass changes where RTP flows. It does not change where SIP flows.
@depends
A paired SBC; a client that can reach it
@p1
With media bypass enabled on the gateway, media can run directly between the Teams client and the SBC instead of through Microsoft’s media processors. Signaling still uses the PSTN hubs. Microsoft does not support re-targeting that media mid-call.
@p2
Bypass is a candidate when the user is on a network that can reach the SBC. A full-tunnel VPN is a poor candidate. Location-based routing may forbid the path. AMR-WB is listed for non-bypass only. If bypass is off, open UDP 3478–3481 and 49152–53247.
@flow
Flag|On the gateway;User|Can reach the SBC;LBR|Allows it;Media|Client to SBC, SIP still to Teams
@chart
Two paths
@note
Signaling does not bypass.
@bars
Signaling via Teams|1|Always;Media via processor|1|Default;Media direct|1|Bypass candidate
@lab
bypass
@say
Bypass is media only. SIP still goes through Teams. I check LBR and the VPN first.
@fault
Bypass is enabled for VPN users and audio gets worse.
@listen
Media bypass skips the media processor, not the SIP proxy. Turn it on only when the client can reach the SBC.
@sources
dr,lbr
---
@id
t09-lmo
@track
t09
@title
Local media optimization
@minutes
6
@why
A branch SBC with one public interface can still hairpin local users out and back.
@depends
Media bypass concepts; network sites
@p1
Local media optimization uses internal and external SBC interfaces so a user inside the branch stays on the local media path. It is more specific than a single bypass checkbox. Use the current article and the SBC vendor’s build.
@p2
If internal users hairpin to the public address of an SBC sitting on their own LAN, you have not finished the design. Draw the interfaces before you enable the feature.
@flow
Internal user|Internal interface;External user|External interface;Signaling|Still Teams;Draw|Both paths
@chart
Interfaces
@note
Two interfaces, one SBC.
@bars
Inside|1|Internal NIC;Outside|1|Public NIC
@lab
bypass
@say
Local media optimization is about which SBC interface the media uses. I will draw both.
@fault
Users on the LAN hairpin through the public internet to reach an SBC in the same rack.
@listen
Local media optimization keeps branch media on the internal SBC interface. Draw the interfaces.
@sources
dr
---
@id
t09-cap
@track
t09
@title
Common area phones, again, as devices
@minutes
5
@why
The license sentence and the device sentence meet at the hallway.
@depends
Common-area licensing; certified phones
@p1
A common-area phone is a device account plus a number plus a policy. On Direct Routing it does not need a Calling Plan. It still needs a supported phone and a network path that can reach Teams.
@p2
Do not reuse a departed employee’s number by signing the phone in as that employee. That is how caller ID and voicemail become someone else’s mailbox.
@flow
Account|Device, not a person;License|Fits Direct Routing or Calling Plan;Phone|Certified;Number|Service or dedicated
@chart
Not a user
@note
Identity type.
@bars
Device account|1|Yes;Former employee|0|No
@lab

@say
A common-area phone has its own account. I will not sign it in as a person who left.
@fault
The hallway phone deposits voicemail into a former employee’s mailbox.
@listen
Give common-area phones their own accounts and the license that matches the connectivity option.
@sources
dr,lic
---
@id
t10-cert
@track
t10
@title
What certification buys you
@minutes
7
@why
Microsoft supports Direct Routing on certified SBCs. Everything else can be refused.
@depends
Direct Routing as the option
@p1
The certified list is the support boundary. AudioCodes, Ribbon, Oracle, and Cisco CUBE are families you will meet. A logo is not a certification. The software release has to be on the list.
@p2
When it breaks, you call the vendor. They escalate to Microsoft if they must. Open that path with firmware, a ladder, and the paired FQDN. A homemade SBC with a clever config is an unsupported trunk.
@flow
List|Release is certified;Guide|That vendor, that release;Pair|FQDN;Ticket|Vendor first
@chart
Support path
@note
Order of calls during an incident.
@bars
Vendor|1|First;Microsoft|2|If the vendor escalates
@lab
sbc-check
@say
Certification is a release on Microsoft’s list. Support starts with the vendor.
@fault
A case is opened on an unlisted SBC with no logs.
@listen
Use a certified SBC release. Call the vendor first, with logs.
@sources
sbcs,dr
---
@id
t10-audio
@track
t10
@title
AudioCodes pattern
@minutes
6
@why
Mediant SBCs are common in Teams designs. The pattern is still the shared gate, plus their guide.
@depends
Certification
@p1
AudioCodes documents Direct Routing for specific Mediant releases, often with their management tools beside the SBC. Use the document that matches the firmware. A 2019 forum post is not that document.
@p2
The shared gate still applies: public certificate, verified domain, three proxies, OPTIONS, media ports, a second path, and an emergency test. Their syntax is their problem. Your job is to know which gate failed.
@flow
Firmware|Certified;Their guide|Current;Shared gate|Certificate, DNS, TLS, media;Test|Inbound, outbound, failover
@chart
Shared gate
@note
Same gates for every vendor.
@bars
Name|1|Certificate;Signal|1|5061;Media|1|Ports;Health|1|OPTIONS
@lab
sbc-check
@say
I follow AudioCodes’ current guide for the firmware, and I still check the shared gate.
@fault
A forum config is pasted onto new firmware and OPTIONS never get a 200.
@listen
AudioCodes is a certified family. Use their current guide, and do not skip the shared certificate and media gates.
@sources
audiocodes,sbcs,dr
---
@id
t10-ribbon
@track
t10
@title
Ribbon pattern
@minutes
5
@why
Ribbon Core and software editions differ. The brand is not the release.
@depends
Certification
@p1
Ribbon SBCs are a normal Direct Routing choice when the edition and release are certified. Answer OPTIONS on the interface Teams will actually reach. A 200 on the management port does not count.
@p2
Same support rule: Ribbon first. Bring their show-tech equivalent and a SIP ladder with the Call-ID.
@flow
Edition|Certified release;Interface|The one Teams reaches;OPTIONS|200 on that interface;Ladder|Call-ID
@chart
What to collect
@note
Before the ticket.
@bars
Release|1|On the list;Ladder|1|Call-ID;Interface|1|Correct NIC
@lab
sbc-check
@say
I confirm the Ribbon release and the interface that answers OPTIONS.
@fault
OPTIONS are answered on the wrong interface, so Teams marks the trunk down.
@listen
For Ribbon, match the certified edition and answer OPTIONS on the signaling interface.
@sources
ribbon,dr
---
@id
t10-oracle
@track
t10
@title
Oracle Communications SBC
@minutes
5
@why
Oracle’s session border controller is a Direct Routing option only on the releases Microsoft lists.
@depends
Certification
@p1
Check the certified list for the Oracle software version, not the product family name. An unlisted release is an unsupported trunk no matter how complete the configuration looks.
@p2
Certificate name, TLS version, and early offer still apply. Oracle’s configuration model is its own language. Translate the shared gate into that language using their current guide.
@flow
Version|On the list;Guide|Oracle’s current note;TLS|Name and version;Offer|Early offer toward Teams
@chart
List versus logo
@note
The list wins.
@bars
Listed release|1|Supported;Logo only|0|Not enough
@lab
sbc-check
@say
I match the Oracle release to the certified list before I praise the config.
@fault
The config is one release below the list and Microsoft declines the case.
@listen
Oracle SBCs count only when that release is on Microsoft’s certified list.
@sources
oracle,sbcs
---
@id
t10-cube
@track
t10
@title
Cisco CUBE for Teams
@minutes
8
@why
CUBE is the usual bridge when CUCM is still in the building. It is still an SBC.
@depends
A certified IOS-XE release
@p1
Cisco Unified Border Element on a certified IOS-XE release peers TLS with the three commercial proxies, presents a certificate whose SAN matches the paired FQDN, and has dial-peers toward Teams and toward CUCM or the carrier. Teams expects early offer. A delayed-offer trunk from CUCM pushed all the way to Teams negotiates badly.
@p2
This campus does not paste a production dial-peer. Use Cisco’s current CUBE for Teams guide for the release you run. Trust the published signaling ranges rather than a single DNS answer. Offer a codec both sides share, G.711 at minimum unless you have a measured reason not to.
@flow
Cert|Name matches FQDN;Dial-peers|Teams and CUCM;Offer|Early;Codec|Intersection not empty
@chart
CUBE legs
@note
Two dial-peer directions.
@bars
Toward Teams|1|TLS to pstnhub;Toward CUCM|1|Internal trunk
@lab
cucm-map
@say
CUBE is a certified SBC with dial-peers in two directions and early offer toward Teams.
@fault
CUCM sends delayed offer all the way to Teams and calls fail with 488.
@listen
Use a certified CUBE release, early offer toward Teams, and a certificate name that matches the paired FQDN.
@sources
cube,dr
---
@id
t10-support
@track
t10
@title
The support boundary
@minutes
5
@why
Knowing who you call is part of the design.
@depends
A certified release
@p1
Collect the firmware, the paired FQDN, a ladder with Call-ID, and the OPTIONS history before you call. The vendor investigates. Microsoft may decline a case on a non-certified SBC.
@p2
Keep a screenshot of the certified list from the week you bought. A 2022 PDF in the project folder is how you discover you are unsupported during the outage.
@flow
Evidence|Firmware, FQDN, ladder;Vendor|First call;Escalate|Only if they must;List|From the week you bought
@chart
What the ticket needs
@note
Minimum evidence.
@bars
Firmware|1|Required;Call-ID|1|Required;List date|1|Required
@lab
sbc-check
@say
Vendor first, with firmware and a Call-ID. I keep the certified-list date.
@fault
The outage call starts with no logs and an unlisted build.
@listen
Open SBC tickets with the vendor, the firmware, and a Call-ID. Keep the certification evidence.
@sources
sbcs,dr
---
@id
t11-profile
@track
t11
@title
The certificate profile
@minutes
7
@why
SIP never starts if TLS fails. Dial-plan debates can wait.
@depends
A paired FQDN
@p1
Issue a certificate whose subject or SAN contains the SBC FQDN, from a CA in the Microsoft trusted root program, with server authentication EKU. Generate the CSR on the SBC. A private lab CA is how you learn the failure, not how you run production.
@p2
TLS 1.2 or newer toward the proxies. TLS 1.0 is not a compatible offer. Include the chain. An incomplete chain looks like a mysterious timeout.
@flow
CSR|On the SBC;CA|Public, trusted;EKU|Server auth;TLS|1.2 or newer
@chart
Certificate checklist
@note
All four.
@bars
Name|1|SAN;Trust|1|Public CA;EKU|1|Server auth;Version|1|TLS 1.2+
@lab
tls-hand
@say
Public CA, SAN matches the paired FQDN, server EKU, TLS 1.2 or newer.
@fault
The chain is missing and the handshake times out.
@listen
The SBC certificate must match the paired name, come from a trusted public CA, and speak TLS 1.2 or newer.
@sources
dr
---
@id
t11-name
@track
t11
@title
Names, wildcards, and the paired FQDN
@minutes
6
@why
A certificate can be valid and still be the wrong name.
@depends
The certificate profile
@p1
The name Teams checks is the FQDN you configured on the gateway. A wildcard is acceptable when it follows RFC 2818. A certificate for www.contoso.com does not cover sbc1.contoso.com.
@p2
If you add a sip subdomain, verify that domain in the tenant before you pair it. DNS must resolve publicly. Split-horizon DNS that only works inside the office will not help Microsoft’s proxies.
@flow
FQDN|Paired name;Cert|That name or a legal wildcard;DNS|Public;Domain|Verified
@chart
Name checks
@note
All must pass.
@bars
Cert name|1|Matches;DNS|1|Public;Domain|1|Verified
@lab
tls-hand
@say
The certificate name, the DNS name, and the paired FQDN are the same name.
@fault
TLS fails with a name mismatch and someone restarts the SBC instead.
@listen
The certificate, public DNS, and the paired FQDN must agree. Wildcards only help when RFC 2818 says they match.
@sources
dr
---
@id
t11-proxies
@track
t11
@title
Three SIP proxies and failover
@minutes
7
@why
The service tells the SBC which proxy is nearest and fails between them. Your firewall has to allow all of them.
@depends
TLS
@p1
Commercial clouds use sip.pstnhub.microsoft.com, sip2, and sip3, on TCP 5061. IPv6 names exist on the plan page. GCC High uses sip.pstnhub.gov.teams.microsoft.us. DoD uses sip.pstnhub.dod.teams.microsoft.us. Those government clouds do not use the commercial trio.
@p2
Checked 15 October 2026. The Direct Routing plan page lists commercial SBC signaling and media in 52.112.0.0/14 and 52.120.0.0/14. IPv6 signaling is 2603:1063:400::/40, and IPv6 media adds 2603:1063:100::/40. The Teams client optimize ranges on the Office 365 URLs article and the worldwide endpoints feed are 52.112.0.0/14 and 52.122.0.0/15, plus 2603:1063::/38. 52.120.0.0/14 does not appear on that client list, and 52.122.0.0/15 does not appear on the commercial SBC list. Allow the list that matches the traffic. Re-read both pages when you change the firewall.
@flow
Primary|sip;Secondary|sip2;Tertiary|sip3;Firewall|Ranges, not one DNS answer
@chart
Commercial proxies
@note
Priority order from the plan page.
@bars
sip|1|Primary;sip2|2|Secondary;sip3|3|Tertiary
@lab
options-health
@say
Three commercial proxies, government clouds have their own names, firewall the ranges.
@fault
The firewall allows only today’s DNS answer and the trunk fails after a resolver change.
@listen
Signal to all three commercial PSTN hubs on 5061, and allow the published IP ranges.
@sources
dr
---
@id
t11-options
@track
t11
@title
SIP OPTIONS
@minutes
6
@why
OPTIONS are how Teams decides the trunk is willing. A dial plan cannot heal a trunk that does not answer.
@depends
TLS up
@p1
Teams sends SIP OPTIONS to the SBC. The SBC should answer while it is in service. The admin center shows SBC status from that health. This campus does not pretend to know Microsoft’s private failure counter. Repeated misses are a reason to pull the trunk from the route and look at the log.
@p2
Answer on the signaling interface, not the management port. Rehearse a failure. A second gateway that has never seen an INVITE is untested.
@flow
OPTIONS|From Teams;200|From the SBC;Status|Admin center;Failover|Next gateway
@chart
Health versus routing
@note
OPTIONS first, invites second.
@bars
OPTIONS|1|Health;INVITE|2|Only if healthy
@lab
options-health
@say
I treat missed OPTIONS as a trunk problem and I look at the admin-center status beside the SBC log.
@fault
A script fails over on a single lost packet and flaps the trunk all day.
@listen
SIP OPTIONS tell you the SBC is alive. Pull a trunk that keeps missing them, and do not invent a magic counter.
@sources
dr
---
@id
t11-codecs
@track
t11
@title
Codecs and SRTP
@minutes
7
@why
An empty codec list is a 488. Missing media ports is silence after a 200.
@depends
TLS; media ports
@p1
Direct Routing lists SILK, G.711, G.722, G.729, and AMR-WB for non-bypass calls. Offer a codec both sides have. G.711 µ-law and A-law both belong if the carrier is vague. Media is SRTP. A trunk that offers only plaintext RTP is not the design.
@p2
DTMF has to survive every hop or the IVR never hears 1. Test digits through the carrier, not only Teams-to-Teams. If bypass is on, do not depend on AMR-WB.
@flow
Offer|Shared codec;SRTP|Not plaintext;DTMF|Test a digit;488|Empty intersection
@chart
Safe minimum
@note
What to offer unless you measured a reason not to.
@bars
G.711|1|Offer;SRTP|1|Required;DTMF|1|Test
@lab
tls-hand
@say
I offer G.711, I use SRTP, and I test DTMF through the carrier.
@fault
The SBC allows only a codec Teams will not use on that path, and every call is 488.
@listen
Agree a codec, keep SRTP, and prove DTMF through the SBC. AMR-WB is not a bypass codec.
@sources
dr
---
@id
t11-rehearse
@track
t11
@title
Failover you can rehearse
@minutes
6
@why
The outage should not be the first test of the second proxy or the second SBC.
@depends
OPTIONS; a second gateway
@p1
In a window, break the primary path and place a call. You want to see the next proxy or the next gateway take it, and you want emergency calls to prefer the local SBC still. Write the timestamps.
@p2
Certificate expiry is a failover you can predict. Put the date on a calendar and renew before Saturday morning becomes the test.
@flow
Window|Planned;Break|Primary only;Call|Including a test emergency path;Restore|Then write it down
@chart
Rehearsal result
@note
What to record.
@bars
Next gateway took the call|1|Yes or the design failed;Emergency stayed local|1|Required;Cert date|1|Known
@lab
dr-path
@say
I rehearse failover and I know the certificate expiry date.
@fault
The second SBC has never received a call, and the certificate expires on a Saturday.
@listen
Rehearse the second gateway, and renew the certificate before it expires.
@sources
dr
---
@id
t12-hypothesis
@track
t12
@title
One hypothesis
@minutes
6
@why
Bundled changes teach nothing and make rollback impossible.
@depends
A symptom you can describe
@p1
Write one sentence: what you think is wrong, what you will change, what evidence would prove it. Change that thing. Collect the same Call-ID style evidence again. Then decide.
@p2
A reboot plus a dial-plan edit plus a firewall change is how an outage ends with no one knowing why. The evidence pack is the Call-ID, the effective policy, the ladder, and the CQD or Call Analytics row that matches the scope.
@flow
Sentence|Hypothesis;Change|One;Evidence|Same capture;Decide|Keep or roll back
@chart
Pack contents
@note
Four things.
@bars
Call-ID|1|Join key;Policy|1|Effective;Ladder|1|SIP;Quality|1|The right tool
@lab

@say
One hypothesis, one change, one evidence pack.
@fault
Three vendors change three boxes and the call works for an unknown reason.
@listen
Change one thing at a time, and keep the Call-ID with the result.
@sources
calla,cqd
---
@id
t12-ladder
@track
t12
@title
Reading a ladder
@minutes
8
@why
The response code is the branch. A story without codes is not a diagnosis.
@depends
A capture
@p1
Order the messages. INVITE, 100, 180 or 183, 200, ACK, then later BYE. 183 is early media, not an answer. 488 means the SDP was refused. 408 means something did not answer in time. 503 means the hop is refusing service. 487 often means the caller cancelled.
@p2
Join on Call-ID. Two calls that start in the same second are not the same call. Read the first non-success on the hop that sent it, then stop. Do not restart a healthy SBC because a 180 felt slow.
@flow
Call-ID|One dialog;Order|Request then response;Code|First failure;Hop|Who sent it
@chart
Codes worth knowing
@note
Not a full SIP catalog.
@bars
180|1|Alerting;183|1|Early media;488|2|SDP;503|2|Unavailable
@lab
dr-path
@say
I read the first failing response on one Call-ID.
@fault
Two captures are compared and they are different calls.
@listen
Follow one Call-ID. 183 is not an answer. 488 is codecs. 503 is a hop refusing work.
@sources
dr
---
@id
t12-analytics
@track
t12
@title
Call Analytics
@minutes
6
@why
One user, one call. That is the scope of this tool.
@depends
A support role that can open it
@p1
Call Analytics shows the streams of a user’s call: jitter, loss, round-trip, and the client. Use it when one person suffered and the building did not. The Teams Communications Support Engineer role is the troubleshooting role people usually mean here. Check the current role article.
@p2
A building-wide problem hunted one user at a time will take a week. Switch tools when the scope changes.
@flow
Scope|One user;Open|That call;Read|Loss, jitter, RTT;Stop|If the building is the story
@chart
Scope
@note
Pick the tool that matches.
@bars
One call|1|Call Analytics;A building|2|CQD
@lab
cqd-fault
@say
Call Analytics is one call. I will not use it to explain a subnet.
@fault
A site problem is debugged as twenty separate user tickets.
@listen
Use Call Analytics for one user’s call. Use CQD when the building is the question.
@sources
calla
---
@id
t12-cqd
@track
t12
@title
Call Quality Dashboard
@minutes
8
@why
CQD is how you see a subnet. It is only as honest as the building map.
@depends
Subnets that mean something
@p1
CQD aggregates streams by dimensions such as subnet and user agent. Separate jitter, loss, and round-trip in your head. High jitter with DSCP 0 suggests a mark that never survived. High loss with EF still set suggests a congested or dirty link. Long RTT with almost no loss suggests distance or a hairpin.
@p2
If the VPN pool is labeled headquarters, headquarters looks terrible and the real LAN is fine. Fix the map before you present the dashboard. Power BI on top of CQD inherits the same map.
@flow
Map|Subnets to buildings;Report|The poor streams;Split|Loss versus RTT versus marks;Act|On the path, not the logo
@chart
How to read a bad stream
@note
Different shapes, different faults.
@bars
Loss with EF|2|Link;Jitter with DSCP 0|2|Mark or VPN;Long RTT|2|Path length
@lab
cqd-fault
@say
I split loss, jitter, and RTT, and I trust CQD only after I trust the subnet map.
@fault
HQ is red because the VPN pool was typed in as HQ.
@listen
CQD is the building view. Split loss, jitter, and delay, and fix the subnet map first.
@sources
cqd,qos
---
@id
t12-trunk
@track
t12
@title
Trunk health
@minutes
6
@why
A down trunk is not a dial-plan problem.
@depends
OPTIONS; the admin center
@p1
Look at SBC status in the Teams admin center and at the SBC’s OPTIONS log. If TLS failed, stop. Certificate name, expiry, and chain come before regex. If OPTIONS succeed and one number fails, then you have earned the right to open the dial plan.
@p2
SIP Tester language shows up in operations chatter. Use the health view and a real test call. Do not invent a hidden tester result you did not run.
@flow
TLS|Up;OPTIONS|Answered;Status|Admin center;Then|A single test call
@chart
Order of looks
@note
Do not start at the dial plan.
@bars
TLS|1|First;OPTIONS|2|Second;Route|3|Third
@lab
options-health
@say
I check TLS and OPTIONS before I touch a normalization rule.
@fault
The dial plan is rewritten while the certificate is expired.
@listen
Trunk health first: certificate, OPTIONS, admin-center status. Then the dial plan.
@sources
dr
---
@id
t12-catalog
@track
t12
@title
A fault catalog
@minutes
7
@why
Naming the fault is the skill. The tools are how you prove the name.
@depends
The earlier troubleshooting lessons
@p1
Silence after 200 is media ports or SRTP. 488 is codecs. A single remote user with DSCP 0 is often the VPN. A building with loss and EF intact is the link. A number that never leaves Teams is normalization or policy. A queue that does not answer is a resource account, agents, or overflow.
@p2
Emergency failures are their own catalog: wrong route, missing location, stripped PIDF-LO, notification not assigned. Do not file them under ‘audio quality.’
@flow
Symptom|One sentence;Catalog|Which family;Evidence|The matching tool;Fix|One change
@chart
Families
@note
Start here.
@bars
Signaling|1|Codes;Media|2|Ports and SRTP;Policy|3|Route or license;Location|4|Emergency
@lab
cqd-fault
@say
I can sort a symptom into signaling, media, policy, or location before I pick a tool.
@fault
Every ticket is labeled ‘Teams down’ and none of them are the same fault.
@listen
Sort the fault first: signaling, media, policy, or emergency location. Then open the matching tool.
@sources
dr,cqd,emerg
---
@id
t13-what
@track
t13
@title
Customer Service and Contact Center
@minutes
8
@why
Dynamics 365 Contact Center is Microsoft’s CCaaS. Customer Service is not automatically that product.
@depends
A tenant; a reason to have a queue of strangers
@p1
Dynamics 365 Contact Center can stand alone or embed with Customer Service. Voice in that product uses Azure Communication Services. An auto attendant in Teams is not this product. A trial click-path is not a design: emergency calling, recording, and a busy hour are still gates.
@p2
AB-250 is the exam that matches this work. MB-280 was a Sales and Customer Insights exam and it retired on 31 July 2026. Do not revise the wrong guide.
@flow
Product|Contact Center;Mode|Standalone or embedded;Voice|ACS under it;Exam|AB-250
@chart
Do not confuse these
@note
Different products.
@bars
Teams attendant|1|Voice app;Contact Center|2|CCaaS;MB-280|0|Retired, wrong scope
@lab

@say
Contact Center is the CCaaS. A Teams auto attendant is not. AB-250 is the exam. MB-280 is retired and was the wrong scope anyway.
@fault
A pilot turns on Copilot and never defines a queue.
@listen
Dynamics 365 Contact Center is the contact-center product. Do not call a Teams auto attendant by that name.
@sources
d365,ab250,retire
---
@id
t13-channels
@track
t13
@title
Channels
@minutes
7
@why
AB-250 weights channel implementation at about 30 to 35 percent, the largest published slice.
@depends
A contact-center environment
@p1
Voice, chat, and the other channels are the job. The study guide’s channel section is larger than the agent-and-AI section. Spend the hours there. Voice still needs numbers, a workstream, and a human path.
@p2
Proactive outbound and real-time translation exist as channel behaviors. Outbound needs consent and a caller ID you mean to present. Translation does not replace a human language queue when policy requires one.
@flow
Channel|Voice or chat or another;Workstream|Intake;Number|If voice;Human|Always reachable
@chart
AB-250 low end of published ranges
@note
Study guide accessed 14 October 2026. Each range is wider than the bar.
@bars
Channels|30|30–35%;Deploy|15|15–20%;Rep experience|15|15–20%;Others|10|10–15% each
@lab

@say
Channels are the largest AB-250 slice. I will not only study Copilot.
@fault
A candidate can describe Copilot and cannot trace a voice channel.
@listen
On AB-250, channel implementation is the largest skill group. Learn the voice channel, not only the assistant.
@sources
ab250,d365
---
@id
t13-routing
@track
t13
@title
Unified routing
@minutes
8
@why
Work items do not magically find experts. Classification and capacity do that, or fail to.
@depends
A workstream
@p1
A workstream takes the item in. Classification sets language, intent, or priority. Queues hold the items. Assignment uses skills, capacity, and presence-like availability. A French billing item should not land in a general English queue because you forgot the rule.
@p2
Skills must exist on the representatives, not only on a slide. If every item requires a skill nobody has, the queue never assigns. Unknown intent needs a default human queue, not a retry loop.
@flow
Intake|Workstream;Classify|Skills and intent;Queue|Match;Assign|Capacity
@chart
Objects
@note
Order.
@bars
Workstream|1|Intake;Classification|2|Rules;Queue|3|Holding;Assignment|4|People
@lab
routing-designer
@say
Workstream, classification, queue, assignment. Unknown intent has a human default.
@fault
French callers reach the English queue, or every item waits for a skill nobody has.
@listen
Unified routing classifies a work item, then assigns it to someone with capacity. Give unknown a human queue.
@sources
ab250,d365
---
@id
t13-rep
@track
t13
@title
Representative experience and Copilot
@minutes
7
@why
The person answering needs a console, a role, and assistance that quotes sources you trust.
@depends
Queues; security roles
@p1
AB-250 calls this the representative experience: presence in the product, the session, productivity tools, and Copilot assists such as summaries. A user who can open the app and belongs to no queue is not a representative yet.
@p2
Copilot that summarizes the wrong case, or quotes a stale article, is worse than silence. Connect knowledge sources you stand behind. The assist is not the PSTN route and not the emergency path.
@flow
Role|Security;Queue|Membership;Capacity|Profile;Copilot|Sources you trust
@chart
Representative readiness
@note
Checks.
@bars
Role|1|Can work;Queue|1|Member;Sources|1|For Copilot
@lab

@say
Copilot assists the representative. It is not the route, and its sources have to be true.
@fault
The agent sends a Copilot reply from a retired price list.
@listen
Give representatives a role, a queue, and Copilot sources you are willing to defend.
@sources
ab250,d365
---
@id
t13-voice
@track
t13
@title
Voice on ACS
@minutes
7
@why
The contact-center voice channel is not a Teams call queue with a different logo.
@depends
Contact Center; numbers
@p1
Dynamics 365 Contact Center voice is built with Azure Communication Services. Teams Phone extensibility lets some of those designs reuse the customer’s Teams Phone investment so the agent is not on a second phone system. The Tech Community post names that direction. Confirm the current setup guide before you promise it.
@p2
Transfers to a Teams expert still need that expert to be a real Teams Phone user with a number, in the Connect model’s own wording. Do not assume the contact-center license covered them.
@flow
Numbers|Voice channel;ACS|Under the channel;Extensibility|Optional Teams Phone reuse;Expert|Licensed if transferred
@chart
Two phone systems or one
@note
Extensibility is how you avoid two.
@bars
Separate PBX|2|Avoid if you can;Teams Phone extensibility|1|When certified for it
@lab
acs-flow
@say
Contact Center voice runs on ACS. Teams Phone extensibility is how you avoid a second phone, when the design is actually certified for it.
@fault
Two phones ring the same agent.
@listen
Contact-center voice uses ACS. Use Teams Phone extensibility only when that design is the one you bought.
@sources
d365,acs,tpe,tpeblog
---
@id
t13-exam
@track
t13
@title
The AB-250 map
@minutes
6
@why
The published weights tell you where to spend the week.
@depends
The product lessons
@p1
As of the study guide accessed 14 October 2026, the skills are deploy 15–20, channels 30–35, agents and AI 10–15, work distribution 10–15, representative experience 15–20, and analytics 10–15. Passing score is 700. The public page allows 120 minutes.
@p2
The beta discount ran through 18 June 2026. Treat the exam as the live contact-center certification and confirm the seat on Learn the week you book. Practice tests for MB-280 will not prepare you.
@flow
Guide|Current weights;Channels|Largest slice;Practice|Official if it exists;Book|After you re-read the guide
@chart
Low end of each published range
@note
Ranges are wider. Accessed 14 October 2026.
@bars
Deploy|15|15–20;Channels|30|30–35;Agents|10|10–15;Distribution|10|10–15;Rep|15|15–20;Analytics|10|10–15
@lab
exam-map
@say
AB-250, 700 to pass, channels are the biggest slice, MB-280 practice tests are the wrong pile.
@fault
A study plan is a folder of MB-280 questions.
@listen
AB-250 is the contact-center exam. Spend the most time on channels, and confirm the guide before you book.
@sources
ab250,ab250c,ab250blog
---
@id
t14-models
@track
t14
@title
Connect, Extend, and Unify
@minutes
8
@why
The model decides the media path and the licenses. The sales adjective does not.
@depends
Teams Phone; a vendor
@p1
Microsoft Learn, accessed 14 October 2026, names three models. Connect uses certified SBCs and Direct Routing. Extend uses the Teams client, Graph, and Cloud Communications APIs, with Teams Phone as the calling system. Unify is the native model. Partner text describes Unify as ACS-based applications on Teams calling infrastructure. Older decks say Power. Ask which current model the vendor holds.
@p2
In the Connect article, the contact-center agent does not need a phone-system license for that solution. A Teams user who receives a transfer does need Teams Phone and a number. Graph is not a SIP trunk. You still need a PSTN option.
@flow
Ask|Which model;Media|SBC, client, or ACS;License|Follows the model;Letter|Certification, current
@chart
Three models
@note
Names on Learn, 14 October 2026.
@bars
Connect|1|SBC;Extend|2|Teams client;Unify|3|Native, ACS-based in partner text
@lab
integrate-map
@say
I use Connect, Extend, and Unify. If someone says Power, I ask which current model they mean.
@fault
The contract says Power and nobody opens the right ports.
@listen
Name the model: Connect, Extend, or Unify. The media path and the licenses follow that name.
@sources
cc,tpe
---
@id
t14-ext
@track
t14
@title
Teams Phone extensibility
@minutes
6
@why
It is how a contact center uses the Teams Phone you already paid for, instead of a second PBX.
@depends
The model; Teams Phone
@p1
Teams Phone extensibility, documented for ACS and announced for Dynamics 365 Contact Center and some Unify-certified ISVs, lets the agent’s telephony be Teams Phone. The announcement named a set of vendors. That set moves. Certification is still the bar if you want the supported experience. An API existing is not a finished certification.
@p2
Presence can be synced with Graph. Presence sync is not audio. Do not declare the integration done because a status bubble moves.
@flow
Teams Phone|Already there;ISV|Certified for extensibility;Agent|One phone;Presence|Extra, not sufficient
@chart
Done means audio
@note
Presence is not the phone call.
@bars
Presence sync|1|Not enough;Voice path|2|The point
@lab
integrate-map
@say
Extensibility reuses Teams Phone. I want the vendor’s current certification, not only a presence sync.
@fault
Two phones ring the same person, or only presence works.
@listen
Teams Phone extensibility reuses Teams calling inside a certified contact center. Presence sync is not the audio path.
@sources
tpe,tpeblog,cc
---
@id
t14-cucm
@track
t14
@title
CUCM and CUBE
@minutes
8
@why
Most Teams migrations in a Cisco estate are a dual-run, not a weekend miracle.
@depends
CUBE; numbering
@p1
A calling search space is closest to a voice routing policy’s ordered usages, and it is not a one-to-one object. A translation pattern is closest to a dial-plan rule. A route pattern is closest to a voice route. There is no partition object in Teams. Pick one system to normalize numbers.
@p2
Calls from people still on CUCM to people now on Teams trombone through CUBE. That is normal during dual-running and expensive as a steady state. Move groups that call each other in the same wave. Keep the old route until rollback is boring.
@flow
Map|CSS to policy, translation to dial plan;One owner|Normalization;Dual-run|Trombone expected;Rollback|Old route still there
@chart
CUCM ideas, loosely
@note
Not one-to-one. The lab says the gap.
@bars
CSS|1|Policy plus usages;Translation|2|Dial plan;Route pattern|3|Voice route;Partition|0|No Teams object
@lab
cucm-map
@say
One normalization owner. Tromboning is temporary. Rollback keeps the old trunk.
@fault
Both systems add +44, or the old trunk is deleted on Friday.
@listen
Translate CUCM ideas carefully, normalize in one place, and keep the old route until the new path is quiet.
@sources
cube,dial,route
---
@id
t14-webex
@track
t14
@title
Webex calling interop
@minutes
6
@why
A split estate needs a voice bridge. Chat federation is a different project.
@depends
An SBC; a numbering plan
@p1
A SIP trunk through a local gateway or CUBE can carry calls between Webex Calling users and Teams users. Treat it as coexistence with one numbering plan. Two dial plans that both own a range will fail in both directions.
@p2
Do not describe that trunk as a merger, and do not assume meeting interop came along for free. Write which numbers remain on Webex and for how long.
@flow
Ranges|Who owns which;Trunk|SBC between them;Normalize|One owner;End date|When the split stops
@chart
Split
@note
Example, not a customer.
@bars
Teams ranges|1|Named;Webex ranges|1|Named;Shared confusion|0|Avoid
@lab
coexist
@say
Webex voice interop is a SIP bridge and a numbering plan, not a chat project.
@fault
Both clouds believe they own the same range.
@listen
Bridge Webex Calling and Teams with an SBC and one numbering owner. Keep chat interop as a separate decision.
@sources
cube,pstn
---
@id
t14-ucce
@track
t14
@title
UCCE during a move
@minutes
6
@why
Contact-center agents and knowledge workers should not be forced through the same weekend.
@depends
CUBE; number ranges
@p1
Leave UCCE agents on CVP and Finesse while knowledge workers move to Teams. The SBC sends contact-center numbers to CUCM and user numbers to Teams. A Teams client does not keep a CVP script in control of that agent.
@p2
Test a transfer from the contact center to an expert who now lives on Teams. That expert needs Teams Phone and a number. Then schedule the agent migration as its own project, with the certified contact-center model you actually bought.
@flow
IVR|Stays for now;Users|Move;SBC|Splits by range;Expert|Licensed on Teams
@chart
Who moves first
@note
A common safe order.
@bars
Knowledge workers|1|Earlier;UCCE agents|2|Later, as a project
@lab
coexist
@say
I do not put UCCE agents on Teams and expect CVP to keep controlling them.
@fault
Agents move first and the IVR can no longer see them.
@listen
Move knowledge workers first if UCCE must stay. Split the dial plan by range, and license experts who receive transfers.
@sources
cube,cc
---
@id
t14-others
@track
t14
@title
Genesys and Amazon Connect
@minutes
7
@why
Both appear in real estates. Neither is ‘a Microsoft feature’ you can assume.
@depends
The three models; an SBC habit
@p1
Genesys sells Teams integrations. Ask which certification model they currently hold, because Connect, Extend, and Unify change the media path. A statement of work that says ‘certified’ and does not name the model is incomplete.
@p2
Amazon Connect is often bridged with SIP through an SBC or a voice connector. Design the path and the Call-ID you will store. If both platforms record, you still need one identifier that joins them. Confirm the current vendor document before you promise whisper, barge, or a particular recording mode.
@flow
Vendor|Named model or SIP bridge;Media|Drawn;Call-ID|Stored;Recording|One place you can find
@chart
What to demand
@note
Before the design is accepted.
@bars
Model name|1|Required;Diagram|1|Required;Join key|1|Required
@lab
integrate-map
@say
I ask Genesys which model, and I draw the SIP path for Amazon Connect. I store a Call-ID either way.
@fault
Both platforms record and neither capture has the Call-ID.
@listen
Name the Genesys certification model. Draw the Amazon Connect SIP path. Keep a join key.
@sources
cc,dr
---
@id
t15-auto
@track
t15
@title
Calling SDK versus Call Automation
@minutes
7
@why
One is a person in a browser. The other is your service answering the call.
@depends
ACS concepts
@p1
The Calling SDK is the client for a human on a web or mobile page. Call Automation is the server API that answers, plays, recognizes, and transfers, and then receives events. A page that only uses the client SDK will not run an IVR.
@p2
If your app never sees the events, the call can be up while your code is asleep. Log the event type and the call id. Event Grid is one delivery path. A missed subscription looks like a broken prompt.
@flow
Human on a page|Calling SDK;Bot answers|Call Automation;Events|Delivered to you;Logs|Call id
@chart
Pick one primary
@note
You may use both, for different jobs.
@bars
SDK|1|Human client;Automation|2|Server IVR
@lab
acs-flow
@say
Call Automation is the server-side IVR. The Calling SDK is a person in the browser.
@fault
The app never answers, so the caller hears ringing until the platform gives up.
@listen
Use Call Automation when a bot answers, and make sure the events actually reach your app.
@sources
acs
---
@id
t15-interop
@track
t15
@title
Teams interop from ACS
@minutes
6
@why
A bot that can dial the PSTN and cannot reach a Teams expert is half an IVR.
@depends
Call Automation; Teams users
@p1
ACS can be configured to call Teams users and to join Teams meetings when the interop prerequisites are met. A raw ACS identity is not a Teams user. Follow the current interop article for the resource you created.
@p2
The transfer target still needs to be able to receive the call. In a Teams estate that means Teams Phone and a number when the call is PSTN. Test the transfer, not only the prompt.
@flow
Resource|ACS;Interop|Prerequisites;Target|Teams user who can answer;Test|Transfer
@chart
Interop is extra setup
@note
Not implied by owning both products.
@bars
ACS call|1|Your app;Teams target|2|Configured interop
@lab
acs-flow
@say
ACS does not automatically become a Teams user. I follow the interop article and I test the transfer.
@fault
The bot dials the PSTN and cannot transfer to a Teams expert.
@listen
Set up ACS and Teams interop on purpose, then test a transfer to a real Teams user.
@sources
acs,tpe
---
@id
t15-events
@track
t15
@title
An IVR as events
@minutes
7
@why
The call is a sequence of events. If you cannot name them, you cannot debug them.
@depends
Call Automation
@p1
A small flow is answer, play, recognize DTMF or speech, then transfer or hang up. Recognize needs a timeout. Digit 0, or an equivalent, should always reach a human. Hang-up is a complete design only when the caller did not need a person.
@p2
The lab on this campus is that sequence without a cloud subscription. Production adds the event subscription, the speech resource if you use one, and the queue you transfer to.
@flow
Answer|CallConnected;Play|Prompt;Recognize|Digit or speech;Transfer|Human queue
@chart
Minimum safe IVR
@note
Escape included.
@bars
Answer|1|Required;Recognize|2|With timeout;Escape|3|Tested
@lab
acs-flow
@say
Answer, play, recognize, transfer. The escape is tested every time the prompt changes.
@fault
The recognize step has no escape and the caller is trapped.
@listen
Treat the IVR as events: answer, play, recognize, and a tested transfer to a human.
@sources
acs,copilot
---
@id
t15-speech
@track
t15
@title
Azure AI Speech
@minutes
6
@why
Speech-to-text and text-to-speech are services with their own language, voice, and approval rules.
@depends
A recognize or play step
@p1
Azure AI Speech can transcribe the caller and synthesize the prompt. The language of the prompt has to match the caller or every intent becomes unknown. A custom neural voice has approval rules. Do not assume you can clone a person.
@p2
Log the recognition result beside the call id. When the bot is wrong, you need the text it thought it heard, not a feeling.
@flow
Voice|One you may use;Language|Matches the caller;Result|Logged;Fallback|Human
@chart
Speech is not the phone system
@note
It plugs into the recognize step.
@bars
TTS|1|Prompt;STT|1|Recognize;PSTN|0|Not this service
@lab
ivr-intent
@say
I pick a voice I am allowed to use, match the language, and log what the recognizer heard.
@fault
The prompt language does not match the caller and every intent is unknown.
@listen
Azure AI Speech can talk and listen. It is not emergency calling, and you log what it thought it heard.
@sources
speech
---
@id
t15-studio
@track
t15
@title
Copilot Studio voice
@minutes
7
@why
The agent people mean is often a Copilot Studio bot on the contact-center voice channel.
@depends
A human escape; knowledge sources
@p1
Classic topics are a menu you can test. Generative orchestration chooses a path and needs tighter bounds. Either way, ground the bot in knowledge sources you trust, and keep a human escape that does not depend on the model feeling cooperative.
@p2
Do not put this bot on the emergency number. Do not make it the only target of the public number unless overflow to a queue is real and tested. A keyword lab on this campus is a stand-in, not a model call.
@flow
Sources|Trusted;Topics or generative|Pick with eyes open;Escape|DTMF 0;Queue|Staffed
@chart
Bot readiness
@note
All three.
@bars
Sources|1|Grounded;Escape|1|Tested;Queue|1|Exists
@lab
ivr-intent
@say
The voice agent has sources I trust and an escape I tested. It does not own emergency calls.
@fault
The agent is the only target of the public number, including emergencies.
@listen
Copilot Studio can front the voice channel if it is grounded and can always reach a human. Keep it off the emergency route.
@sources
copilot,d365
---
@id
t15-foundry
@track
t15
@title
Foundry, and what not to invent
@minutes
6
@why
Azure AI Foundry is where you evaluate a model. It does not route PSTN, and it used to be called Azure AI Studio.
@depends
A test set
@p1
Use Foundry, or the current Azure AI project experience, to evaluate prompts against questions whose answers you already know. A model change that ships to a phone number without an evaluation is an outage you chose.
@p2
Do not invent unannounced voice features. A future hook in this campus is a seam you can build today: an event, an identifier, a queue overflow. It is not a rumor about a product roadmap.
@flow
Test set|Known answers;Eval|Before publish;Ship|To a queue that can overflow;Rumor|Not a design
@chart
What Foundry is for
@note
Evaluation, not dial tone.
@bars
Eval|2|Yes;PSTN routing|0|No
@lab
ivr-intent
@say
I evaluate the model before it touches a phone number, and I do not design around unannounced features.
@fault
A prompt change reaches the IVR on Friday with no test set.
@listen
Use Azure AI Foundry to evaluate a model. Do not pretend it is a phone system, and do not invent roadmap items.
@sources
foundry,copilot
---
@id
t16-ms700
@track
t16
@title
MS-700 on 14 October 2026
@minutes
7
@why
MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement.
@depends
The voice tracks; meetings and network objectives too
@p1
MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. Microsoft 365 Certified: Teams Administrator Associate is earned with MS-700. The certification page, checked for this campus on 14 October 2026, does not name a successor. Third-party claims that an MS-220 collaboration exam replaced it are not what Learn showed on that date.
@p2
The exam includes network planning and call-quality troubleshooting, not only meetings. Passing score is 700. Role certifications also expire unless you pass the free renewal. Expiry is not the same event as Microsoft retiring the exam.
@flow
Guide|Current, again before the 27 Oct update;Network|In scope;Quality|In scope;Renew|Separate calendar
@chart
Status
@note
As checked 14 October 2026.
@bars
Live|3|Yes;Retired|0|No evidence on Learn
@lab
exam-map
@say
MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement.
@fault
A candidate skips networking because they think the exam is only meetings.
@listen
MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. Re-read the guide before you book, especially after Oct 27 2026.
@sources
ms700,ms700c
---
@id
t16-mb
@track
t16
@title
MB-280, AB-210, and AB-250
@minutes
8
@why
These three numbers get swapped in job posts. Only one of them is the contact-center exam.
@depends
The contact-center track
@p1
MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta. MB-280, Dynamics 365 Customer Experience Analyst, was Sales and Customer Insights, not Contact Center. AB-210 is Dynamics 365 Sales AI Consultant. It does not replace MS-700.
@p2
AB-250 is Transforming Contact Center Experiences with AI in Dynamics 365. That is the contact-center certification. A study plan that points a queue engineer at AB-210 is the wrong pile of work.
@flow
Role|Sales or contact center;Sales|AB-210;Contact center|AB-250;MB-280|History only
@chart
Where to send a candidate
@note
Checked 14 October 2026.
@bars
AB-250|3|Contact center, live target;AB-210|2|In beta, successor to MB-280;MB-280|0|Retired Jul 31 2026
@lab
exam-map
@say
MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta. AB-250 is the contact-center exam.
@fault
A job post requires MB-280 after the retirement date, or a contact-center candidate studies AB-210.
@listen
MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta. AB-250 is the contact-center exam. AB-210 does not replace MS-700.
@sources
retire,partner,ab250,mb280
---
@id
t16-fund
@track
t16
@title
AZ-900 and SC-900
@minutes
6
@why
Fundamentals help with Azure and identity vocabulary. They do not make you a voice engineer.
@depends
Honesty about what an exam covers
@p1
AZ-900, Azure Fundamentals, was not on the retirement list reviewed on 14 October 2026. SC-900, Security, Compliance, and Identity Fundamentals, is live and the English certification is scheduled to update on 21 October 2026. MS-900 retired on 31 March 2026. AI-900 retired on 30 June 2026.
@p2
Use AZ-900 if you need Azure words for ACS and Speech. Use SC-900 if you need Entra and compliance words for Conditional Access and recording’s trust boundary. Neither one replaces MS-700 or AB-250.
@flow
AZ-900|Azure words;SC-900|Identity and compliance words;MS-900|Do not book;Role exams|Still required
@chart
Fundamentals status
@note
3 live, 1 retired. Not difficulty.
@bars
AZ-900|3|Live;SC-900|3|Live, update 21 Oct 2026;MS-900|1|Retired 31 Mar 2026;AI-900|1|Retired 30 Jun 2026
@lab
exam-map
@say
AZ-900 and SC-900 are context. MS-900 and AI-900 are retired. The role exams still matter.
@fault
A voice design is accepted because someone passed AZ-900.
@listen
AZ-900 and SC-900 are optional context. They are not the voice exam or the contact-center exam.
@sources
az900,sc900,retire
---
@id
t16-paths
@track
t16
@title
Learning paths that match the job
@minutes
6
@why
A random trail of modules will not assemble a dial plan in your head.
@depends
The track order of this campus
@p1
Follow the same order as this campus: tenant and licenses, network, connectivity, routing, voice apps, emergency, SBC, then the contact center. Microsoft Learn modules exist for Teams Phone, Direct Routing, QoS, and the AB-250 course family. Use them as the official wording beside these notes.
@p2
When a module and this page disagree, the module accessed the week you need it wins. This page was checked on 14 October 2026.
@flow
Foundations|First;PSTN and routing|Next;Emergency and SBC|Before production;Contact center|After the phone system is real
@chart
Study order
@note
Same as the track list.
@bars
Foundation|1|Start;Voice|2|Middle;Ecosystem|3|After the call works
@lab

@say
I study foundations, then the phone system, then the contact center. I re-read Learn when I am about to change production.
@fault
Someone starts with a bot and has no emergency route.
@listen
Learn the tenant, the network, and the PSTN path before the bot. Re-check Learn before you change production.
@sources
phone,ms700,ab250
---
@id
t16-board
@track
t16
@title
The status board
@minutes
6
@why
Dates are the part that makes a certification answer true or false.
@depends
The exam lessons
@p1
MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta. Also on the board: MS-900 retired 31 March 2026, AI-900 retired 30 June 2026, AB-250’s public beta discount ran through 18 June 2026, and SC-900’s English update is scheduled for 21 October 2026. Microsoft 365 Administrator Expert is scheduled to retire on 30 November 2026, which is not the Teams voice exam.
@p2
This is a status board, not a product-release myth. Direct Routing’s current proxies and ports come from the plan page, not from a memory of a launch year.
@flow
Read|The date;Check|Learn that week;Ignore|Undated blogs;Book|Then
@chart
Dates to remember
@note
Calendar facts checked 14 October 2026.
@bars
MB-280 end|7|31 Jul 2026;SC-900 update|10|21 Oct 2026;MS-700 update|10|27 Oct 2026
@lab
exam-map
@say
MS-700 is still live, with a skills update on Oct 27 2026; it is NOT retired and has no replacement. MB-280 retired Jul 31 2026, with AB-210 as its successor; AB-210 is in beta.
@fault
An undated blog retires MS-700 and the candidate believes it.
@listen
Quote certification dates and the day you checked Learn. This campus was checked on 14 October 2026.
@sources
retire,ms700,sc900,partner
---
@id
t16-ready
@track
t16
@title
How to use the readiness map
@minutes
5
@why
A self-rating is useful only if a low score points at a lesson.
@depends
The status board
@p1
Rate yourself 0 to 3 on the live exams. Anything under 2 on MS-700, AB-250, AZ-900, or SC-900 is a study target, not a personality result. AB-210 is a target only if the job is Sales. MB-280, MS-900, and AI-900 are not targets.
@p2
The rating stays in this browser. It is not an account and not a certificate. Book the exam only after you re-open the study guide.
@flow
Rate|0 to 3;Gap|Under 2 on a live exam;Lesson|The matching track;Guide|Re-read, then book
@chart
What a 2 means
@note
Your rating, not a score from Microsoft.
@bars
0|0|Have not studied;2|2|Can explain without notes;3|3|Can teach the fault
@lab
exam-map
@say
A readiness score is mine, in this browser, and the study guide still wins.
@fault
Someone books the exam because a slider felt high.
@listen
Use the readiness map to find gaps. Then re-read the official study guide before you schedule anything.
@sources
ms700,ab250
---
@id
t17-why
@track
t17
@title
Voice is not a closed box
@minutes
7
@why
The call is not finished when it rings. Recording, staffing, location, analytics, CRM, and agents are part of the same job.
@depends
Emergency; CQD; contact center; coexistence; ACS
@p1
Teams Phone gets a number to a person or a voice app. Around that call sit Cloud Voicemail, emergency location, a certified recorder, a queue’s interval stats, a CRM case, and sometimes a bot. Each of those is a sister system with its own configuration and its own failure.
@p2
This track is the map of those systems. It does not replace the earlier tracks. If the trunk is down, the CRM pop is not the lead.
@flow
Call|Teams or Contact Center;Sisters|Recording, WFM, E911, analytics, CRM, agent;Join|Call-ID or E.164;Lead|The system that actually failed
@chart
Sister systems
@note
They attach. They are not Teams Phone.
@bars
Recording|1|Policy;WFM|1|Intervals;E911|1|Location;Analytics|1|CQD;CRM|1|Case;Agent|1|With escape
@lab
integrate-map
@say
I can name the sister system and the identifier that joins it to the call.
@fault
A CRM bug is debugged as an SBC outage, or the reverse.
@listen
The ecosystem is everything attached to the call. Name the system, then the join key, then the fault.
@sources
rec,cqd,emerg,d365
---
@id
t17-glossary
@track
t17
@title
How to use the glossary
@minutes
5
@why
The glossary is the shared language for the map. Interviews punish fuzzy words.
@depends
The rest of the campus
@p1
Each term has a plain definition, a reason it matters, a configuration hint, and a fault you should recognize. Filter by track. If a definition and a vendor blog disagree, open the source link. The access date is 14 October 2026.
@p2
Flashcards are the same facts in recall form. Do not treat a card you flipped once as evidence you can operate the system. The lab is that evidence.
@flow
Term|Plain words;Fault|The symptom;Source|The link;Lab|Prove it
@chart
What a glossary row holds
@note
Four fields.
@bars
Plain|1|What it is;Why|1|The point;Config|1|What you set;Fault|1|How it fails
@lab

@say
I can define the term, the fault, and the document I would open.
@fault
Two people use ‘recording’ and mean convenience and compliance.
@listen
Use the glossary to keep words sharp. Recording, for example, is two different features.
@sources
rec,dr
---
@id
t17-map
@track
t17
@title
The mind map
@minutes
6
@why
A picture of the estate stops you from buying a second phone system by accident.
@depends
The track list
@p1
The map puts Entra ID and Cloud Voicemail beside Teams Phone, the dial plan in front of routing, the SBC between Teams and the carrier, and emergency location on that SBC path. Attendants, Dynamics, ACS, Copilot Studio, recording, WFM, Power BI, and the CRM sit on named edges.
@p2
Click a node in the map view. The edge label is the thing that has to be true: user homed online, TLS 5061, a licensed resource account, a policy bot, queue intervals. If you cannot point at the edge, you do not understand the integration.
@flow
Center|Teams Phone;Left|Identity, recording, CRM, bot;Right|SBC, carrier, CUCM;Below|Contact center, WFM, analytics
@chart
Edges are requirements
@note
The label is the dependency.
@bars
Identity|1|Homed online;Trunk|1|TLS;Recorder|1|Policy;Case|1|E.164 and Call-ID
@lab
integrate-map
@say
I can draw Teams, the SBC, the carrier, and the six sister systems without notes.
@fault
A design has no picture, so recording and E911 are discovered after go-live.
@listen
Use the mind map. Every edge is a requirement, not decoration.
@sources
dr,cc,rec
---
@id
t17-rec
@track
t17
@title
Compliance recording and quality management
@minutes
9
@why
Regulated desks need a recorder the user cannot stop. Convenience recording is not that recorder.
@depends
A certified partner; PowerShell
@p1
Convenience recording is started by a licensed user and stored with the meeting. Compliance recording is a third-party bot invited by policy into new calls, meetings, and events. Microsoft’s comparison, accessed 14 October 2026, says notification is enforced, participant consent is not the compliance control, and audio-only is not the compliance mode. Listed media is voice, video, and screen share. Desktop screen recording, if you need the CRM window, is a separate product you must disclose.
@p2
Configuration: a certified recorder, an application instance, a policy created with New-CsTeamsComplianceRecordingPolicy and set enabled, the application attached, then Grant-CsTeamsComplianceRecordingPolicy to the users or groups. Granting the policy does not record if the instance is missing. Existing calls are unaffected. Test a new call. Retention lives in the partner system, not in meeting storage. Quality management scores those recordings with a form the agent has seen.
@flow
Vendor|Certified;Instance|Application;Policy|Enabled;Grant|Users;Test|A new call
@chart
Compliance gate
@note
All five, or it is not recording.
@bars
Vendor|1|Certified;Instance|1|Created;Enabled|1|True;Grant|1|Assigned;Notify|1|Confirmed
@lab
record-policy
@say
Compliance recording is a partner bot, a policy, and an application instance. Users do not start it. I test a new call.
@fault
The policy is assigned and nothing records, because the bot instance was never created.
@listen
Compliance recording needs a certified bot, an enabled policy, a grant, and a new test call. It is not the record button.
@sources
rec,recsetup,recps
---
@id
t17-wfm
@track
t17
@title
Workforce management
@minutes
8
@why
A queue without a staffing model is a guess. Teams user reports will not staff next Tuesday.
@depends
Queue intervals; a handle-time definition
@p1
Workforce management consumes offered, answered, abandoned, and handle time from the contact center or the queue, in the same interval the schedule uses. Erlang C is a teaching model of how many people must be available. Shrinkage is the fraction of paid time that is not available. Roster is larger than the Erlang number. Occupancy is handle time over handle time plus ready time. Very high occupancy burns people and raises abandons.
@p2
Troubleshooting: if WFM says you were overstaffed while the queue overflowed, check whether overflow removed calls from this queue’s offered count, whether the interval was a day instead of 30 minutes, and whether handle time forgot after-call work. Agents set to available in Teams while still writing a case will poison both tools.
@flow
Feed|Interval stats;Math|Erlang plus shrinkage;Schedule|Publish it;Adhere|Agent state must match
@chart
Staffing stack
@note
Teaching relationship, not a vendor screen.
@bars
Erlang agents|10|On the phone;Shrinkage 30 percent|14|Roster about 14 if you need 10
@lab
erlang
@say
I staff from queue intervals, Erlang C, and an explicit shrinkage. I do not staff from Call Analytics.
@fault
The forecast is ten times too high because the interval was a whole day.
@listen
WFM eats queue intervals. Erlang C plus shrinkage is the teaching math. Do not feed it from a user’s call history.
@sources
d365,cqd
---
@id
t17-e911
@track
t17
@title
E911 as a system of record
@minutes
7
@why
Location is data you operate, shared with routing and with quality maps.
@depends
The emergency track
@p1
Keep one subnet list. Emergency location, location-based routing, and the CQD building map should read it. Three spreadsheets will drift, and then E911 says London, CQD says VPN, and LBR says Manchester.
@p2
Configuration is the topology plus the emergency policy plus the route plus the carrier test. Troubleshooting starts with ‘which subnet did the client present,’ not with the SBC firmware. PIDF-LO only helps if the SBC and the carrier pass it on. Notification only helps if the policy is assigned.
@flow
List|One subnet source;LIS|Addresses;Route|Local;Test|Carrier process;Maps|CQD uses the same list
@chart
One list, three consumers
@note
Shared data.
@bars
E911|1|Consumer;LBR|1|Consumer;CQD|1|Consumer
@lab
e911-match
@say
One subnet list feeds emergency location, LBR, and CQD. I can say which consumer is wrong when they disagree.
@fault
Three teams edit three maps and a VPN user inherits the HQ address.
@listen
Treat emergency location as a system of record shared with LBR and CQD. One subnet list.
@sources
emerg,lbr,cqd
---
@id
t17-pbi
@track
t17
@title
Analytics and Power BI
@minutes
7
@why
A dashboard is a view. Call Analytics, CQD, and contact-center analytics are different grains of truth.
@depends
CQD; a building map
@p1
Call Analytics is one call. CQD is the estate. Contact-center analytics are the queue: service level, abandon, handle time. Power BI can sit on CQD data, and contact-center implementations often surface supervisor numbers in Power BI. The report inherits a bad subnet map and a bad abandon rule.
@p2
Troubleshooting: if leadership sees a red headquarters, check the VPN labeling before you buy circuits. If two service-level numbers disagree, write down each abandon rule. Access to CQD is an admin permission. Do not share a password to get around that.
@flow
Question|One call, a building, or a queue;Tool|Analytics, CQD, or the contact center;Map|Subnets;Publish|Power BI last
@chart
Grain
@note
Pick the grain before the visual.
@bars
Call|1|Call Analytics;Building|2|CQD;Queue|3|Contact center
@lab
cqd-fault
@say
Power BI comes after the grain is right. I will not show a VPN pool as headquarters.
@fault
A polished report accuses the wrong building.
@listen
Match the tool to the question. Power BI does not fix a bad CQD building map.
@sources
cqd,calla,ab250
---
@id
t17-crm
@track
t17
@title
CRM and screen pop
@minutes
7
@why
The case is where the business remembers the call. Teams will not open Dynamics for an ordinary PSTN call by itself.
@depends
E.164; a contact center or middleware
@p1
Screen pop is a contact-center or middleware behavior. It looks up a contact from the caller number. That number has to be E.164 after normalization. Store the SIP Call-ID, the queue, and the agent on the timeline. A note that says ‘called customer’ cannot be audited.
@p2
Troubleshooting: the wrong contact pops when a trunk prefix is still on the number, or when one human has two caller IDs. Teams Phone extensibility and certified Connect transfers do not remove the need for that identifier. A mailbox legal hold does not retain a partner’s compliance recording.
@flow
Normalize|E.164;Lookup|Contact;Write|Call-ID, queue, agent;Retain|Recording where it actually lives
@chart
Fields worth storing
@note
Minimum timeline.
@bars
E.164|1|Lookup;Call-ID|1|Join;Queue|1|Context;Agent|1|Who
@lab
integrate-map
@say
Screen pop needs E.164 and should write the Call-ID. Teams alone does not open the case.
@fault
The pop shows the wrong person because the trunk prefix was left on.
@listen
Pop the CRM from an E.164 number and store the Call-ID. Do not expect an ordinary Teams call to open Dynamics by itself.
@sources
d365,cc,rec
---
@id
t17-ai
@track
t17
@title
AI agents beside the queue
@minutes
7
@why
A bot is a front door with a failure mode, not a headcount reduction you can assume.
@depends
Copilot Studio or ACS; a staffed queue
@p1
Put the agent in front of a queue only when knowledge sources are grounded, the escape digit works, and unknown intent reaches a human. Generative orchestration is less predictable than classic topics. Evaluate prompt changes before they are on a public number. Foundry is the evaluation place, not a second SBC.
@p2
Troubleshooting: if callers loop, the recognize step has no escape or the fallback topic is empty. If answers are confident and wrong, the source document is wrong. Never place this bot on the emergency route.
@flow
Ground|Sources;Escape|Tested;Overflow|Staffed queue;Eval|Before each change
@chart
Agent gates
@note
All required.
@bars
Sources|1|True;Escape|1|Tested;Humans|1|Rostered;Emergency|0|Not the bot
@lab
ivr-intent
@say
The agent has a tested escape and a staffed overflow. It is not the emergency route.
@fault
The prompt says ‘say agent’ and the recognize step has no such intent.
@listen
An AI agent needs grounded sources, a human escape, and a real queue behind it.
@sources
copilot,acs,foundry
---
@id
t17-maps
@track
t17
@title
Integration maps
@minutes
6
@why
A goal implies a set of systems. Naming them prevents a tool from being asked to do a job it does not have.
@depends
The mind map
@p1
Recording regulated calls implies a certified recorder, an application instance, a policy, the users in scope, and a Call-ID. A CRM pop implies E.164 and middleware. Staffing implies queue intervals and shrinkage. WAN survival implies Direct Routing and an SBA. A bad building implies CQD and the subnet map. A bot implies an escape and a queue.
@p2
The integration-map lab asks you to pick the goal and read that list. If your design’s list is shorter, the missing row is the future incident.
@flow
Goal|One sentence;Systems|The short list;Identifier|How logs join;Missing row|The incident you will have
@chart
Goals to systems
@note
Use the lab for the full list.
@bars
Record|5|Five checks;Pop|4|Number, CRM, id, path;Survive|4|SBA path
@lab
integrate-map
@say
I start from the goal and list the systems, including the identifier.
@fault
The design’s list is shorter than the goal requires.
@listen
For each goal, name the systems and the identifier. A shorter list is a future incident.
@sources
rec,d365,sba,cqd
---
@id
t17-bridges
@track
t17
@title
Cross-platform bridges
@minutes
7
@why
CUCM, Webex, UCCE, Genesys, and Amazon Connect all show up next to Teams. The bridge is an SBC and a rule, not a slogan.
@depends
Coexistence track
@p1
The bridge is a certified SBC, often CUBE, with one normalization owner, a written number range, and a rollback that still has the old route. Identity is not shared automatically between CUCM and Entra. Presence is not a call route. Chat interop is not voice.
@p2
Genesys needs a named Connect, Extend, or Unify certification. Amazon Connect needs a drawn SIP path. UCCE agents stay put until the contact-center migration is its own project. Tromboning during dual-running is expected and should not become the steady state.
@flow
SBC|The bridge;Ranges|Written;Normalize|One owner;Rollback|Old route remains
@chart
Bridge rules
@note
All four.
@bars
SBC|1|Required;One normalizer|1|Required;Ranges|1|Written;Rollback|1|Kept
@lab
coexist
@say
A cross-platform voice bridge is an SBC, one normalizer, written ranges, and a rollback.
@fault
Both systems transform numbers, or the old trunk is deleted the same night.
@listen
Bridge other platforms with a certified SBC, one place that normalizes, and a rollback you still have.
@sources
cube,cc,dr
---
@id
t17-hooks
@track
t17
@title
Future-integration hooks
@minutes
7
@why
A seam you name now is cheap. A rewrite after go-live is not. These hooks use products that exist today.
@depends
Recording; CRM; E911; WFM; agents
@p1
Leave these seams: store the Call-ID on the CRM timeline, assign the recording policy in the same change as the number, let overflow become a bot without a new public number, keep one subnet list, route by SBC FQDN rather than a copied proxy IP, make queue intervals exportable to WFM, test the human escape, and monitor certificate expiry.
@p2
None of these require an unannounced feature. A design that depends on a rumor is not a hook. It is a risk. The lab lists the failure you get if you skip each seam.
@flow
Name|The seam;Identifier|What you store;Owner|Who edits it;Failure|If you skip it
@chart
Hooks
@note
Eight seams. The lab explains the miss.
@bars
Call-ID|1|CRM;Policy with number|1|Recording;One subnet list|1|E911 and CQD;Cert date|1|Calendar
@lab
hook-plan
@say
I can name the seams I am leaving, and the failure if I skip one. I am not promising an unannounced product.
@fault
The number goes live and the regulated users are not in a recording policy.
@listen
Leave seams you can build today: Call-ID, recording policy, overflow, one subnet list, certificate dates. Do not design on a rumor.
@sources
rec,emerg,cqd,cc
---
@id
t17-change
@track
t17
@title
Configuring an ecosystem change
@minutes
7
@why
A voice change that ignores the sisters will pass a test call and fail the business.
@depends
The hooks; a lab tenant
@p1
Write the change as a list: tenant, license, route, emergency subnet, recording policy, queue or workstream, CRM field, and the rollback. Do the lab version first. Read effective policy after each grant. Acquire resource-account licenses even when the price is zero.
@p2
Include the certificate expiry and the holiday calendar if the change touches an attendant. Include shrinkage if the change adds a queue. A test call by itself is not an ecosystem test.
@flow
List|All sisters touched;Lab|First;Read back|Effective policy;Rollback|Written
@chart
Change list
@note
Minimum rows.
@bars
Route|1|Voice;Location|1|E911;Recorder|1|If regulated;CRM field|1|If popped;Rollback|1|Always
@lab
hook-plan
@say
My change list names the sisters, not only the SBC.
@fault
The pilot is declared production because one test call worked.
@listen
Configure an ecosystem change as a list: route, location, recorder, CRM, and rollback. A single test call is not enough.
@sources
dr,rec,emerg,d365
---
@id
t17-boundary
@track
t17
@title
Troubleshooting across a vendor boundary
@minutes
8
@why
The fault is usually on one side of a boundary. The argument is usually on both.
@depends
One hypothesis; the mind map
@p1
Name the boundary: Teams and SBC, SBC and carrier, Teams and recorder, queue and WFM, number and CRM. Collect the join key on both sides before anyone changes anything. Call-ID for SIP. E.164 for the CRM. Interval timestamp for WFM. Subnet for E911 and CQD.
@p2
One change, on the side the evidence names. Vendor-first if it is the SBC. Partner-first if it is the recorder. Do not restart a carrier trunk because a Copilot answer was wrong. Write the pack down so next month does not start from zero.
@flow
Boundary|Name it;Key|The same id both sides;Side|Where the evidence points;Change|One
@chart
Join keys
@note
Use the key that matches the boundary.
@bars
SIP|1|Call-ID;CRM|1|E.164 plus Call-ID;WFM|1|Interval;Quality|1|Subnet
@lab
integrate-map
@say
I name the boundary and the join key before I ask a vendor to change anything.
@fault
Three vendors change three boxes because nobody wrote down the Call-ID.
@listen
Across vendors, name the boundary and match the identifier. Then change one thing.
@sources
dr,rec,cqd,d365
---
''')

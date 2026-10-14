"use strict";

/* Interactive studios: SIP ladder, PowerShell, E.164 groups, E911 LIS board. */

let ladderTimer = null;

function clearLadders() {
  if (ladderTimer) {
    clearInterval(ladderTimer);
    ladderTimer = null;
  }
}

function partyIndex(name) {
  const text = String(name || "").toLowerCase();
  if (text.indexOf("carrier") !== -1 || text.indexOf("pstn") !== -1) return 3;
  if (text.indexOf("sbc") !== -1 || text.indexOf("gateway") !== -1 || text.indexOf("sba") !== -1) return 2;
  if (text.indexOf("proxy") !== -1 || text.indexOf("teams") !== -1 || text.indexOf("pstnhub") !== -1 || text.indexOf("processor") !== -1 || text.indexOf("lis") !== -1) return 1;
  return 0;
}

function mountSipLadder(host, steps) {
  if (!host) return;
  clearLadders();
  const parties = ["Client", "Teams", "SBC", "Carrier"];
  let index = -1;
  let playing = false;
  host.innerHTML =
    '<div class="sip-ladder" role="group" aria-label="Call flow player">' +
    '<div class="sip-toolbar">' +
    '<button type="button" class="primary" data-act="play">Play</button>' +
    '<button type="button" class="ghost" data-act="pause">Pause</button>' +
    '<button type="button" class="ghost" data-act="step">Step</button>' +
    '<button type="button" class="ghost" data-act="inspect">Inspect</button>' +
    "</div>" +
    '<div class="sip-cols" aria-hidden="true">' +
    parties.map((name) => '<div class="sip-party">' + esc(name) + "</div>").join("") +
    "</div>" +
    '<ol class="sip-steps">' +
    steps.map((step, i) => {
      const from = partyIndex(step.from);
      const to = partyIndex(step.to);
      return (
        '<li data-i="' + i + '" class="' + (step.fail ? "is-fail" : "") + '">' +
        '<span class="sip-rail" style="--from:' + from + ";--to:" + to + '"></span>' +
        "<strong>" + esc(step.title) + "</strong>" +
        "<em>" + esc(step.from) + " → " + esc(step.to) + "</em>" +
        "<span>" + esc(step.detail) + "</span></li>"
      );
    }).join("") +
    "</ol>" +
    '<pre class="sip-inspect" id="sip-inspect" hidden></pre>' +
    "</div>";

  function paint() {
    $$(".sip-steps li", host).forEach((row, i) => {
      row.classList.toggle("is-on", i === index);
      row.classList.toggle("is-done", i < index);
    });
    const step = steps[index];
    const box = $("#sip-inspect", host);
    if (!step || !box) return;
    if (!box.hidden) box.textContent = step.inspect || step.detail;
  }

  function stepOnce() {
    if (index >= steps.length - 1) {
      playing = false;
      if (ladderTimer) {
        clearInterval(ladderTimer);
        ladderTimer = null;
      }
      const play = host.querySelector('[data-act="play"]');
      if (play) play.textContent = "Play";
      return;
    }
    index += 1;
    paint();
  }

  host.querySelector('[data-act="play"]').onclick = function () {
    if (playing) return;
    if (index >= steps.length - 1) index = -1;
    playing = true;
    this.textContent = "Playing";
    stepOnce();
    ladderTimer = setInterval(stepOnce, 900);
  };
  host.querySelector('[data-act="pause"]').onclick = function () {
    playing = false;
    const play = host.querySelector('[data-act="play"]');
    if (play) play.textContent = "Play";
    clearLadders();
  };
  host.querySelector('[data-act="step"]').onclick = function () {
    playing = false;
    const play = host.querySelector('[data-act="play"]');
    if (play) play.textContent = "Play";
    clearLadders();
    stepOnce();
  };
  host.querySelector('[data-act="inspect"]').onclick = function () {
    const box = $("#sip-inspect", host);
    if (!box) return;
    box.hidden = !box.hidden;
    if (index < 0) index = 0;
    paint();
  };
}

function mountFlowPlayer(host, steps) {
  const mapped = (steps || []).map((step, i) => ({
    from: i === 0 ? "Start" : steps[i - 1].label,
    to: step.label,
    title: step.label,
    detail: step.detail,
    inspect: step.label + "\n" + step.detail,
    fail: false,
  }));
  mountSipLadder(host, mapped);
}

function highlightGroups(input, match) {
  if (!match) return "<p>No match.</p>";
  const text = match.input;
  const spans = [];
  const groups = [];
  for (let i = 1; i < match.length; i += 1) {
    const part = match[i];
    if (part == null) continue;
    const start = match.indices ? match.indices[i][0] : text.indexOf(part);
    groups.push({ n: i, part: part, start: start });
  }
  if (!groups.length) {
    return '<p class="match-line"><span class="g0">' + esc(text) + "</span></p><p>The pattern matched and captured no groups.</p>";
  }
  const marks = groups.filter((group) => group.start >= 0).sort((a, b) => a.start - b.start);
  let html = "";
  let cursor = 0;
  marks.forEach((group) => {
    if (group.start < cursor) return;
    if (group.start > cursor) html += '<span class="g0">' + esc(text.slice(cursor, group.start)) + "</span>";
    html += '<span class="g' + ((group.n % 4) + 1) + '">' + esc(group.part) + "</span>";
    cursor = group.start + group.part.length;
  });
  if (cursor < text.length) html += '<span class="g0">' + esc(text.slice(cursor)) + "</span>";
  const list = groups.map((group) => "<li>Group " + group.n + ": <code>" + esc(group.part) + "</code></li>").join("");
  return '<p class="match-line">' + html + "</p><ol>" + list + "</ol>";
}

function testRegexSandbox(pattern, translation, raw) {
  const cleaned = String(raw).trim().replace(/[\s()-]/g, "");
  let re;
  try {
    re = new RegExp(pattern);
  } catch (err) {
    return { ok: false, html: "<p>That pattern did not compile. " + esc(err.message) + "</p>" };
  }
  const match = re.exec(cleaned);
  if (!match) {
    return { ok: false, html: "<p>No match on <code>" + esc(cleaned) + "</code>. Routing would see the raw digits.</p>" };
  }
  const output = String(translation).replace(/\$(\d)/g, function (_, digit) {
    const part = match[Number(digit)];
    return part == null ? "" : part;
  });
  return {
    ok: true,
    html: highlightGroups(cleaned, match) + "<p>Translation <strong>" + esc(output) + "</strong></p>",
  };
}

const PS_HELP = [
  "Get-CsOnlinePSTNGateway",
  "New-CsOnlinePSTNGateway -Fqdn sbc-lon.contoso.example -SipSignalingPort 5061",
  "Set-CsOnlinePSTNGateway -Identity sbc-lon.contoso.example -MediaBypass $true",
  "Get-CsOnlineVoiceRoute",
  "New-CsOnlineVoiceRoute -Identity UK-National -NumberPattern '^\\+44\\d{9,10}$' -OnlinePstnGatewayList sbc-lon.contoso.example -OnlinePstnUsages UK-National -Priority 1",
  "Set-CsOnlineVoiceRoute -Identity UK-National -Priority 2",
  "Get-CsTeamsCallingPolicy",
  "Set-CsTeamsCallingPolicy -Identity Tag:AllowCalling -AllowPrivateCalling $true",
  "Grant-CsTeamsCallingPolicy -Identity avery@contoso.example -PolicyName AllowCalling",
  "Get-CsOnlineUser -Identity avery@contoso.example",
  "Grant-CsOnlineVoiceRoutingPolicy -Identity avery@contoso.example -PolicyName UK-HQ-International",
  "Get-Command",
];

function freshPsTenant() {
  return {
    gateways: [
      { Identity: "sbc-lon.contoso.example", Fqdn: "sbc-lon.contoso.example", SipSignalingPort: 5061, Enabled: true, MediaBypass: false, Failover: "sbc-man.contoso.example" },
      { Identity: "sbc-man.contoso.example", Fqdn: "sbc-man.contoso.example", SipSignalingPort: 5061, Enabled: true, MediaBypass: true, Failover: "" },
    ],
    routes: [
      { Identity: "UK-Emergency", NumberPattern: "^\\+44999$|^\\+44112$", OnlinePstnGatewayList: "sbc-lon.contoso.example", OnlinePstnUsages: "Emergency", Priority: 0 },
      { Identity: "UK-National", NumberPattern: "^\\+44\\d{9,10}$", OnlinePstnGatewayList: "sbc-lon.contoso.example", OnlinePstnUsages: "UK-National", Priority: 1 },
    ],
    calling: [
      { Identity: "Tag:AllowCalling", AllowPrivateCalling: true, AllowVoicemail: "UserOverride", AllowCallForwardingToPhone: true },
      { Identity: "Tag:DisallowCalling", AllowPrivateCalling: false, AllowVoicemail: "Disabled", AllowCallForwardingToPhone: false },
    ],
    users: {
      "avery@contoso.example": { Identity: "avery@contoso.example", TeamsCallingPolicy: "AllowCalling", OnlineVoiceRoutingPolicy: "UK-HQ-International", TenantDialPlan: "US-Tenant", LineURI: "tel:+442075550100" },
      "blake@contoso.example": { Identity: "blake@contoso.example", TeamsCallingPolicy: "DisallowCalling", OnlineVoiceRoutingPolicy: "", TenantDialPlan: "", LineURI: "" },
    },
  };
}

let psTenant = freshPsTenant();
const psHistory = [];
let psCursor = 0;

function psTokenize(line) {
  const out = [];
  let cur = "";
  let quote = "";
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = "";
      else cur += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === " " || ch === "\t") {
      if (cur) {
        out.push(cur);
        cur = "";
      }
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function psParams(tokens) {
  const params = {};
  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (tok.charAt(0) !== "-") continue;
    const key = tok.slice(1).toLowerCase();
    const next = tokens[i + 1];
    if (next == null || next.charAt(0) === "-") params[key] = true;
    else {
      params[key] = next;
      i += 1;
    }
  }
  return params;
}

function psBool(value) {
  const text = String(value).toLowerCase();
  if (text === "$true" || text === "true") return true;
  if (text === "$false" || text === "false") return false;
  return null;
}

function psTable(rows, columns) {
  if (!rows.length) return "\n";
  const widths = columns.map((col) => Math.max(col.length, ...rows.map((row) => String(row[col] == null ? "" : row[col]).length)));
  const line = (values) => values.map((value, i) => String(value).padEnd(widths[i])).join("  ");
  const head = line(columns);
  const bar = line(widths.map((width) => "-".repeat(Math.min(width, 18))));
  return [head, bar].concat(rows.map((row) => line(columns.map((col) => row[col] == null ? "" : row[col])))).join("\n");
}

function psBadFqdn(fqdn) {
  const name = String(fqdn || "").toLowerCase();
  if (!name || name.indexOf(".") === -1) return "Fqdn is missing. Pair the name on the certificate, not an IP.";
  if (name.indexOf(".onmicrosoft.com") !== -1) return "onmicrosoft.com cannot be paired as a Direct Routing SBC.";
  if (name.indexOf("pstnhub.microsoft.com") !== -1) return "sip.pstnhub.microsoft.com belongs to Microsoft. Pair your own FQDN.";
  return "";
}

function runPsCommand(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return "";
  const tokens = psTokenize(trimmed);
  const name = (tokens[0] || "").toLowerCase();
  const params = psParams(tokens.slice(1));
  if (name === "clear-host" || name === "cls" || name === "clear") return "__clear__";
  if (name === "get-command" || name === "help" || name === "get-help") {
    return "Simulated Teams module. These cmdlets change a browser tenant, not Microsoft 365.\n\n" + PS_HELP.join("\n");
  }
  if (name === "get-csonlinepstngateway") {
    const id = params.identity;
    const rows = psTenant.gateways.filter((row) => !id || row.Identity.toLowerCase() === String(id).toLowerCase());
    if (!rows.length) return "Get-CsOnlinePSTNGateway : Cannot find gateway '" + (id || "") + "'.";
    return psTable(rows, ["Identity", "SipSignalingPort", "Enabled", "MediaBypass"]);
  }
  if (name === "new-csonlinepstngateway") {
    const fqdn = params.fqdn || params.identity;
    const why = psBadFqdn(fqdn);
    if (why) return "New-CsOnlinePSTNGateway : " + why;
    if (psTenant.gateways.some((row) => row.Identity.toLowerCase() === String(fqdn).toLowerCase())) {
      return "New-CsOnlinePSTNGateway : " + fqdn + " is already paired. Use Set-CsOnlinePSTNGateway.";
    }
    const port = Number(params.sipsignalingport || 5061);
    if (port !== 5061) return "New-CsOnlinePSTNGateway : Direct Routing signaling in this model uses TCP 5061.";
    psTenant.gateways.push({
      Identity: fqdn,
      Fqdn: fqdn,
      SipSignalingPort: port,
      Enabled: psBool(params.enabled) !== false,
      MediaBypass: psBool(params.mediabypass) === true,
      Failover: "",
    });
    return "Paired " + fqdn + " on 5061.\n" + psTable(psTenant.gateways.slice(-1), ["Identity", "SipSignalingPort", "Enabled", "MediaBypass"]);
  }
  if (name === "set-csonlinepstngateway") {
    const id = params.identity || params.fqdn;
    const row = psTenant.gateways.find((item) => item.Identity.toLowerCase() === String(id || "").toLowerCase());
    if (!row) return "Set-CsOnlinePSTNGateway : Cannot find gateway '" + (id || "") + "'.";
    if (params.mediabypass != null && params.mediabypass !== true) {
      const flag = psBool(params.mediabypass);
      if (flag == null) return "Set-CsOnlinePSTNGateway : -MediaBypass expects $true or $false.";
      row.MediaBypass = flag;
    }
    if (params.enabled != null && params.enabled !== true) {
      const flag = psBool(params.enabled);
      if (flag == null) return "Set-CsOnlinePSTNGateway : -Enabled expects $true or $false.";
      row.Enabled = flag;
    }
    return psTable([row], ["Identity", "SipSignalingPort", "Enabled", "MediaBypass"]);
  }
  if (name === "get-csonlinevoiceroute") {
    const id = params.identity;
    const rows = psTenant.routes.filter((row) => !id || row.Identity.toLowerCase() === String(id).toLowerCase());
    if (!rows.length) return id ? "Get-CsOnlineVoiceRoute : Cannot find route '" + id + "'." : "No voice routes.";
    return psTable(rows, ["Priority", "Identity", "OnlinePstnUsages", "OnlinePstnGatewayList"]);
  }
  if (name === "new-csonlinevoiceroute") {
    const id = params.identity;
    const pattern = params.numberpattern;
    const gw = params.onlinepstngatewaylist;
    const usage = params.onlinepstnusages;
    if (!id || !pattern || !gw || !usage) {
      return "New-CsOnlineVoiceRoute : Identity, NumberPattern, OnlinePstnGatewayList, and OnlinePstnUsages are required in this simulator.";
    }
    try {
      new RegExp(pattern);
    } catch (err) {
      return "New-CsOnlineVoiceRoute : NumberPattern did not compile. " + err.message;
    }
    if (!psTenant.gateways.some((row) => row.Identity.toLowerCase() === String(gw).toLowerCase())) {
      return "New-CsOnlineVoiceRoute : Gateway " + gw + " is not paired. New-CsOnlinePSTNGateway first.";
    }
    if (psTenant.routes.some((row) => row.Identity.toLowerCase() === String(id).toLowerCase())) {
      return "New-CsOnlineVoiceRoute : Route " + id + " already exists. Use Set-CsOnlineVoiceRoute.";
    }
    const priority = params.priority == null ? psTenant.routes.length + 1 : Number(params.priority);
    psTenant.routes.push({
      Identity: id,
      NumberPattern: pattern,
      OnlinePstnGatewayList: gw,
      OnlinePstnUsages: usage,
      Priority: priority,
    });
    psTenant.routes.sort((a, b) => a.Priority - b.Priority);
    return psTable(psTenant.routes.filter((row) => row.Identity === id), ["Priority", "Identity", "NumberPattern", "OnlinePstnGatewayList"]);
  }
  if (name === "set-csonlinevoiceroute") {
    const row = psTenant.routes.find((item) => item.Identity.toLowerCase() === String(params.identity || "").toLowerCase());
    if (!row) return "Set-CsOnlineVoiceRoute : Cannot find route '" + (params.identity || "") + "'.";
    if (params.priority != null) row.Priority = Number(params.priority);
    if (params.numberpattern) {
      try { new RegExp(params.numberpattern); } catch (err) {
        return "Set-CsOnlineVoiceRoute : NumberPattern did not compile.";
      }
      row.NumberPattern = params.numberpattern;
    }
    if (params.onlinepstngatewaylist) row.OnlinePstnGatewayList = params.onlinepstngatewaylist;
    return psTable([row], ["Priority", "Identity", "NumberPattern", "OnlinePstnGatewayList"]);
  }
  if (name === "remove-csonlinevoiceroute") {
    const before = psTenant.routes.length;
    psTenant.routes = psTenant.routes.filter((row) => row.Identity.toLowerCase() !== String(params.identity || "").toLowerCase());
    if (psTenant.routes.length === before) return "Remove-CsOnlineVoiceRoute : Cannot find route '" + (params.identity || "") + "'.";
    return "Removed " + params.identity + ".";
  }
  if (name === "get-csteamscallingpolicy") {
    const id = params.identity;
    const rows = psTenant.calling.filter((row) => !id || row.Identity.toLowerCase() === String(id).toLowerCase() || row.Identity.toLowerCase() === "tag:" + String(id).toLowerCase());
    if (!rows.length) return "Get-CsTeamsCallingPolicy : Cannot find policy '" + (id || "") + "'.";
    return psTable(rows, ["Identity", "AllowPrivateCalling", "AllowVoicemail"]);
  }
  if (name === "set-csteamscallingpolicy") {
    const id = String(params.identity || "");
    if (id.indexOf("@") !== -1) {
      return "Set-CsTeamsCallingPolicy : That assigns nothing. Set- changes the policy object. Grant-CsTeamsCallingPolicy assigns it to " + id + ".";
    }
    const row = psTenant.calling.find((item) => item.Identity.toLowerCase() === id.toLowerCase() || item.Identity.toLowerCase() === "tag:" + id.toLowerCase());
    if (!row) return "Set-CsTeamsCallingPolicy : Cannot find policy '" + id + "'.";
    if (params.allowprivatecalling != null && params.allowprivatecalling !== true) {
      const flag = psBool(params.allowprivatecalling);
      if (flag == null) return "Set-CsTeamsCallingPolicy : -AllowPrivateCalling expects $true or $false.";
      row.AllowPrivateCalling = flag;
    }
    if (params.allowvoicemail) row.AllowVoicemail = params.allowvoicemail;
    return psTable([row], ["Identity", "AllowPrivateCalling", "AllowVoicemail"]);
  }
  if (name === "grant-csteamscallingpolicy") {
    const user = psTenant.users[String(params.identity || "").toLowerCase()];
    if (!user) return "Grant-CsTeamsCallingPolicy : User '" + (params.identity || "") + "' is not in this simulated tenant. Try avery@contoso.example.";
    const policy = String(params.policyname || "").replace(/^Tag:/i, "");
    const found = psTenant.calling.some((row) => row.Identity.toLowerCase() === "tag:" + policy.toLowerCase() || row.Identity.toLowerCase() === policy.toLowerCase());
    if (!policy || !found) return "Grant-CsTeamsCallingPolicy : PolicyName '" + (params.policyname || "") + "' was not found.";
    user.TeamsCallingPolicy = policy;
    return psTable([user], ["Identity", "TeamsCallingPolicy", "OnlineVoiceRoutingPolicy", "LineURI"]);
  }
  if (name === "grant-csonlinevoiceroutingpolicy") {
    const user = psTenant.users[String(params.identity || "").toLowerCase()];
    if (!user) return "Grant-CsOnlineVoiceRoutingPolicy : User not in this simulated tenant.";
    user.OnlineVoiceRoutingPolicy = params.policyname || "";
    return psTable([user], ["Identity", "TeamsCallingPolicy", "OnlineVoiceRoutingPolicy", "LineURI"]);
  }
  if (name === "get-csonlineuser") {
    const id = String(params.identity || "").toLowerCase();
    const rows = Object.keys(psTenant.users).filter((key) => !id || key === id).map((key) => psTenant.users[key]);
    if (!rows.length) return "Get-CsOnlineUser : Cannot find user '" + (params.identity || "") + "'.";
    return psTable(rows, ["Identity", "TeamsCallingPolicy", "OnlineVoiceRoutingPolicy", "LineURI"]);
  }
  return "The term '" + tokens[0] + "' is not recognized in this simulator. Try Get-Command.";
}

function mountPowerShell(host) {
  if (!host) return;
  psTenant = freshPsTenant();
  psHistory.length = 0;
  psCursor = 0;
  host.innerHTML =
    '<div class="ps-wrap">' +
    '<div class="ps-bar"><span class="ps-mark" aria-hidden="true"></span> Teams PowerShell · simulated tenant · nothing leaves this browser</div>' +
    '<pre id="ps-log" aria-live="polite">Windows PowerShell\nA teaching tenant is loaded. Get-Command lists the cmdlets.\n</pre>' +
    '<form id="ps-form" autocomplete="off">' +
    '<label class="sr" for="ps-in">PowerShell command</label>' +
    '<span class="ps-prompt" aria-hidden="true">PS C:\\&gt;</span>' +
    '<input id="ps-in" spellcheck="false" autocapitalize="off" placeholder="Get-CsOnlinePSTNGateway">' +
    "</form></div>" +
    '<div class="row ps-chips">' +
    PS_HELP.slice(0, 6).map((cmd) => '<button type="button" class="chip" data-ps="' + esc(cmd) + '">' + esc(cmd.split(" ")[0]) + "</button>").join("") +
    "</div>";
  const input = $("#ps-in", host);
  const log = $("#ps-log", host);
  function write(command) {
    const result = runPsCommand(command);
    if (result === "__clear__") {
      log.textContent = "";
      return;
    }
    log.textContent += "PS C:\\> " + command + "\n" + result + "\n\n";
    log.scrollTop = log.scrollHeight;
  }
  $("#ps-form", host).onsubmit = function (event) {
    event.preventDefault();
    const command = input.value;
    if (!command.trim()) return;
    psHistory.push(command);
    psCursor = psHistory.length;
    write(command);
    input.value = "";
  };
  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (psCursor > 0) psCursor -= 1;
      input.value = psHistory[psCursor] || "";
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (psCursor < psHistory.length) psCursor += 1;
      input.value = psHistory[psCursor] || "";
    }
  });
  $$("[data-ps]", host).forEach((button) => {
    button.onclick = function () {
      input.value = button.getAttribute("data-ps");
      input.focus();
    };
  });
}

const LIS_SITES = [
  { bssid: "A1:B2:C3:D4:E5:10", cidr: "10.20.4.0/24", site: "London HQ, 4th floor", address: "1 Example Plaza, London", method: "Direct Routing SBC sbc-lon.contoso.example", dispatchable: true },
  { bssid: "B2:C3:D4:E5:F6:20", cidr: "10.30.0.0/16", site: "Manchester branch", address: "9 Sample Street, Manchester", method: "Direct Routing SBC sbc-man.contoso.example", dispatchable: true },
  { bssid: "C3:D4:E5:F6:A7:30", cidr: "10.8.0.0/16", site: "VPN pool", address: "Unassigned", method: "No dispatchable location", dispatchable: false },
];

function lisLookup(ip, bssid) {
  const mac = String(bssid || "").trim().toUpperCase();
  const byMac = LIS_SITES.find((site) => site.bssid === mac);
  if (byMac) return { hit: byMac, via: "BSSID" };
  const byIp = LIS_SITES.find((site) => inCidr(String(ip || "").trim(), site.cidr));
  if (byIp) return { hit: byIp, via: "subnet" };
  return { hit: null, via: "" };
}

function mountLisBoard(host, found) {
  if (!host) return;
  const stages = [
    { id: "client", title: "Teams client", detail: found ? "Discovered " + (found.via === "BSSID" ? "BSSID " + found.hit.bssid : "subnet") : "No network identity yet" },
    { id: "network", title: "Network", detail: found ? found.via + " is the lookup key" : "Trusted IP, subnet, or BSSID" },
    { id: "lis", title: "LIS", detail: found ? "Matched " + found.hit.site : "No location record" },
    { id: "civic", title: "Civic address", detail: found ? found.hit.address : "Unknown" },
    { id: "route", title: "Emergency route", detail: found ? found.hit.method : "Do not guess a route" },
  ];
  host.innerHTML =
    '<div class="lis-board" role="img" aria-label="Emergency location discovery">' +
    stages.map((stage) => '<article data-stage="' + stage.id + '"><b>' + esc(stage.title) + "</b><span>" + esc(stage.detail) + "</span></article>").join("") +
    "</div>" +
    '<div class="sip-toolbar">' +
    '<button type="button" class="primary" id="lis-play">Play</button>' +
    '<button type="button" class="ghost" id="lis-pause">Pause</button>' +
    '<button type="button" class="ghost" id="lis-step">Step</button>' +
    '<button type="button" class="ghost" id="lis-inspect">Inspect</button>' +
    "</div>" +
    '<pre class="sip-inspect" id="lis-inspect" hidden></pre>';
  let index = -1;
  function paint() {
    $$("[data-stage]", host).forEach((node, i) => {
      node.classList.toggle("is-on", i === index);
      node.classList.toggle("is-done", i < index);
      node.classList.toggle("is-fail", found && !found.hit.dispatchable && i === index && node.getAttribute("data-stage") === "route");
    });
    const box = $("#lis-inspect", host);
    if (box && !box.hidden) {
      const stage = stages[Math.max(0, index)] || stages[0];
      box.textContent = stage.title + "\n" + stage.detail + (found && found.hit ? "\n\n" + found.hit.site + "\n" + found.hit.address + "\n" + found.hit.method : "\n\nNo LIS match.");
    }
  }
  function step() {
    if (index >= stages.length - 1) {
      clearLadders();
      return;
    }
    index += 1;
    paint();
  }
  $("#lis-play", host).onclick = function () {
    clearLadders();
    if (index >= stages.length - 1) index = -1;
    step();
    ladderTimer = setInterval(step, 800);
  };
  $("#lis-pause", host).onclick = function () { clearLadders(); };
  $("#lis-step", host).onclick = function () { clearLadders(); step(); };
  $("#lis-inspect", host).onclick = function () {
    const box = $("#lis-inspect", host);
    box.hidden = !box.hidden;
    if (index < 0) index = 0;
    paint();
  };
  paint();
}

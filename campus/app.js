"use strict";

function applyNormalization(input, rules) {
  const value = String(input).trim().replace(/[\s()-]/g, "");
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    let re;
    try {
      re = new RegExp(rule.pattern);
    } catch (err) {
      return {
        ok: false,
        output: value,
        rule: null,
        index: -1,
        error: "That pattern is not a valid regular expression.",
      };
    }
    const match = re.exec(value);
    if (!match) continue;
    const output = String(rule.translation).replace(/\$(\d)/g, function (_, digit) {
      const part = match[Number(digit)];
      return part == null ? "" : part;
    });
    return { ok: true, output: output, rule: rule.name, index: i, error: null };
  }
  return {
    ok: false,
    output: value,
    rule: null,
    index: -1,
    error: "No normalization rule matched. Routing then sees the raw digits.",
  };
}

function matchVoiceRoute(e164, policy) {
  const usages = policy.usages || [];
  for (let u = 0; u < usages.length; u += 1) {
    const usage = usages[u];
    const routes = (usage.routes || []).slice().sort(function (a, b) {
      return a.priority - b.priority;
    });
    for (let r = 0; r < routes.length; r += 1) {
      const route = routes[r];
      let re;
      try {
        re = new RegExp(route.pattern);
      } catch (err) {
        continue;
      }
      if (!re.test(e164)) continue;
      const gateways = (route.gateways || []).slice().sort(function (a, b) {
        return a.priority - b.priority;
      });
      return {
        ok: true,
        usage: usage.name,
        route: route.name,
        gateway: gateways[0] || null,
        gateways: gateways,
        usageIndex: u,
        routeIndex: r,
      };
    }
  }
  return { ok: false, usage: null, route: null, gateway: null, gateways: [] };
}

function erlangB(agents, traffic) {
  const n = Math.floor(agents);
  if (n <= 0) return 1;
  if (!(traffic > 0)) return 0;
  let b = 1;
  for (let k = 1; k <= n; k += 1) {
    b = (traffic * b) / (k + traffic * b);
  }
  return b;
}

function erlangC(agents, traffic) {
  const n = Math.floor(agents);
  if (!(traffic > 0)) return 0;
  if (n <= traffic) return 1;
  const b = erlangB(n, traffic);
  const denom = n - traffic * (1 - b);
  if (denom <= 0) return 1;
  return (n * b) / denom;
}

function serviceLevel(agents, traffic, targetSeconds, ahtSeconds) {
  const n = Math.floor(agents);
  if (!(ahtSeconds > 0)) return 0;
  if (n <= traffic) return 0;
  const pw = erlangC(n, traffic);
  const sl = 1 - pw * Math.exp((-(n - traffic) * targetSeconds) / ahtSeconds);
  if (sl < 0) return 0;
  if (sl > 1) return 1;
  return sl;
}

function averageSpeed(agents, traffic, ahtSeconds) {
  const n = Math.floor(agents);
  if (n <= traffic) return Number.POSITIVE_INFINITY;
  const pw = erlangC(n, traffic);
  return (pw * ahtSeconds) / (n - traffic);
}

function mediaKbps(payloadBytes, ptimeMs, headerBytes) {
  if (!(ptimeMs > 0)) return 0;
  return ((payloadBytes + headerBytes) * 8) / ptimeMs;
}

const US_TENANT_RULES = [
  { name: "Already E.164", pattern: "^\\+(\\d{8,15})$", translation: "+$1" },
  { name: "Emergency 999", pattern: "^999$", translation: "+44999" },
  { name: "Emergency 112", pattern: "^112$", translation: "+44112" },
  { name: "Emergency 911", pattern: "^911$", translation: "+1911" },
  { name: "11 digits with leading 1", pattern: "^1(\\d{10})$", translation: "+1$1" },
  { name: "10-digit national", pattern: "^(\\d{10})$", translation: "+1$1" },
  { name: "4-digit extension to a pilot", pattern: "^(\\d{4})$", translation: "+1425555$1" },
];

const SAMPLE_POLICY = {
  name: "UK-HQ-International",
  usages: [
    {
      name: "Emergency",
      routes: [
        {
          name: "UK emergency",
          priority: 1,
          pattern: "^\\+44999$|^\\+44112$|^999$|^112$",
          gateways: [{ fqdn: "sbc-lon.contoso.example", priority: 1 }],
        },
      ],
    },
    {
      name: "UK-National",
      routes: [
        {
          name: "United Kingdom",
          priority: 1,
          pattern: "^\\+44\\d{9,10}$",
          gateways: [
            { fqdn: "sbc-lon.contoso.example", priority: 1 },
            { fqdn: "sbc-man.contoso.example", priority: 2 },
          ],
        },
      ],
    },
    {
      name: "International",
      routes: [
        {
          name: "Rest of world",
          priority: 1,
          pattern: "^\\+[1-9]\\d{7,14}$",
          gateways: [{ fqdn: "sbc-lon.contoso.example", priority: 1 }],
        },
      ],
    },
  ],
};

const RESTRICTED_POLICY = {
  name: "Branch-National-Only",
  usages: [
    {
      name: "Emergency",
      routes: [
        {
          name: "UK emergency",
          priority: 1,
          pattern: "^\\+44999$|^\\+44112$|^999$|^112$",
          gateways: [{ fqdn: "sbc-man.contoso.example", priority: 1 }],
        },
      ],
    },
    {
      name: "UK-National",
      routes: [
        {
          name: "United Kingdom",
          priority: 1,
          pattern: "^\\+44\\d{9,10}$",
          gateways: [{ fqdn: "sbc-man.contoso.example", priority: 1 }],
        },
      ],
    },
  ],
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    applyNormalization,
    matchVoiceRoute,
    erlangB,
    erlangC,
    serviceLevel,
    averageSpeed,
    mediaKbps,
    US_TENANT_RULES,
    SAMPLE_POLICY,
    RESTRICTED_POLICY,
  };
}

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

"use strict";

const DATA = {
  tracks: [],
  lessons: [],
  labs: [],
  glossary: [],
  quiz: [],
  cards: [],
  scenarios: [],
  exams: [],
  map: { nodes: [], edges: [] },
  sources: [],
  charts: [],
  faults: [],
  bosses: [],
  audio: [],
  illustrations: [],
  flows: [],
  examFact: "",
  lessonIndex: [],
  termIndex: [],
  counts: {},
  tips: {},
};
const STORE = "mvcc-lab-v1";
const trackPacks = {};
const moduleFlags = {};
let topoHandle = null;

function disposeTopology() {
  if (topoHandle && topoHandle.dispose) topoHandle.dispose();
  topoHandle = null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(url);
  return response.json();
}

async function bootData() {
  const manifest = await fetchJson("data/manifest.json");
  DATA.tracks = manifest.tracks || [];
  DATA.labs = manifest.labs || [];
  DATA.scenarios = manifest.scenarios || [];
  DATA.exams = manifest.exams || [];
  DATA.map = manifest.map || { nodes: [], edges: [] };
  DATA.sources = manifest.sources || [];
  DATA.faults = manifest.faults || [];
  DATA.audio = manifest.audio || [];
  DATA.illustrations = manifest.illustrations || [];
  DATA.flows = manifest.flows || [];
  DATA.examFact = manifest.examFact || "";
  DATA.lessonIndex = manifest.lessonIndex || [];
  DATA.termIndex = manifest.termIndex || [];
  DATA.counts = manifest.counts || {};
  DATA.checked = manifest.checked || "";
  DATA.tips = manifest.tips || {};
}

async function ensureTrack(trackId) {
  if (!trackId) return null;
  if (trackPacks[trackId]) return trackPacks[trackId];
  const pack = await fetchJson("data/tracks/" + trackId + ".json");
  trackPacks[trackId] = pack;
  (pack.lessons || []).forEach((lesson) => {
    const index = DATA.lessons.findIndex((item) => item.id === lesson.id);
    if (index === -1) DATA.lessons.push(lesson);
    else DATA.lessons[index] = lesson;
  });
  return pack;
}

async function ensureModule(name) {
  if (moduleFlags[name]) return;
  const rows = await fetchJson("data/" + name + ".json");
  if (name === "quiz") DATA.quiz = rows;
  else if (name === "cards") DATA.cards = rows;
  else if (name === "glossary") DATA.glossary = rows;
  else if (name === "charts") DATA.charts = rows;
  else if (name === "bosses") DATA.bosses = rows;
  else {
    const unknown = name;
    throw new Error(unknown);
  }
  moduleFlags[name] = true;
}

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    return Object.assign(freshState(), parsed);
  } catch (err) {
    return freshState();
  }
}

function freshState() {
  return {
    lessons: [],
    labs: [],
    scenarios: [],
    cardsSeen: 0,
    bestQuiz: 0,
    quizTaken: 0,
    days: [],
    theme: "",
    sound: true,
    narration: true,
    voiceURI: "",
    rate: 1,
    reduceMotion: "system",
    font: "md",
    exam: {},
    achievements: [],
    sbcChecks: {},
    hooks: {},
    boss: {},
  };
}

let state = loadState();

function save() {
  state.achievements = computeAchievements();
  localStorage.setItem(STORE, JSON.stringify(state));
  paintChrome();
}

function todayKey() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + m + "-" + d;
}

function markStudy() {
  const key = todayKey();
  if (state.days.indexOf(key) === -1) state.days.push(key);
  state.days = state.days.slice(-90);
  save();
}

function streak() {
  const days = new Set(state.days);
  const cursor = new Date();
  if (!days.has(todayKey())) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  for (;;) {
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = cursor.getFullYear() + "-" + m + "-" + d;
    if (!days.has(key)) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function trackById(id) {
  return DATA.tracks.find((track) => track.id === id);
}

function lessonStub(id) {
  return (DATA.lessonIndex || []).find((lesson) => lesson.id === id) || null;
}

function lessonById(id) {
  return DATA.lessons.find((lesson) => lesson.id === id) || lessonStub(id);
}

function lessonsIn(trackId) {
  const full = DATA.lessons.filter((lesson) => lesson.track === trackId);
  const indexed = (DATA.lessonIndex || []).filter((lesson) => lesson.track === trackId);
  if (full.length && full.length >= indexed.length) return full;
  return indexed.length ? indexed : full;
}

function lessonTotal() {
  return (DATA.counts && DATA.counts.lessons) || (DATA.lessonIndex || []).length || DATA.lessons.length;
}

function progressCount() {
  return state.lessons.length;
}

function computeAchievements() {
  const done = new Set(state.lessons);
  const trackClosed = DATA.tracks.some((track) => {
    const items = lessonsIn(track.id);
    return items.length > 0 && items.every((lesson) => done.has(lesson.id));
  });
  const foundations = lessonsIn("t01").every((lesson) => done.has(lesson.id));
  const flags = [
    ["first", progressCount() >= 1],
    ["foundations", foundations],
    ["track", trackClosed],
    ["bench5", state.labs.length >= 5],
    ["bench", state.labs.length >= 20],
    ["quiz", state.bestQuiz >= 80],
    ["cards", state.cardsSeen >= 30],
    ["streak", streak() >= 3],
    ["scenes", state.scenarios.length >= 5],
    ["exam", Object.keys(state.exam).length >= 4],
    ["path", state.labs.indexOf("dr-path") !== -1],
    ["record", state.labs.indexOf("record-policy") !== -1],
    ["map", state.labs.indexOf("integrate-map") !== -1],
    ["boss", Object.keys(state.boss || {}).some((key) => state.boss[key] >= 80)],
  ];
  return flags.filter((item) => item[1]).map((item) => item[0]);
}

const ACH_COPY = {
  first: "First circuit — a lesson is marked complete in this browser.",
  foundations: "Foundations closed — the tenant track is complete.",
  track: "Track closed — every lesson in one track is complete.",
  bench5: "Bench time — five labs have a saved run.",
  bench: "Full bench — twenty labs have a saved run.",
  quiz: "Checked voice — a quiz set scored 80% or better.",
  cards: "Recall — thirty flashcards have been turned.",
  streak: "Three-day streak — study days landed on three dates in a row.",
  scenes: "On call — five scenarios have an answer.",
  exam: "Readiness map — four exam rows have a self-rating.",
  path: "Call path — the Direct Routing simulator has been run.",
  record: "Recorder — the compliance-recording builder has been run.",
  map: "Integration map — the ecosystem map lab has been run.",
  boss: "Boss exam — a certification sitting scored 80 percent or better.",
};

const THEMES = [
  { id: "light", label: "Light mica" },
  { id: "dark", label: "Dark acrylic" },
  { id: "hc", label: "High contrast" },
  { id: "teams", label: "Teams purple" },
];
const FONTS = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
  { id: "xl", label: "Extra large" },
];

function initialTheme() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function activeTheme() {
  const id = state.theme || initialTheme();
  return THEMES.some((theme) => theme.id === id) ? id : initialTheme();
}

function motionMode() {
  if (state.reduceMotion === "reduce") return "reduce";
  if (state.reduceMotion === "full") return "full";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduce";
  return "full";
}

function paintChrome() {
  const total = lessonTotal();
  const pct = total ? Math.round((progressCount() / total) * 100) : 0;
  $("#streak").textContent = "Streak " + streak();
  $("#done").textContent = pct + "%";
  $("#ach-count").textContent = computeAchievements().length + " badges";
  const root = document.documentElement;
  root.dataset.theme = activeTheme();
  const font = FONTS.some((item) => item.id === state.font) ? state.font : "md";
  root.dataset.font = font;
  root.dataset.motion = motionMode();
  const rate = $("#rate");
  if (rate && document.activeElement !== rate) rate.value = String(state.rate || 1);
  const listen = $("#listen");
  if (listen && state.narration === false && !speaking) listen.textContent = "Narration off";
}

function setTheme(next) {
  state.theme = next;
  save();
}

function flowSvg(steps, title) {
  const width = 920;
  const height = 168;
  const gap = width / (steps.length + 1);
  let circles = "";
  let labels = "";
  let path = "";
  steps.forEach((step, i) => {
    const x = gap * (i + 1);
    const y = 58;
    if (i < steps.length - 1) {
      path += "M " + x + " " + y + " L " + (x + gap) + " " + y + " ";
    }
    circles += '<circle cx="' + x + '" cy="' + y + '" r="22" class="node-btn" fill="var(--bg-3)" stroke="var(--teal)" stroke-width="2"></circle>';
    circles += '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" fill="var(--ink)" font-size="14" font-family="var(--sans)">' + (i + 1) + "</text>";
    labels += '<text x="' + x + '" y="112" text-anchor="middle" fill="var(--ink)" font-size="13" font-family="var(--sans)">' + esc(step.label) + "</text>";
    labels += '<text x="' + x + '" y="132" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="var(--sans)">' + esc(step.detail).slice(0, 42) + "</text>";
  });
  return (
    '<svg class="flow-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + esc(title) + '">' +
    "<title>" + esc(title) + "</title>" +
    '<path class="flow-line" d="' + path + '" fill="none" stroke="var(--violet)" stroke-width="3"></path>' +
    circles + labels +
    "</svg>"
  );
}

function chartSvg(chart) {
  const bars = chart.bars || [];
  const max = Math.max.apply(null, bars.map((bar) => bar.value).concat([1]));
  const width = 640;
  const height = 48 + bars.length * 36;
  let rows = "";
  bars.forEach((bar, i) => {
    const y = 28 + i * 36;
    const w = Math.max(4, (bar.value / max) * 360);
    rows += '<text x="0" y="' + (y + 14) + '" fill="var(--ink)" font-size="13" font-family="var(--sans)">' + esc(bar.label) + "</text>";
    rows += '<rect x="220" y="' + y + '" width="' + w + '" height="18" rx="6" fill="var(--teal)"></rect>';
    rows += '<text x="' + (228 + w) + '" y="' + (y + 14) + '" fill="var(--muted)" font-size="12" font-family="var(--sans)">' + esc(bar.display || bar.value) + "</text>";
  });
  const caption = (chart.title || "Chart") + ". " + (chart.note || "");
  return (
    '<svg class="chart-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + esc(caption) + '">' +
    "<title>" + esc(chart.title || "Chart") + "</title>" +
    rows +
    "</svg>"
  );
}

function depsHtml(track) {
  if (!track.depends || !track.depends.length) {
    return '<p class="deps"><span class="tag">Depends on: nothing earlier. Start here.</span></p>';
  }
  return (
    '<div class="deps">' +
    track.depends.map((id) => {
      const item = trackById(id);
      const label = item ? item.title : id;
      return '<a class="tag" href="#/track/' + esc(id) + '">Depends on ' + esc(label) + "</a>";
    }).join("") +
    "</div>"
  );
}

function sourceList(sources) {
  if (!sources || !sources.length) return "";
  return (
    "<ul>" +
    sources.map((source) => {
      return "<li><a href=\"" + esc(source.url) + "\">" + esc(source.title) + "</a> <span class=\"tiny\">accessed " + esc(source.accessed) + "</span></li>";
    }).join("") +
    "</ul>"
  );
}

function renderHome() {
  const counts = DATA.counts || {};
  const stats = [
    [counts.tracks || DATA.tracks.length, "Tracks"],
    [lessonTotal(), "Lessons"],
    [counts.labs || DATA.labs.length, "Zero-key labs"],
    [counts.quiz || 0, "Quiz questions"],
    [(DATA.flows || []).length, "Animated flows"],
    [(DATA.illustrations || []).length, "Illustrations"],
    [counts.cards || 0, "Flashcards"],
    [counts.scenarios || DATA.scenarios.length, "Scenarios"],
  ];
  const tiles = DATA.tracks.map((track) => {
    return (
      '<a class="track-tile" href="#/track/' + track.id + '">' +
      '<span class="idx">' + track.emoji + " " + esc(track.num) + "</span>" +
      "<strong>" + esc(track.title) + "</strong>" +
      "<em>" + lessonsIn(track.id).length + " lessons</em>" +
      "<span>" + esc(track.why) + "</span></a>"
    );
  }).join("");
  return (
    '<p class="kicker">Free offline campus · checked 14 October 2026</p>' +
    "<h1>Microsoft Voice &amp; Contact Center Lab</h1>" +
    '<p class="lede">A study bench for the engineer who has to explain a Teams call, a queue, a recorder, and a contact-center route without guessing. No account. No key. No network after this file is open.</p>' +
    '<p class="callout">' + esc(DATA.examFact || "") + "</p>" +
    '<div class="hero-actions row">' +
    '<a class="primary" href="#/track/t01">Start with the tenant</a>' +
    '<a class="ghost" href="#/lab/dr-path">Trace a Direct Routing call</a>' +
    '<a class="ghost" href="#/powershell">Open the Teams shell</a>' +
    '<a class="ghost" href="#/topology">Open the SBC mesh</a>' +
    '<a class="ghost" href="#/tips">Tips and traps</a>' +
    "</div>" +
    '<div class="grid stats">' + stats.map((item) => '<div class="stat"><b>' + item[0] + "</b><span>" + item[1] + "</span></div>").join("") + "</div>" +
    '<div class="hero-frame">' +
    '<div class="topology-stage" id="home-stage">' +
    '<div class="gl-fallback" id="home-fallback">' + callRibbon() + "</div>" +
    '<canvas id="home-gl" hidden aria-label="Three.js geo-redundant SBC topology"></canvas>' +
    "</div></div>" +
    '<div class="scenario-bar">' +
    '<button class="primary" id="home-orbit" type="button">Orbit the SBC mesh</button>' +
    '<label class="row"><input id="home-lon" type="checkbox"> London primary down</label>' +
    '<label class="row"><input id="home-wan" type="checkbox"> Manchester WAN down</label>' +
    '<label class="row"><input id="home-cert" type="checkbox"> Certificate mismatch</label>' +
    "</div>" +
    "<h2>Seventeen tracks</h2>" +
    '<div class="track-grid">' + tiles + "</div>" +
    '<div class="split">' +
    '<article class="panel"><h2>Why this order</h2>' +
    "<p>Licenses, dial plans, and SBCs fail in public when the tenant, the identity, and the network were never settled. The tracks run from that ground up through Teams Phone, the contact center, and the systems that sit beside the call: recording, workforce management, emergency location, analytics, CRM, and agents.</p>" +
    "<p>Every track names why it matters and what it depends on. Every lesson has a flow, a chart, a fault you can recognize, and a line you can say in an interview. Figures that are teaching models are labeled. Dates sit on anything that can move.</p>" +
    '<p class="tiny">Not a Microsoft, Cisco, AudioCodes, Ribbon, Oracle, Genesys, or Amazon publication. The vendor page wins over this file when they disagree.</p></article>' +
    '<article class="panel"><h2>Tonight, if you have one hour</h2><ol>' +
    '<li><a href="#/lesson/t01-tenant">The tenant boundary</a></li>' +
    '<li><a href="#/lesson/t05-dr">Direct Routing</a></li>' +
    '<li><a href="#/lab/dial-plan">Normalization tester</a></li>' +
    '<li><a href="#/lab/route-match">Voice-routing matcher</a></li>' +
    '<li><a href="#/lesson/t17-map">The ecosystem mind map</a></li>' +
    "</ol><p><a href=\"#/exam\">Exam status board</a> · <a href=\"#/glossary\">Glossary</a> · <a href=\"#/sources\">Sources</a></p></article></div>"
  );
}

function callRibbon() {
  return (
    '<svg viewBox="0 0 440 180" role="img" aria-label="Teams client to SIP proxy to SBC to carrier">' +
    "<title>Reference call path</title>" +
    '<rect x="16" y="58" width="90" height="44" rx="12" fill="var(--bg-3)" stroke="var(--teal)"></rect>' +
    '<text x="61" y="84" text-anchor="middle" fill="var(--ink)" font-size="12">Teams</text>' +
    '<rect x="126" y="58" width="90" height="44" rx="12" fill="var(--bg-3)" stroke="var(--violet)"></rect>' +
    '<text x="171" y="84" text-anchor="middle" fill="var(--ink)" font-size="12">SIP proxy</text>' +
    '<rect x="236" y="58" width="80" height="44" rx="12" fill="var(--bg-3)" stroke="var(--amber)"></rect>' +
    '<text x="276" y="84" text-anchor="middle" fill="var(--ink)" font-size="12">SBC</text>' +
    '<rect x="336" y="58" width="88" height="44" rx="12" fill="var(--bg-3)" stroke="var(--teal)"></rect>' +
    '<text x="380" y="84" text-anchor="middle" fill="var(--ink)" font-size="12">Carrier</text>' +
    '<path class="flow-line" d="M106 80 H126 M216 80 H236 M316 80 H336" stroke="var(--teal)" stroke-width="3" fill="none"></path>' +
    '<text x="220" y="28" text-anchor="middle" fill="var(--muted)" font-size="12">TLS 5061 · SRTP · DSCP 46 audio</text>' +
    '<text x="220" y="150" text-anchor="middle" fill="var(--muted)" font-size="12">Signaling stays with Teams. Media may bypass.</text>' +
    "</svg>"
  );
}

function renderTrack(id) {
  const track = trackById(id);
  if (!track) return missing();
  const lessons = lessonsIn(id);
  const done = lessons.filter((lesson) => state.lessons.indexOf(lesson.id) !== -1).length;
  const labs = DATA.labs.filter((lab) => lab.track === id);
  return (
    '<p class="kicker">Track ' + esc(track.num) + " · " + esc(track.emoji) + "</p>" +
    "<h1>" + esc(track.title) + "</h1>" +
    '<div class="callout"><strong>Why it matters. </strong>' + esc(track.why) + "</div>" +
    depsHtml(track) +
    '<div class="progress" aria-label="Track progress"><span style="width:' + (lessons.length ? (done / lessons.length) * 100 : 0) + '%"></span></div>' +
    '<p class="tiny">' + done + " of " + lessons.length + " lessons marked in this browser. " + esc(track.outcome) + "</p>" +
    chartSvg(track.chart) +
    '<p class="tiny">' + esc(track.chart.note) + "</p>" +
    tipsBlock(id) +
    '<div class="lesson-list">' +
    lessons.map((lesson, index) => {
      const on = state.lessons.indexOf(lesson.id) !== -1;
      return (
        '<a class="lesson-card" href="#/lesson/' + lesson.id + '"><span class="num">' + String(index + 1).padStart(2, "0") + '</span><span><strong>' + esc(lesson.title) + "</strong><br><span class=\"tiny\">" + lesson.minutes + " min · " + esc(lesson.say).slice(0, 110) + '</span></span><span class="check ' + (on ? "on" : "") + '" aria-label="' + (on ? "complete" : "not complete") + '"></span></a>'
      );
    }).join("") +
    "</div>" +
    (labs.length ? "<h2>Labs on this track</h2><div class=\"lab-grid\">" + labs.map(labCard).join("") + "</div>" : "")
  );
}

function tipPack(id) {
  return (DATA.tips && DATA.tips[id]) || null;
}

function tipsBlock(id) {
  const pack = tipPack(id);
  if (!pack) return "";
  const tips = (pack.tips || []).map((line) => "<li>" + esc(line) + "</li>").join("");
  const traps = (pack.traps || []).map((line) => "<li>" + esc(line) + "</li>").join("");
  return (
    '<section class="panel tips">' +
    "<h2>Tips and traps</h2>" +
    "<h3>Pro tips</h3><ul>" + tips + "</ul>" +
    "<h3>Interview traps</h3><ul>" + traps + "</ul>" +
    "<h3>Cheat sheet</h3><pre class=\"sheet\">" + esc(pack.sheet || "") + "</pre>" +
    '<p><a href="#/tips/' + esc(id) + '">Open this sheet</a></p>' +
    "</section>"
  );
}

function labCard(lab) {
  return '<a class="card" href="#/lab/' + lab.id + '"><p class="kicker">Lab</p><h3>' + esc(lab.title) + "</h3><p>" + esc(lab.summary) + "</p></a>";
}

function figureBlock(fig) {
  return '<figure class="figure panel"><div class="figure-canvas">' + fig.svg + '</div><figcaption><strong>' + esc(fig.title) + '.</strong> ' + esc(fig.caption) + "</figcaption></figure>";
}

function figuresHtml(lesson) {
  const figs = lesson.figures || [];
  const flows = figs.filter((fig) => fig.animated);
  const diagrams = figs.filter((fig) => !fig.animated);
  const lead = diagrams.slice(0, 3);
  const rest = diagrams.slice(3);
  return (
    '<div class="figure-stack">' +
    flows.map(figureBlock).join("") +
    '<div class="figure-grid">' + lead.map(figureBlock).join("") + "</div>" +
    (rest.length ? '<details class="more-figures"><summary>' + rest.length + ' more illustrations in this lesson</summary><div class="figure-grid">' + rest.map(figureBlock).join("") + "</div></details>" : "") +
    "</div>" +
    "<h2>Step the flow</h2>" +
    '<div id="flow-player"></div>' +
    "<ol>" + (lesson.flow || []).map((step) => "<li><strong>" + esc(step.label) + ".</strong> " + esc(step.detail) + "</li>").join("") + "</ol>"
  );
}

const TRACK_CLIP = {
  t01: "intro-tenant",
  t02: "intro-tenant",
  t03: "intro-exams",
  t04: "intro-qos",
  t05: "intro-routing",
  t06: "intro-routing",
  t07: "intro-queue",
  t08: "intro-emergency",
  t09: "intro-routing",
  t10: "intro-routing",
  t11: "tone-dial",
  t12: "intro-qos",
  t13: "intro-cc",
  t14: "intro-cc",
  t15: "intro-cc",
  t16: "intro-exams",
  t17: "intro-record",
};

function audioFor(trackId) {
  const id = TRACK_CLIP[trackId];
  const clip = (DATA.audio || []).find((item) => item.id === id);
  if (!clip) return "";
  return '<figure class="panel audio-card"><figcaption><strong>' + esc(clip.title) + '.</strong> ' + esc(clip.blurb) + '</figcaption><audio controls preload="none" src="' + esc(clip.file) + '"></audio></figure>';
}

let audioCtx = null;

function playTone(freq, ms, force) {
  if (state.sound === false && !force) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + ms / 1000 + 0.02);
  } catch (err) {
    /* sound is optional */
  }
}

function blip(kind) {
  if (kind === "done") {
    playTone(523, 80, false);
    window.setTimeout(() => playTone(784, 120, false), 90);
    return;
  }
  playTone(kind === "test" ? 660 : 520, 90, kind === "test");
}

function confetti() {
  blip("done");
  if (motionMode() === "reduce") return;
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.setAttribute("aria-hidden", "true");
  const colors = ["#3ee0c3", "#a89bff", "#f0b429", "#ff7d92", "#7ddea2"];
  for (let i = 0; i < 42; i += 1) {
    const bit = document.createElement("i");
    bit.style.left = Math.random() * 100 + "%";
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = Math.random() * 0.25 + "s";
    bit.style.transform = "rotate(" + Math.floor(Math.random() * 80) + "deg)";
    layer.appendChild(bit);
  }
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), 1700);
}

function renderLesson(id) {
  const lesson = lessonById(id);
  if (!lesson) return missing();
  const track = trackById(lesson.track);
  const siblings = lessonsIn(lesson.track);
  const index = siblings.findIndex((item) => item.id === id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const on = state.lessons.indexOf(id) !== -1;
  window.__listen = lesson.listen;
  return (
    '<p class="kicker"><a href="#/track/' + track.id + '">' + esc(track.title) + "</a> · Lesson " + (index + 1) + " of " + siblings.length + "</p>" +
    "<h1>" + esc(lesson.title) + "</h1>" +
    '<div class="callout"><strong>Why it matters. </strong>' + esc(lesson.why) + "</div>" +
    '<div class="deps">' + lesson.depends.map((item) => '<span class="tag">Depends on ' + esc(item) + "</span>").join("") + "</div>" +
    '<div class="prose">' + lesson.body.map((paragraph) => "<p>" + esc(paragraph) + "</p>").join("") + "</div>" +
    figuresHtml(lesson) +
    '<div class="two"><article class="callout"><strong>Say this. </strong>' + esc(lesson.say) + '</article><article class="callout warn"><strong>Fault you will see. </strong>' + esc(lesson.fault) + "</article></div>" +
    '<div class="row">' +
    '<a class="primary" href="#/lab/' + esc(lesson.tryLab || "dr-path") + '">Try it</a>' +
    (lesson.lab && lesson.lab !== lesson.tryLab ? '<a class="ghost" href="#/lab/' + esc(lesson.lab) + '">Open the lab</a>' : "") +
    "</div>" +
    audioFor(lesson.track) +
    "<h2>Sources</h2>" + sourceList(lesson.sources) +
    '<div class="row">' +
    '<button class="primary" id="mark" type="button">' + (on ? "Completed in this browser" : "Mark complete") + "</button>" +
    (prev ? '<a class="ghost" href="#/lesson/' + prev.id + '">Previous</a>' : "") +
    (next ? '<a class="ghost" href="#/lesson/' + next.id + '">Next</a>' : "") +
    "</div>"
  );
}

function renderLabs() {
  return (
    '<p class="kicker">Zero-key bench</p><h1>Labs</h1>' +
    "<p class=\"lede\">Nothing here calls Microsoft, a carrier, or a model. The matchers are teaching models of the documented design. They are labeled where they simplify a production tie-break.</p>" +
    '<div class="lab-grid">' + DATA.labs.map(labCard).join("") + "</div>"
  );
}

function noteRun(id) {
  if (state.labs.indexOf(id) === -1) state.labs.push(id);
  markStudy();
}

function renderLab(id) {
  const lab = DATA.labs.find((item) => item.id === id);
  if (!lab) return missing();
  const body = (LABS[id] || fallbackLab)(lab);
  window.__listen = lab.summary;
  return '<p class="kicker">Lab · ' + esc(lab.minutes) + " min</p><h1>" + esc(lab.title) + "</h1><p class=\"lede\">" + esc(lab.summary) + "</p>" + body;
}

function field(id, label, value, type) {
  return '<label class="field">' + esc(label) + '<input id="' + id + '" type="' + (type || "text") + '" value="' + esc(value || "") + '"></label>';
}

function select(id, label, options, current) {
  return '<label class="field">' + esc(label) + "<select id=\"" + id + "\">" +
    options.map((opt) => '<option value="' + esc(opt[0]) + '"' + (opt[0] === current ? " selected" : "") + ">" + esc(opt[1]) + "</option>").join("") +
    "</select></label>";
}

const LABS = {
  "dr-path": function () {
    return (
      '<div class="controls">' +
      select("dr-num", "Dialed number", [["+442075554010", "+44 20 7555 4010"], ["4255550100", "425 555 0100"], ["999", "999 emergency"], ["100", "100 (no rule)"]], "+442075554010") +
      select("dr-pol", "Voice routing policy", [["uk", "UK-HQ-International"], ["branch", "Branch-National-Only"]], "uk") +
      select("dr-sbc", "Primary SBC OPTIONS", [["up", "Healthy"], ["down", "No response"]], "up") +
      select("dr-bak", "Backup SBC", [["up", "Healthy"], ["down", "Down"]], "up") +
      select("dr-cert", "Certificate", [["ok", "SAN matches FQDN"], ["name", "Name mismatch"], ["expired", "Expired"], ["private", "Private CA"]], "ok") +
      select("dr-media", "Media", [["proxy", "Via media processor"], ["bypass", "Bypass candidate, same site"]], "proxy") +
      select("dr-lic", "Teams Phone license", [["yes", "Assigned"], ["no", "Missing"]], "yes") +
      '<button class="primary" id="dr-run" type="button">Run the path</button></div>' +
      '<div id="dr-ladder"></div>' +
      '<div id="dr-out" class="panel" aria-live="polite"></div>'
    );
  },
  "route-match": function () {
    return (
      '<div class="controls">' +
      field("rt-num", "E.164 or digits", "+442075554010") +
      select("rt-pol", "Policy", [["uk", "UK-HQ-International"], ["branch", "Branch-National-Only"]], "uk") +
      '<button class="primary" id="rt-run" type="button">Match</button></div>' +
      '<div id="rt-out" class="panel" aria-live="polite"></div>' +
      '<p class="tiny">Teaching model: usages are walked in policy order. Inside a usage, the lowest priority number wins. Confirm gateway priority on the current voice routing article before you treat a tie as settled in production.</p>'
    );
  },
  "dial-plan": function () {
    return (
      '<div class="controls">' +
      field("dp-num", "What the person dialed", "4255550100") +
      '<button class="primary" id="dp-run" type="button">Normalize</button></div>' +
      '<div id="dp-out" class="panel" aria-live="polite"></div>' +
      "<h2>Regex sandbox</h2>" +
      "<p>Edit a pattern and a translation. Capture groups light up on the dialed string. Punctuation is stripped the same way the tenant rules strip it.</p>" +
      '<div class="controls">' +
      field("rx-pat", "Pattern", "^(\\d{10})$") +
      field("rx-tr", "Translation", "+1$1") +
      field("rx-in", "Dialed", "4255550100") +
      '<button class="primary" id="rx-run" type="button">Test pattern</button></div>' +
      '<div class="row">' +
      ["4255550100", "+442075554010", "911", "(425) 555-0100", "999"].map((sample) => '<button type="button" class="chip" data-sample="' + esc(sample) + '">' + esc(sample) + "</button>").join("") +
      "</div>" +
      '<div id="rx-out" class="panel" aria-live="polite"></div>' +
      "<h2>Rules, first match wins</h2>" + rulesTable(US_TENANT_RULES)
    );
  },
  "aa-cq": function () {
    return (
      '<div class="two">' +
      '<div class="panel"><h2>Auto attendant</h2>' +
      field("aa-name", "Name", "Main") +
      select("aa-hours", "Hours", [["set", "Business hours set"], ["none", "Missing"]], "set") +
      select("aa-greet", "Greeting", [["set", "Recorded"], ["none", "Silent"]], "set") +
      field("aa-key", "Menu key 1 target", "Sales queue") +
      select("aa-op", "Operator", [["set", "Named"], ["none", "Missing"]], "set") +
      "</div><div class=\"panel\"><h2>Call queue</h2>" +
      select("cq-method", "Routing", [["attendant", "Attendant"], ["serial", "Serial"], ["round", "Round robin"], ["idle", "Longest idle"]], "attendant") +
      field("cq-agents", "Agents (names)", "Avery, Blake") +
      field("cq-timeout", "Timeout seconds", "30", "number") +
      field("cq-over", "Overflow target", "Voicemail") +
      select("cq-ra", "Resource account license", [["yes", "Teams Phone Resource Account"], ["std", "Teams Phone Standard (wrong)"], ["no", "None"]], "yes") +
      select("cq-out", "External transfer", [["no", "No"], ["yes", "Yes"]], "no") +
      select("cq-payg", "Pay-as-you-go or credits", [["yes", "Funded"], ["no", "Not funded"]], "no") +
      "</div></div>" +
      '<button class="primary" id="aa-run" type="button">Check the design</button>' +
      '<div id="aa-out" class="panel" aria-live="polite"></div>'
    );
  },
  "sbc-check": function () {
    const vendors = ["AudioCodes", "Ribbon", "Oracle", "Cisco CUBE"];
    const items = [
      ["cert", "Public certificate, SAN contains the paired FQDN"],
      ["dns", "Public DNS for that FQDN, domain verified in the tenant"],
      ["fqdn", "FQDN is not an onmicrosoft.com name"],
      ["tls", "SIP/TLS to sip, sip2, and sip3.pstnhub.microsoft.com on 5061"],
      ["fw", "Signaling and media ranges from the current Direct Routing plan, not a stale copy"],
      ["opt", "SIP OPTIONS answered while the trunk should be in service"],
      ["codec", "Shared codec: SILK, G.711, G.722, or G.729. AMR-WB only if bypass is off"],
      ["media", "At least two media ports budgeted per concurrent call"],
      ["fail", "Second gateway or second proxy rehearsed"],
      ["e911", "Emergency route tested on a carrier test number, not a guessed emergency call"],
    ];
    return (
      select("sbc-v", "Vendor family", vendors.map((name) => [name, name]), "AudioCodes") +
      '<div id="sbc-list" class="panel">' +
      items.map((item) => '<label class="row"><input type="checkbox" data-sbc="' + item[0] + '"> ' + esc(item[1]) + "</label>").join("") +
      "</div>" +
      '<button class="primary" id="sbc-run" type="button">Score the checklist</button>' +
      '<div id="sbc-out" aria-live="polite"></div>' +
      '<p class="tiny">Microsoft supports Direct Routing on certified SBCs. Open the vendor case first. This list is the shared gate, not a Mediant, Ribbon, Oracle, or IOS-XE config.</p>'
    );
  },
  "tls-hand": function () {
    return (
      select("tls-fault", "Inject a fault", [["ok", "Healthy handshake"], ["name", "SAN does not match the paired FQDN"], ["expired", "Certificate expired"], ["private", "Private CA, not in the Microsoft trusted roots"], ["old", "TLS 1.0 offered"]], "ok") +
      '<button class="primary" id="tls-run" type="button">Step the handshake</button>' +
      '<div id="tls-out" class="panel" aria-live="polite"></div>'
    );
  },
  "cqd-fault": function () {
    return '<div id="cqd-out"></div>';
  },
  "license-pick": function () {
    return (
      '<div class="controls">' +
      select("lic-pstn", "Who provides the PSTN?", [["ms", "Microsoft Calling Plan"], ["oc", "Operator Connect"], ["mob", "Teams Phone Mobile"], ["dr", "Our SBC, Direct Routing"], ["none", "Internal Teams calls only"]], "dr") +
      select("lic-meet", "Dial-in numbers for meetings?", [["yes", "Yes"], ["no", "No"]], "no") +
      select("lic-room", "A Teams Room?", [["no", "No"], ["basic", "Basic room"], ["pro", "Managed room"]], "no") +
      select("lic-aa", "An auto attendant or queue?", [["no", "No"], ["yes", "Yes"]], "yes") +
      select("lic-out", "Queue transfers out to the PSTN?", [["no", "No"], ["yes", "Yes"]], "no") +
      '<button class="primary" id="lic-run" type="button">Build the set</button></div>' +
      '<div id="lic-out" class="panel" aria-live="polite"></div>'
    );
  },
  "cucm-map": function () {
    return (
      select("cu-obj", "CUCM object", [
        ["css", "Calling search space"],
        ["pt", "Partition"],
        ["rp", "Route pattern"],
        ["tp", "Translation pattern"],
        ["trunk", "SIP trunk"],
        ["dp", "Device pool / region codec"],
        ["em", "Extension mobility"],
      ], "css") +
      '<div id="cu-out" class="panel" aria-live="polite"></div>'
    );
  },
  "routing-designer": function () {
    return (
      '<div class="controls">' +
      select("ur-lang", "Language", [["en", "English"], ["fr", "French"]], "fr") +
      select("ur-intent", "Intent", [["bill", "Billing"], ["out", "Outage"]], "bill") +
      field("ur-cap", "French billing agents free", "1", "number") +
      '<button class="primary" id="ur-run" type="button">Route the work item</button></div>' +
      '<div id="ur-out" class="panel" aria-live="polite"></div>'
    );
  },
  "acs-flow": function () {
    return (
      '<p>Build a call-automation sequence. Then press a digit.</p>' +
      '<div class="controls">' +
      '<button type="button" class="ghost" data-block="answer">Answer</button>' +
      '<button type="button" class="ghost" data-block="play">Play prompt</button>' +
      '<button type="button" class="ghost" data-block="dtmf">Recognize DTMF</button>' +
      '<button type="button" class="ghost" data-block="agent">Transfer to human</button>' +
      '<button type="button" class="ghost" data-block="hangup">Hang up</button>' +
      '<button type="button" class="ghost" id="acs-clear">Clear</button></div>' +
      '<ol id="acs-seq"></ol>' +
      '<div class="controls"><button class="primary" id="acs-1" type="button">Caller presses 1</button><button class="ghost" id="acs-9" type="button">Caller presses 9 (escape)</button></div>' +
      '<div id="acs-out" class="panel" aria-live="polite"></div>'
    );
  },
  erlang: function () {
    return (
      '<div class="controls">' +
      field("er-calls", "Calls in the interval", "120", "number") +
      field("er-aht", "Average handle seconds", "180", "number") +
      field("er-int", "Interval minutes", "30", "number") +
      field("er-tgt", "Answer target seconds", "20", "number") +
      field("er-n", "Agents", "14", "number") +
      field("er-sh", "Shrinkage (0 to 0.5)", "0.3", "text") +
      '<button class="primary" id="er-run" type="button">Calculate</button></div>' +
      '<div id="er-out" aria-live="polite"></div>' +
      '<p class="tiny">Erlang C and the service-level exponential are the standard teaching forms. Shrinkage here is a planning factor: roster = agents / (1 − shrinkage). It is not a forecast for a real queue.</p>'
    );
  },
  "exam-map": function () {
    const rows = DATA.exams.map((exam) => {
      const val = state.exam[exam.id] || "0";
      return '<tr><td><strong>' + esc(exam.code) + "</strong><br>" + esc(exam.name) + '<br><span class="tiny">' + esc(exam.status) + "</span></td><td>" +
        '<label class="sr" for="ex-' + exam.id + '">Self rating for ' + esc(exam.code) + '</label>' +
        '<input id="ex-' + exam.id + '" data-exam="' + exam.id + '" type="range" min="0" max="3" value="' + esc(val) + '"></td><td>' + esc(exam.next) + "</td></tr>";
    }).join("");
    return '<table><thead><tr><th>Exam</th><th>Self rating 0–3</th><th>Do this next</th></tr></thead><tbody>' + rows + '</tbody></table><button class="primary" id="ex-save" type="button">Save ratings in this browser</button><div id="ex-out" aria-live="polite"></div>';
  },
  "qos-mark": function () {
    return select("qos-kind", "Media", [["audio", "Audio"], ["video", "Video"], ["share", "Screen share"], ["sig", "Calling and meetings signaling"]], "audio") +
      '<div id="qos-out" class="panel" aria-live="polite"></div>';
  },
  "e911-match": function () {
    return '<div class="controls">' +
      field("e911-ip", "Client address", "10.20.4.15") +
      field("e911-bssid", "BSSID", "A1:B2:C3:D4:E5:10") +
      '<button class="primary" id="e911-run" type="button">Look up</button></div>' +
      '<div id="e911-board"></div>' +
      '<div id="e911-out" class="panel" aria-live="polite"></div>' +
      '<p class="tiny">Teaching topology. BSSID wins over subnet when both are present. A VPN pool is not a dispatchable civic address. Do not place a real emergency call from this lab.</p>';
  },
  "options-health": function () {
    return select("opt-miss", "Consecutive missed OPTIONS", [["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]], "0") +
      '<div id="opt-out" class="panel" aria-live="polite"></div>' +
      '<p class="tiny">Teams uses SIP OPTIONS as a health signal and shows SBC status in the admin center. This lab does not claim a specific production failure count. Treat repeated misses as a trunk you should pull from the route.</p>';
  },
  bypass: function () {
    return '<div class="controls">' +
      select("by-site", "User network", [["same", "Same site as the SBC"], ["other", "Another site"], ["vpn", "On a full-tunnel VPN"]], "same") +
      select("by-flag", "Media bypass on the gateway", [["on", "Enabled"], ["off", "Disabled"]], "on") +
      select("by-lbr", "Location-based routing", [["off", "Off"], ["on", "On for this site"]], "off") +
      '<button class="primary" id="by-run" type="button">Choose the media path</button></div><div id="by-out" class="panel" aria-live="polite"></div>';
  },
  coexist: function () {
    return '<div class="controls">' +
      field("cx-cucm", "Extensions still on CUCM", "1xxx") +
      field("cx-teams", "Numbers on Teams", "+44207555xxxx") +
      select("cx-norm", "Who normalizes?", [["teams", "Teams dial plan only"], ["cucm", "CUCM translation only"], ["both", "Both"], ["none", "Neither"]], "both") +
      '<button class="primary" id="cx-run" type="button">Read the bridge</button></div><div id="cx-out" class="panel" aria-live="polite"></div>';
  },
  "usage-build": function () {
    return '<p>Add a route, then test a number against the policy you just built.</p>' +
      '<div class="controls">' + field("ub-name", "Route name", "UK mobile") +
      field("ub-pat", "Pattern", "^\\+447\\d{9}$") +
      field("ub-gw", "Gateway FQDN", "sbc-lon.contoso.example") +
      '<button class="ghost" id="ub-add" type="button">Add route</button></div>' +
      '<ul id="ub-list"></ul>' +
      '<div class="controls">' + field("ub-test", "Test number", "+447555010012") +
      '<button class="primary" id="ub-run" type="button">Test</button></div><div id="ub-out" aria-live="polite"></div>';
  },
  bandwidth: function () {
    return '<div class="controls">' +
      select("bw-codec", "Codec", [["g711", "G.711"], ["g729", "G.729"], ["g722", "G.722"]], "g711") +
      field("bw-calls", "Concurrent calls", "30", "number") +
      '<button class="primary" id="bw-run" type="button">Calculate</button></div><div id="bw-out" class="panel" aria-live="polite"></div>';
  },
  "ivr-intent": function () {
    return '<div class="controls">' +
      field("iv-utt", "Utterance", "my bill is wrong") +
      select("iv-esc", "Escape to a human", [["yes", "DTMF 0 always works"], ["no", "No escape"]], "yes") +
      '<button class="primary" id="iv-run" type="button">Classify</button></div><div id="iv-out" class="panel" aria-live="polite"></div>';
  },
  "sba-time": function () {
    return select("sba-wan", "Path to Microsoft 365", [["up", "Up"], ["down", "Down"]], "down") +
      '<div id="sba-out" class="panel" aria-live="polite"></div>';
  },
  "record-policy": function () {
    return '<div class="controls">' +
      select("rec-vendor", "Certified recorder in the tenant", [["yes", "Yes"], ["no", "Not yet"]], "yes") +
      select("rec-app", "Application instance", [["yes", "Created"], ["no", "Missing"]], "no") +
      select("rec-on", "Policy enabled", [["yes", "Enabled"], ["no", "Disabled"]], "yes") +
      select("rec-grant", "Grant", [["user", "Users who must be recorded"], ["none", "Nobody"]], "user") +
      select("rec-note", "Participant notification", [["yes", "Partner confirms it"], ["no", "Unknown"]], "yes") +
      '<button class="primary" id="rec-run" type="button">Review</button></div><div id="rec-out" class="panel" aria-live="polite"></div>';
  },
  "integrate-map": function () {
    return select("in-goal", "Goal", [
      ["record", "Record regulated PSTN calls"],
      ["pop", "Pop a CRM case"],
      ["staff", "Staff next week’s queue"],
      ["survive", "Keep PSTN up when the WAN fails"],
      ["quality", "Explain a bad building in the report"],
      ["bot", "Put an agent in front of the queue"],
    ], "record") +
      '<div id="in-out" class="panel" aria-live="polite"></div>';
  },
  "hook-plan": function () {
    const hooks = [
      ["callid", "Store the SIP Call-ID with the CRM timeline"],
      ["policy", "Assign the recording policy in the same change as the number"],
      ["overflow", "Overflow target can become a bot without a new number"],
      ["subnet", "One subnet list feeds E911, LBR, and the CQD building"],
      ["name", "Routes use the SBC FQDN, never a copied proxy IP"],
      ["wfm", "Queue intervals can leave the contact center for WFM"],
      ["escape", "The voice agent has a human escape that is tested"],
      ["cert", "Certificate expiry is a monitored date"],
    ];
    return hooks.map((hook) => '<label class="row"><input type="checkbox" data-hook="' + hook[0] + '"> ' + esc(hook[1]) + "</label>").join("") +
      '<button class="primary" id="hook-run" type="button">Read the missing seams</button><div id="hook-out" aria-live="polite"></div>';
  },
};

function fallbackLab() {
  return "<p>This lab is not wired.</p>";
}

function rulesTable(rules) {
  return "<table><thead><tr><th>#</th><th>Name</th><th>Pattern</th><th>Translation</th></tr></thead><tbody>" +
    rules.map((rule, i) => "<tr><td>" + (i + 1) + "</td><td>" + esc(rule.name) + "</td><td><code>" + esc(rule.pattern) + "</code></td><td><code>" + esc(rule.translation) + "</code></td></tr>").join("") +
    "</tbody></table>";
}

function policyByKey(key) {
  return key === "branch" ? RESTRICTED_POLICY : SAMPLE_POLICY;
}

function ladder(rows) {
  return '<div class="ladder"><table><thead><tr><th>Step</th><th>From</th><th>To</th><th>What</th><th>Result</th></tr></thead><tbody>' +
    rows.map((row, i) => "<tr><td>" + (i + 1) + "</td><td>" + esc(row[0]) + "</td><td>" + esc(row[1]) + "</td><td>" + esc(row[2]) + "</td><td>" + esc(row[3]) + "</td></tr>").join("") +
    "</tbody></table></div>";
}

function wireLabs(id) {
  if (id === "dr-path") {
    $("#dr-run").onclick = function () {
      noteRun("dr-path");
      const dialed = $("#dr-num").value;
      const policy = policyByKey($("#dr-pol").value);
      const rows = [];
      const steps = [];
      function push(from, to, title, detail, inspect, fail) {
        rows.push([from, to, title, detail]);
        steps.push({
          from: from,
          to: to,
          title: title,
          detail: detail,
          inspect: inspect || (from + " -> " + to + "\n" + title + "\n" + detail),
          fail: !!fail,
        });
      }
      function finish() {
        $("#dr-out").innerHTML = ladder(rows);
        mountSipLadder($("#dr-ladder"), steps);
      }
      if ($("#dr-lic").value === "no") {
        push("Admin", "User", "Teams Phone license", "Stop. No PSTN.", "License check\nTeams Phone is not assigned.\nDirect Routing never starts.", true);
        finish();
        return;
      }
      const norm = applyNormalization(dialed, US_TENANT_RULES);
      push("Client", "Dial plan", "Normalize " + dialed, norm.ok ? norm.output + " via " + norm.rule : norm.error, "Dialed " + dialed + "\n" + (norm.ok ? "Rule: " + norm.rule + "\nE.164: " + norm.output : norm.error), !norm.ok);
      if (!norm.ok) {
        finish();
        return;
      }
      const match = matchVoiceRoute(norm.output, policy);
      push("Policy", "Route", policy.name, match.ok ? match.usage + " / " + match.route : "No route", "Voice routing policy " + policy.name + "\n" + (match.ok ? match.usage + " / " + match.route : "No usage matched."), !match.ok);
      if (!match.ok) {
        finish();
        return;
      }
      const primaryUp = $("#dr-sbc").value === "up";
      const backupUp = $("#dr-bak").value === "up";
      const gw = match.gateways[0];
      const alt = match.gateways[1];
      let target = gw ? gw.fqdn : "sbc";
      push("Client", "Teams", "TLS ClientHello", "sip.pstnhub.microsoft.com:5061", "ClientHello\nTLS 1.2+\nSNI: sip.pstnhub.microsoft.com\nport: 5061");
      const cert = $("#dr-cert").value;
      const certMsg = { ok: "TLS up, SAN matches", name: "Fail. Name mismatch.", expired: "Fail. Expired.", private: "Fail. Private CA." }[cert];
      push("SBC", "Teams", "Certificate", certMsg, "Certificate\npaired FQDN must be in the SAN\npublic CA\n" + certMsg, cert !== "ok");
      if (cert !== "ok") {
        finish();
        return;
      }
      if (!primaryUp) {
        push("Teams", "SBC", "SIP OPTIONS", "Miss on " + target, "OPTIONS sip:" + target + " SIP/2.0\nno 200 OK\nmiss count rising", true);
        if (backupUp && alt) {
          target = alt.fqdn;
          push("Teams", "SBC", "Failover gateway", "Use priority 2 " + target, "Route lists " + target + " at the next priority.\nOPTIONS expected 200 OK.");
        } else if (backupUp && !alt) {
          push("Teams", "SBC", "No second gateway", "Call fails", "This route has one gateway. Failover was selected and there is nowhere to send the INVITE.", true);
          finish();
          return;
        } else {
          push("Teams", "SBC", "Trunk", "Unavailable", "Primary missed OPTIONS and the backup is down.", true);
          finish();
          return;
        }
      } else {
        push("Teams", "SBC", "SIP OPTIONS", "200 OK " + target, "OPTIONS sip:" + target + " SIP/2.0\nSIP/2.0 200 OK\ntrunk in service");
      }
      push("Teams", "SBC", "INVITE", "SDP offer toward " + target, "INVITE sip:" + norm.output + " SIP/2.0\nVia: SIP/2.0/TLS\nCall-ID: lab-" + norm.output.slice(-4) + "\nContent-Type: application/sdp");
      push("SBC", "Teams", "100 Trying", "Transaction accepted", "SIP/2.0 100 Trying");
      push("SBC", "Carrier", "PSTN leg", "180 Ringing then 200 OK", "180 Ringing\n200 OK\nACK completes the dialog");
      const bypass = $("#dr-media").value === "bypass";
      push(
        bypass ? "Client" : "Teams",
        "SBC",
        bypass ? "ICE media bypass" : "Media processor",
        bypass ? "RTP between client and SBC" : "RTP via the media processor",
        bypass
          ? "Media bypass candidate\nICE between the client and " + target + "\nSignaling still belongs to Teams\nSRTP"
          : "Media processor path\nUDP 3478-3481 and 49152-53247\nSRTP\nSignaling stays on 5061"
      );
      push("Client", "SBC", "BYE", "Dialog ends", "BYE sip:" + target + " SIP/2.0\n200 OK");
      finish();
    };
  }
  if (id === "route-match") {
    $("#rt-run").onclick = function () {
      noteRun("route-match");
      const norm = applyNormalization($("#rt-num").value, US_TENANT_RULES);
      const number = norm.ok ? norm.output : $("#rt-num").value.trim();
      const match = matchVoiceRoute(number, policyByKey($("#rt-pol").value));
      $("#rt-out").innerHTML = match.ok
        ? "<p><strong>" + esc(number) + "</strong> matches <strong>" + esc(match.usage) + "</strong> / " + esc(match.route) + ". First gateway " + esc(match.gateway.fqdn) + ".</p>"
        : "<p>No route for " + esc(number) + ". The call never leaves Teams.</p>";
    };
  }
  if (id === "dial-plan") {
    $("#dp-run").onclick = function () {
      noteRun("dial-plan");
      const result = applyNormalization($("#dp-num").value, US_TENANT_RULES);
      $("#dp-out").innerHTML = result.ok
        ? "<p>Rule " + (result.index + 1) + " <strong>" + esc(result.rule) + "</strong> produces <strong>" + esc(result.output) + "</strong>. Later rules are not tried.</p>"
        : "<p>" + esc(result.error) + "</p>";
    };
    function runSandbox() {
      noteRun("dial-plan");
      const result = testRegexSandbox($("#rx-pat").value, $("#rx-tr").value, $("#rx-in").value);
      $("#rx-out").innerHTML = result.html;
    }
    $("#rx-run").onclick = runSandbox;
    $$("[data-sample]").forEach((button) => {
      button.onclick = function () {
        $("#rx-in").value = button.getAttribute("data-sample");
        runSandbox();
      };
    });
  }
  if (id === "aa-cq") {
    $("#aa-run").onclick = function () {
      noteRun("aa-cq");
      const issues = [];
      if ($("#aa-hours").value === "none") issues.push("Business hours are unset, so the after-hours path is an accident.");
      if ($("#aa-greet").value === "none") issues.push("A silent greeting makes the menu feel broken.");
      if (!$("#aa-key").value.trim()) issues.push("Key 1 has no target.");
      if ($("#aa-op").value === "none") issues.push("There is no operator for zero and for failures.");
      if ($("#cq-ra").value === "no") issues.push("The queue has no Teams Phone Resource Account license.");
      if ($("#cq-ra").value === "std") issues.push("Teams Phone Standard on a resource account is the wrong license. Use the Teams Phone Resource Account license, and swap them in one license change.");
      if (!$("#cq-agents").value.trim()) issues.push("The queue has no agents.");
      if (Number($("#cq-timeout").value) <= 0) issues.push("Timeout must be a positive number of seconds.");
      if (!$("#cq-over").value.trim()) issues.push("Overflow is empty, so the timeout has nowhere to go.");
      if ($("#cq-out").value === "yes" && $("#cq-payg").value === "no") issues.push("An external transfer needs a funded pay-as-you-go license or communications credits on the resource account.");
      $("#aa-out").innerHTML = issues.length
        ? "<ul>" + issues.map((item) => "<li>" + esc(item) + "</li>").join("") + "</ul>"
        : "<p>The design has an attendant, a queue, a resource-account license, and an overflow. Assign a number only if this voice app must be reached from the PSTN. Creating the account still takes a Teams admin role and the User Administrator role.</p>";
    };
  }
  if (id === "sbc-check") {
    const saved = state.sbcChecks || {};
    $$("[data-sbc]").forEach((box) => {
      box.checked = !!saved[box.getAttribute("data-sbc")];
    });
    $("#sbc-run").onclick = function () {
      noteRun("sbc-check");
      const boxes = $$("[data-sbc]");
      const next = {};
      let score = 0;
      const missing = [];
      boxes.forEach((box) => {
        next[box.getAttribute("data-sbc")] = box.checked;
        if (box.checked) score += 1;
        else missing.push(box.parentElement.textContent.trim());
      });
      state.sbcChecks = next;
      save();
      $("#sbc-out").innerHTML = "<p><strong>" + score + " / " + boxes.length + "</strong> for " + esc($("#sbc-v").value) + ".</p>" +
        (missing.length ? "<p>Still open:</p><ul>" + missing.map((item) => "<li>" + esc(item) + "</li>").join("") + "</ul>" : "<p>The shared gate is checked. Vendor config is still the vendor’s guide.</p>");
    };
  }
  if (id === "tls-hand") {
    $("#tls-run").onclick = function () {
      noteRun("tls-hand");
      const fault = $("#tls-fault").value;
      const steps = [
        ["ClientHello", "SBC offers TLS 1.2 or newer."],
        ["ServerHello", "Microsoft proxy continues the handshake."],
        ["Certificate", "SBC presents the chain."],
        ["Name check", "SAN or CN must match the FQDN paired in Teams."],
        ["Trust", "The issuer is in the Microsoft trusted root program."],
        ["Finished", "SIP can start on 5061."],
      ];
      const failAt = { ok: -1, old: 0, expired: 2, name: 3, private: 4 }[fault];
      $("#tls-out").innerHTML = "<ol>" + steps.map((step, index) => {
        let mark = "ok";
        if (failAt === index) mark = "bad";
        if (failAt > -1 && index > failAt) mark = "warn";
        return '<li class="tag ' + mark + '"><strong>' + step[0] + ".</strong> " + esc(step[1]) + (failAt === index ? " Stop here." : "") + "</li>";
      }).join("") + "</ol>" + (failAt === -1 ? "<p>Handshake completes. OPTIONS and INVITE can follow.</p>" : "<p>SIP never starts. Fix the certificate or the TLS version before you debug a dial plan.</p>");
    };
  }
  if (id === "cqd-fault") {
    const cases = [
      { id: "vpn", title: "Subnet 10.8.0.0/16, jitter 40 ms, DSCP 0, VPN client", answer: "vpn", why: "A full-tunnel VPN hides the office subnet and often strips the mark. Split the media, or expect this building to look poor." },
      { id: "loss", title: "HQ subnet, loss 12%, jitter 8 ms, RTT 40 ms, DSCP 46", answer: "loss", why: "Loss with a healthy mark and a short RTT points at a congested or dirty link, not at the codec." },
      { id: "rtt", title: "Branch, loss 0.2%, jitter 10 ms, RTT 620 ms", answer: "rtt", why: "The path is intact and slow. Look at hairpin media, a distant media processor, or a backhauled internet egress." },
      { id: "mark", title: "Audio UDP 50004 arrives at the WAN with DSCP 0", answer: "mark", why: "The client port is in the audio range. Something rewrote or never wrote EF 46." },
      { id: "one", title: "One user, one call, others in the building are fine", answer: "one", why: "That is a Call Analytics case, not a CQD building case." },
    ];
    let cursor = 0;
    let correct = 0;
    function draw() {
      const item = cases[cursor];
      if (!item) {
        $("#cqd-out").innerHTML = "<p><strong>" + correct + " / " + cases.length + "</strong> fault calls.</p>";
        noteRun("cqd-fault");
        return;
      }
      const options = [["vpn", "VPN or split-tunnel"], ["loss", "Loss on a marked path"], ["rtt", "Long RTT / hairpin"], ["mark", "DSCP stripped"], ["one", "Single-user Call Analytics"]];
      $("#cqd-out").innerHTML = "<h2>Case " + (cursor + 1) + "</h2><p>" + esc(item.title) + "</p>" +
        options.map((opt) => '<button class="choice" type="button" data-pick="' + opt[0] + '">' + esc(opt[1]) + "</button>").join("");
      $$("[data-pick]").forEach((button) => {
        button.onclick = function () {
          const pick = button.getAttribute("data-pick");
          if (pick === item.answer) correct += 1;
          button.classList.add(pick === item.answer ? "right" : "wrong");
          $("#cqd-out").insertAdjacentHTML("beforeend", "<p>" + esc(item.why) + "</p><button class=\"primary\" id=\"cqd-next\" type=\"button\">Next</button>");
          $("#cqd-next").onclick = function () { cursor += 1; draw(); };
        };
      });
    }
    draw();
  }
  if (id === "license-pick") {
    $("#lic-run").onclick = function () {
      noteRun("license-pick");
      const lines = ["A user who places or receives PSTN calls needs Teams, plus Teams Phone, unless a bundle already includes that capability. Confirm the bundle on the licensing page. Calling Plans are extra even when Phone System arrived inside E5."];
      const pstn = $("#lic-pstn").value;
      if (pstn === "ms") lines.push("Add a Domestic, International, or Pay-as-you-go Calling Plan. Microsoft is the carrier.");
      if (pstn === "oc") lines.push("Teams Phone plus the Operator Connect carrier. No Microsoft Calling Plan.");
      if (pstn === "mob") lines.push("Teams Phone plus the Teams Phone Mobile operator. The SIM number is the Teams number.");
      if (pstn === "dr") lines.push("Teams Phone plus your certified SBC and carrier. No Microsoft Calling Plan for those users.");
      if (pstn === "none") lines.push("No PSTN add-on for users who only call inside Teams.");
      if ($("#lic-meet").value === "yes") lines.push("Audio Conferencing is a separate capability from Teams Phone. Without it, outbound conference calls can fall through to Direct Routing.");
      if ($("#lic-room").value !== "no") lines.push("License the room with the current Teams Rooms SKU. Do not reuse a user Calling Plan by habit. A common-area phone on Direct Routing does not need a Calling Plan.");
      if ($("#lic-aa").value === "yes") lines.push("Each attendant or queue that answers needs a resource account and a Microsoft Teams Phone Resource Account license. Do not assign Teams Phone Standard to that account.");
      if ($("#lic-out").value === "yes") lines.push("External transfer, callback, or on-behalf outbound needs pay-as-you-go or communications credits on the resource account.");
      lines.push("Teams Premium does not replace any line above.");
      $("#lic-out").innerHTML = "<ul>" + lines.map((line) => "<li>" + esc(line) + "</li>").join("") + "</ul>";
    };
  }
  if (id === "cucm-map") {
    const map = {
      css: ["Voice routing policy plus the usages on it", "A CSS is a list of partitions the caller may reach. The Teams cousin is the ordered PSTN usages on a voice routing policy. It is not a one-to-one object."],
      pt: ["There is no partition object", "Reachability is the route pattern’s match plus whether that route’s usage is on the policy. Do not invent a hidden partition table."],
      rp: ["Voice route", "A route pattern’s called-party transform belongs next to a voice route regex and its gateways."],
      tp: ["Dial plan normalization rule", "Put the transform in one place. If CUCM and Teams both add +44, the SBC sees a broken number."],
      trunk: ["CsOnlinePSTNGateway plus the CUBE dial-peers", "The Teams trunk is the paired SBC FQDN. CUBE still has dial-peers toward CUCM and toward the carrier."],
      dp: ["Codecs on the SBC, DSCP on the network", "Regions and locations do not travel. Negotiate the codec on the SBC and mark DSCP on the Teams port ranges."],
      em: ["A person signs into Teams", "Extension mobility is not a Teams feature. The user is homed online and signs into the client or a certified device."],
    };
    function draw() {
      const pair = map[$("#cu-obj").value];
      $("#cu-out").innerHTML = "<h2>" + esc(pair[0]) + "</h2><p>" + esc(pair[1]) + "</p>";
      noteRun("cucm-map");
    }
    $("#cu-obj").onchange = draw;
    draw();
  }
  if (id === "routing-designer") {
    $("#ur-run").onclick = function () {
      noteRun("routing-designer");
      const lang = $("#ur-lang").value;
      const intent = $("#ur-intent").value;
      const free = Number($("#ur-cap").value);
      let queue = "English general";
      let why = "No French or outage rule matched.";
      if (intent === "out") {
        queue = "Priority outage";
        why = "Outage intent outranks language in this teaching workstream.";
      } else if (lang === "fr") {
        queue = free > 0 ? "French billing" : "French overflow";
        why = free > 0 ? "Language and intent matched, and capacity was free." : "The French billing queue had no capacity, so overflow took the item.";
      }
      $("#ur-out").innerHTML = "<p>Work item lands in <strong>" + esc(queue) + "</strong>. " + esc(why) + "</p>" +
        flowSvg([{ label: "Intake", detail: lang }, { label: "Classify", detail: intent }, { label: "Queue", detail: queue }, { label: "Assign", detail: "Capacity" }], "Unified routing");
    };
  }
  if (id === "acs-flow") {
    const seq = [];
    function paint() {
      $("#acs-seq").innerHTML = seq.map((step) => "<li>" + esc(step) + "</li>").join("") || "<li>Empty. Answer usually comes first.</li>";
    }
    $$("[data-block]").forEach((button) => {
      button.onclick = function () {
        seq.push(button.getAttribute("data-block"));
        paint();
      };
    });
    $("#acs-clear").onclick = function () { seq.splice(0, seq.length); paint(); };
    function run(digit) {
      noteRun("acs-flow");
      if (seq[0] !== "answer") {
        $("#acs-out").innerHTML = "<p>The sequence never answers. The caller hears ringing until the platform times out.</p>";
        return;
      }
      if (seq.indexOf("dtmf") === -1 && digit === "1") {
        $("#acs-out").innerHTML = "<p>Nothing is recognizing DTMF, so 1 is discarded.</p>";
        return;
      }
      if (digit === "9" || seq.indexOf("agent") !== -1 && digit === "1") {
        $("#acs-out").innerHTML = "<p>Digit " + digit + " transfers to a human queue. Events: CallConnected, RecognizeCompleted, Transfer.</p>";
        return;
      }
      if (seq.indexOf("hangup") !== -1) {
        $("#acs-out").innerHTML = "<p>The flow hangs up after the prompt. That is a complete automation only if the caller did not need a person.</p>";
        return;
      }
      $("#acs-out").innerHTML = "<p>Play runs. Without a transfer, the call stays in automation.</p>";
    }
    $("#acs-1").onclick = function () { run("1"); };
    $("#acs-9").onclick = function () { run("9"); };
    paint();
  }
  if (id === "erlang") {
    $("#er-run").onclick = function () {
      noteRun("erlang");
      const calls = Number($("#er-calls").value);
      const aht = Number($("#er-aht").value);
      const interval = Number($("#er-int").value) * 60;
      const target = Number($("#er-tgt").value);
      const agents = Number($("#er-n").value);
      const shrink = Math.min(0.5, Math.max(0, Number($("#er-sh").value)));
      const traffic = interval > 0 ? (calls * aht) / interval : 0;
      const pw = erlangC(agents, traffic);
      const sl = serviceLevel(agents, traffic, target, aht);
      const asa = averageSpeed(agents, traffic, aht);
      const roster = shrink < 1 ? agents / (1 - shrink) : agents;
      const bars = [];
      for (let n = Math.max(1, Math.ceil(traffic)); n <= Math.ceil(traffic) + 8; n += 1) {
        bars.push({ label: n + " agents", value: Math.round(serviceLevel(n, traffic, target, aht) * 100), display: Math.round(serviceLevel(n, traffic, target, aht) * 100) + "%" });
      }
      $("#er-out").innerHTML = "<div class=\"grid stats\"><div class=\"stat\"><b>" + traffic.toFixed(2) + "</b><span>Erlangs</span></div><div class=\"stat\"><b>" + Math.round(pw * 100) + "%</b><span>Probability of waiting</span></div><div class=\"stat\"><b>" + Math.round(sl * 100) + "%</b><span>Service level</span></div><div class=\"stat\"><b>" + (asa === Infinity ? "∞" : Math.round(asa) + "s") + "</b><span>Average speed of answer</span></div><div class=\"stat\"><b>" + roster.toFixed(1) + "</b><span>Roster with shrinkage</span></div></div>" +
        chartSvg({ title: "Service level", note: "Teaching chart.", bars: bars });
    };
  }
  if (id === "exam-map") {
    $("#ex-save").onclick = function () {
      $$("[data-exam]").forEach((input) => { state.exam[input.getAttribute("data-exam")] = input.value; });
      noteRun("exam-map");
      const weak = DATA.exams.filter((exam) => Number(state.exam[exam.id] || 0) < 2 && exam.live);
      $("#ex-out").innerHTML = weak.length
        ? "<p>Below 2, and still a live target:</p><ul>" + weak.map((exam) => "<li>" + esc(exam.code) + " — " + esc(exam.next) + "</li>").join("") + "</ul>"
        : "<p>Live targets are at 2 or above. Recheck dates before you book. Passing score on these role exams is 700.</p>";
    };
  }
  if (id === "qos-mark") {
    const table = {
      audio: ["50000–50019", "46", "EF", "Expedited Forwarding"],
      video: ["50020–50039", "34", "AF41", "Assured Forwarding 41"],
      share: ["50040–50059", "18", "AF21", "Assured Forwarding 21"],
      sig: ["50070–50089", "40", "CS5", "Class Selector 5, ports not configurable"],
    };
    function draw() {
      const row = table[$("#qos-kind").value];
      $("#qos-out").innerHTML = "<p>Client source ports <strong>" + row[0] + "</strong>. DSCP <strong>" + row[1] + "</strong> (" + row[2] + "). " + row[3] + ".</p>" +
        "<p>Mac and mobile hard-code audio as EF. Browser joins do not use these ranges. QoS still has to be enabled for markers to be inserted.</p>";
      noteRun("qos-mark");
    }
    $("#qos-kind").onchange = draw;
    draw();
  }
  if (id === "e911-match") {
    $("#e911-run").onclick = function () {
      noteRun("e911-match");
      const found = lisLookup($("#e911-ip").value, $("#e911-bssid").value);
      mountLisBoard($("#e911-board"), found && found.hit ? found : { hit: { bssid: "", site: "No match", address: "Unknown", method: "No dispatchable location", dispatchable: false }, via: "none" });
      if (!found.hit) {
        $("#e911-out").innerHTML = "<p>No BSSID and no subnet matched. Dynamic location would fall through. Fix the network site before you blame the SBC.</p>";
        return;
      }
      const hit = found.hit;
      $("#e911-out").innerHTML = "<p>Matched by <strong>" + esc(found.via) + "</strong> · " + esc(hit.site) + " · " + esc(hit.address) + "</p><p>" +
        (hit.dispatchable ? "Civic address is present. Emergency signaling for this teaching site uses " + esc(hit.method) + "." : "VPN pool has no dispatchable address. Do not pretend the HQ address applies.") + "</p>";
    };
  }
  if (id === "options-health") {
    function draw() {
      const misses = Number($("#opt-miss").value);
      const healthy = misses < 3;
      $("#opt-out").innerHTML = flowSvg([
        { label: "OPTIONS", detail: "sip.pstnhub" },
        { label: "SBC", detail: misses ? misses + " miss" : "200 OK" },
        { label: "Status", detail: healthy ? "In service" : "Pull from route" },
      ], "OPTIONS health") + "<p>" + (healthy ? "Still willing to send calls." : "Repeated misses. Move traffic to the next gateway and capture the OPTIONS timestamps.") + "</p>";
      noteRun("options-health");
    }
    $("#opt-miss").onchange = draw;
    draw();
  }
  if (id === "bypass") {
    $("#by-run").onclick = function () {
      noteRun("bypass");
      const same = $("#by-site").value === "same";
      const on = $("#by-flag").value === "on";
      const lbr = $("#by-lbr").value === "on";
      const vpn = $("#by-site").value === "vpn";
      let mode = "Media stays on the Microsoft media processor.";
      if (on && same && !lbr && !vpn) mode = "Bypass is a candidate. Signaling still goes through Teams. Media can run between the client and the SBC.";
      if (vpn) mode = "A full-tunnel VPN is a poor bypass candidate. Microsoft recommends keeping real-time media off the VPN.";
      if (lbr) mode = "Location-based routing is on. Do not enable a media path that would egress in the wrong country. Check the LBR plan before you turn bypass on.";
      if (!on) mode = "The gateway has bypass off. Media uses the processor. Ports 3478–3481 and 49152–53247 apply.";
      $("#by-out").innerHTML = "<p>" + esc(mode) + "</p>" + callRibbon();
    };
  }
  if (id === "coexist") {
    $("#cx-run").onclick = function () {
      noteRun("coexist");
      const who = $("#cx-norm").value;
      const warning = who === "both"
        ? "Both systems transform numbers. Pick one owner before cutover."
        : who === "none"
          ? "Nobody transforms. Users will dial whatever the trunk happens to accept."
          : "One owner is set. Write it on the design so the next person does not add the other.";
      $("#cx-out").innerHTML = "<p>CUCM keeps " + esc($("#cx-cucm").value) + ". Teams keeps " + esc($("#cx-teams").value) + ". The bridge is a certified SBC, often CUBE, with dial-peers in both directions.</p><p>" + esc(warning) + "</p><p>Calls from a CUCM phone to a moved user trombone through the SBC. That is expected during dual-running. It is not the steady state.</p>";
    };
  }
  if (id === "usage-build") {
    const built = { name: "Lab-Policy", usages: [{ name: "Lab-Usage", routes: [] }] };
    function paint() {
      $("#ub-list").innerHTML = built.usages[0].routes.map((route) => "<li>" + esc(route.name) + " · <code>" + esc(route.pattern) + "</code> · " + esc(route.gateways[0].fqdn) + "</li>").join("") || "<li>No routes yet.</li>";
    }
    $("#ub-add").onclick = function () {
      const pattern = $("#ub-pat").value.trim();
      if (pattern.length > 80 || pattern.indexOf("(?") !== -1) {
        $("#ub-out").innerHTML = "<p>Keep the pattern short and free of advanced assertions.</p>";
        return;
      }
      try { new RegExp(pattern); } catch (err) {
        $("#ub-out").innerHTML = "<p>Pattern did not compile.</p>";
        return;
      }
      built.usages[0].routes.push({
        name: $("#ub-name").value || "route",
        priority: built.usages[0].routes.length + 1,
        pattern: pattern,
        gateways: [{ fqdn: $("#ub-gw").value || "sbc.contoso.example", priority: 1 }],
      });
      paint();
    };
    $("#ub-run").onclick = function () {
      noteRun("usage-build");
      const norm = applyNormalization($("#ub-test").value, US_TENANT_RULES);
      const number = norm.ok ? norm.output : $("#ub-test").value.trim();
      const match = matchVoiceRoute(number, built);
      $("#ub-out").innerHTML = match.ok
        ? "<p>" + esc(number) + " uses " + esc(match.route) + " via " + esc(match.gateway.fqdn) + ".</p>"
        : "<p>No lab route matched " + esc(number) + ".</p>";
    };
    paint();
  }
  if (id === "bandwidth") {
    $("#bw-run").onclick = function () {
      noteRun("bandwidth");
      const codec = $("#bw-codec").value;
      const payload = codec === "g729" ? 20 : 160;
      const calls = Math.max(1, Number($("#bw-calls").value) || 1);
      const l3 = mediaKbps(payload, 20, 40);
      const l2 = mediaKbps(payload, 20, 58);
      $("#bw-out").innerHTML = "<p>One call at 20 ms: <strong>" + l3.toFixed(1) + " kbit/s</strong> at layer 3, <strong>" + l2.toFixed(1) + " kbit/s</strong> with an 18-byte Ethernet header.</p><p>" + calls + " calls: <strong>" + (l2 * calls / 1000).toFixed(2) + " Mbit/s</strong> Ethernet, one direction, before comfort noise and signaling.</p>";
    };
  }
  if (id === "ivr-intent") {
    $("#iv-run").onclick = function () {
      noteRun("ivr-intent");
      const text = $("#iv-utt").value.toLowerCase();
      let intent = "unknown";
      if (text.indexOf("bill") !== -1) intent = "billing";
      else if (text.indexOf("out") !== -1 || text.indexOf("down") !== -1) intent = "outage";
      const escape = $("#iv-esc").value === "yes";
      $("#iv-out").innerHTML = "<p>Teaching classifier: <strong>" + intent + "</strong>. This is a keyword stand-in for a Copilot Studio topic, not a model call.</p><p>" +
        (escape ? "DTMF 0 leaves the agent for a human queue." : "No escape. A confused caller is stuck. Add one before you pilot.") + "</p>";
    };
  }
  if (id === "sba-time") {
    function draw() {
      const down = $("#sba-wan").value === "down";
      $("#sba-out").innerHTML = down
        ? "<p>WAN to Microsoft 365 is down. A Survivable Branch Appliance on Direct Routing can keep local PSTN calls for clients that can reach it. Meetings, presence, and normal cloud features are not the survivable set. Confirm the feature list for your appliance firmware.</p>"
        : "<p>WAN is up. Clients register to Teams. The SBA is idle standby, not the primary path.</p>";
      noteRun("sba-time");
    }
    $("#sba-wan").onchange = draw;
    draw();
  }
  if (id === "record-policy") {
    $("#rec-run").onclick = function () {
      noteRun("record-policy");
      const issues = [];
      if ($("#rec-vendor").value === "no") issues.push("Compliance recording is a third-party recorder. Native convenience recording is a different feature.");
      if ($("#rec-app").value === "no") issues.push("A policy grant without an application instance does not start recording.");
      if ($("#rec-on").value === "no") issues.push("The policy is disabled.");
      if ($("#rec-grant").value === "none") issues.push("Nobody is in scope.");
      if ($("#rec-note").value === "no") issues.push("Notification is required. Confirm it with the partner before go-live.");
      $("#rec-out").innerHTML = issues.length
        ? "<ul>" + issues.map((item) => "<li>" + esc(item) + "</li>").join("") + "</ul><p>Existing calls stay as they are when you grant the policy. Test a new call.</p>"
        : "<p>The teaching gate is complete: certified recorder, application instance, enabled policy, granted users, notification confirmed. The partner still owns retention.</p>";
    };
  }
  if (id === "integrate-map") {
    const goals = {
      record: ["Certified compliance recorder", "Application instance", "Teams compliance recording policy", "The users or queues in scope", "A Call-ID the partner can quote"],
      pop: ["E.164 caller number", "Contact center or middleware", "CRM contact key", "Teams itself does not open a Dynamics case"],
      staff: ["Queue interval stats", "AHT and abandons", "Shrinkage", "Erlang C as a teaching check", "WFM, not a user’s Call Analytics"],
      survive: ["Direct Routing", "Survivable Branch Appliance", "Local SBC", "A tested emergency path that does not depend on the WAN"],
      quality: ["CQD for the building", "Call Analytics for one user", "Subnet to building map", "Power BI only after those two agree"],
      bot: ["Copilot Studio or ACS recognize", "A human queue as overflow", "Knowledge sources", "Never the emergency route"],
    };
    function draw() {
      const rows = goals[$("#in-goal").value];
      $("#in-out").innerHTML = "<ol>" + rows.map((row) => "<li>" + esc(row) + "</li>").join("") + "</ol>";
      noteRun("integrate-map");
    }
    $("#in-goal").onchange = draw;
    draw();
  }
  if (id === "hook-plan") {
    const saved = state.hooks || {};
    $$("[data-hook]").forEach((box) => { box.checked = !!saved[box.getAttribute("data-hook")]; });
    const harm = {
      callid: "Support cannot join the CRM note to the SIP ladder.",
      policy: "Numbers go live and the regulated users are silent on the recorder.",
      overflow: "A later bot project means a new public number and a new announcement.",
      subnet: "E911, LBR, and CQD disagree about where the user sat.",
      name: "A proxy IP change looks like an SBC failure.",
      wfm: "The schedule is a guess because the queue totals never leave the platform.",
      escape: "The agent traps a caller who asked for a person.",
      cert: "The trunk dies on a Saturday when the certificate expires.",
    };
    $("#hook-run").onclick = function () {
      noteRun("hook-plan");
      const next = {};
      const missing = [];
      $$("[data-hook]").forEach((box) => {
        const key = box.getAttribute("data-hook");
        next[key] = box.checked;
        if (!box.checked) missing.push(harm[key]);
      });
      state.hooks = next;
      save();
      $("#hook-out").innerHTML = missing.length
        ? "<ul>" + missing.map((item) => "<li>" + esc(item) + "</li>").join("") + "</ul>"
        : "<p>The seams are named. None of them requires an unannounced product.</p>";
    };
  }
}

function inCidr(ip, cidr) {
  const parts = cidr.split("/");
  const bits = Number(parts[1]);
  const ipn = ipv4(ip);
  const net = ipv4(parts[0]);
  if (ipn == null || net == null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipn & mask) === (net & mask);
}

function ipv4(text) {
  const chunks = String(text).split(".");
  if (chunks.length !== 4) return null;
  let value = 0;
  for (let i = 0; i < 4; i += 1) {
    const n = Number(chunks[i]);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    value = (value << 8) + n;
  }
  return value >>> 0;
}

function renderQuiz() {
  return '<p class="kicker">Question bank</p><h1>Quiz</h1>' +
    '<div class="controls"><label class="field">Track<select id="qz-track"><option value="all">All tracks</option>' +
    DATA.tracks.map((track) => '<option value="' + track.id + '">' + esc(track.title) + "</option>").join("") +
    '</select></label><button class="primary" id="qz-start" type="button">Twenty questions</button></div><div id="qz-out"></div>';
}

function startQuiz() {
  const track = $("#qz-track").value;
  const pool = DATA.quiz.filter((item) => track === "all" || item.track === track);
  const rng = mulberry(Date.now() % 100000);
  const pick = pool.slice().sort(() => rng() - 0.5).slice(0, Math.min(20, pool.length));
  let index = 0;
  let score = 0;
  function draw() {
    const item = pick[index];
    if (!item) {
      const pct = pick.length ? Math.round((score / pick.length) * 100) : 0;
      state.quizTaken += 1;
      if (pct > state.bestQuiz) state.bestQuiz = pct;
      markStudy();
      $("#qz-out").innerHTML = "<p><strong>" + score + " / " + pick.length + "</strong> · " + pct + "%.</p>";
      return;
    }
    $("#qz-out").innerHTML = "<p class=\"tiny\">" + (index + 1) + " / " + pick.length + "</p><h2>" + esc(item.q) + "</h2>" +
      item.choices.map((choice, choiceIndex) => '<button class="choice" type="button" data-i="' + choiceIndex + '">' + esc(choice) + "</button>").join("");
    $$(".choice", $("#qz-out")).forEach((button) => {
      button.onclick = function () {
        const chosen = Number(button.getAttribute("data-i"));
        if (chosen === item.answer) score += 1;
        $$(".choice", $("#qz-out")).forEach((peer, peerIndex) => {
          if (peerIndex === item.answer) peer.classList.add("right");
          if (peerIndex === chosen && chosen !== item.answer) peer.classList.add("wrong");
          peer.disabled = true;
        });
        $("#qz-out").insertAdjacentHTML("beforeend", "<div class=\"callout\">" + esc(item.explain) + "</div><button class=\"primary\" id=\"qz-next\" type=\"button\">Next</button>");
        $("#qz-next").onclick = function () { index += 1; draw(); };
      };
    });
  }
  draw();
}

function mulberry(seed) {
  let s = seed || 1;
  return function () {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cardIndex = 0;
let cardShow = false;
function renderCards() {
  const card = DATA.cards[cardIndex % DATA.cards.length];
  window.__listen = card.front + ". " + card.back;
  return '<p class="kicker">Flashcards · ' + DATA.cards.length + "</p><h1>Recall</h1>" +
    '<button class="flip" id="flip" type="button"><span>' + (cardShow ? esc(card.back) : esc(card.front)) + "</span></button>" +
    '<div class="row"><button class="ghost" id="again" type="button">Again</button><button class="primary" id="know" type="button">Know it</button></div>' +
    '<p class="tiny">Seen this session path: ' + state.cardsSeen + ". Track: " + esc(card.track) + "</p>";
}

function renderScenarios() {
  return '<p class="kicker">Cases</p><h1>Scenarios</h1><div class="lab-grid">' +
    DATA.scenarios.map((scene) => '<a class="card" href="#/scenario/' + scene.id + '"><h3>' + esc(scene.title) + "</h3><p>" + esc(scene.brief) + "</p></a>").join("") +
    "</div>";
}

function renderScenario(id) {
  const scene = DATA.scenarios.find((item) => item.id === id);
  if (!scene) return missing();
  window.__listen = scene.brief;
  return "<h1>" + esc(scene.title) + "</h1><p>" + esc(scene.brief) + "</p><p><strong>" + esc(scene.prompt) + "</strong></p>" +
    scene.choices.map((choice, index) => '<button class="choice" type="button" data-s="' + index + '">' + esc(choice) + "</button>").join("") +
    '<div id="sc-out" aria-live="polite"></div><p class="tiny">Source: ' + esc(scene.source) + "</p>";
}

function renderGlossary() {
  const chips = '<button class="chip" type="button" data-g="all">All</button>' +
    DATA.tracks.map((track) => '<button class="chip" type="button" data-g="' + track.id + '">' + esc(track.title) + "</button>").join("");
  return '<p class="kicker">Ecosystem glossary</p><h1>Glossary</h1>' +
    field("g-q", "Filter", "") + '<div class="row" id="g-chips">' + chips + '</div><div id="g-list" class="lab-grid"></div>';
}

function paintGlossary(track) {
  const q = ($("#g-q").value || "").toLowerCase();
  const rows = DATA.glossary.filter((item) => {
    if (track !== "all" && item.track !== track) return false;
    const blob = (item.term + " " + item.plain + " " + item.config + " " + item.fault).toLowerCase();
    return blob.indexOf(q) !== -1;
  });
  $("#g-list").innerHTML = rows.slice(0, 80).map((item) => {
    return '<article class="card"><h3>' + esc(item.term) + '</h3><p>' + esc(item.plain) + '</p><p class="tiny">Config. ' + esc(item.config) + "</p><p class=\"tiny\">Fault. " + esc(item.fault) + "</p></article>";
  }).join("") + '<p class="tiny">' + rows.length + " terms. Showing the first 80 of the filter.</p>";
}

function renderMap() {
  const nodes = DATA.map.nodes;
  const edges = DATA.map.edges;
  const width = 1140;
  const height = 740;
  let lines = "";
  edges.forEach((edge) => {
    const a = nodes.find((node) => node.id === edge.from);
    const b = nodes.find((node) => node.id === edge.to);
    if (!a || !b) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const lx = (a.x + b.x) / 2 + (-dy / len) * 16;
    const ly = (a.y + b.y) / 2 + (dx / len) * 16;
    lines += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="var(--violet)" stroke-width="2" class="flow-line"></line>';
    lines += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="var(--sans)">' + esc(edge.label) + "</text>";
  });
  let dots = "";
  nodes.forEach((node) => {
    dots += '<g class="node-btn" data-href="' + esc(node.href) + '" tabindex="0" role="link" aria-label="' + esc(node.label) + '">';
    dots += '<rect x="' + (node.x - 68) + '" y="' + (node.y - 20) + '" width="136" height="40" rx="12" fill="var(--bg-3)" stroke="var(--teal)"></rect>';
    dots += '<text x="' + node.x + '" y="' + (node.y + 5) + '" text-anchor="middle" fill="var(--ink)" font-size="13" font-family="var(--sans)">' + esc(node.label) + "</text></g>";
  });
  window.__listen = "Ecosystem mind map. Teams Phone sits between Entra ID and the SBC. Recording, WFM, CRM, analytics, and agents attach at named seams.";
  return '<p class="kicker">Ecosystem</p><h1>Mind map</h1><p class="lede">Click a node. The edge label is the thing that has to be true for the hop to work.</p>' +
    '<div class="map-wrap panel"><svg class="map-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Ecosystem mind map">' + lines + dots + "</svg></div>";
}

function renderExamPage() {
  const fact = DATA.examFact || "";
  return '<p class="callout">' + esc(fact) + "</p>" + renderLab("exam-map").replace("<h1>", '<p class="kicker">14 October 2026</p><h1>');
}

function renderSources() {
  return '<p class="kicker">Citations</p><h1>Sources</h1><p>Accessed 14 October 2026 unless a row says otherwise. Certification pages move. Read them again before you book.</p>' +
    "<ul>" + DATA.sources.map((source) => "<li><a href=\"" + esc(source.url) + "\">" + esc(source.title) + "</a> — " + esc(source.used) + "</li>").join("") + "</ul>";
}

function missing() {
  return "<h1>That page is not in the campus.</h1><p><a href=\"#/\">Back to the start</a></p>";
}

function renderCharts() {
  window.__listen = "Charts. Licensing, call quality, Erlang C, and the certification timeline. Teaching samples are labeled.";
  return '<p class="kicker">Figures</p><h1>Charts</h1><p class="lede">Licensing, quality, staffing, and the dates that were true on 14 October 2026.</p>' +
    (DATA.charts || []).map((chart) => '<article class="panel"><h2>' + esc(chart.title) + "</h2>" + chart.svg + '<p class="tiny">' + esc(chart.note) + "</p></article>").join("");
}

function renderFaults() {
  window.__listen = "Fault catalog. Symptom, cause, fix, and the check.";
  return '<p class="kicker">Troubleshooting</p><h1>Fault catalog</h1>' +
    '<label class="field">Filter<input id="fault-q" type="search" placeholder="jitter, certificate, queue"></label>' +
    '<div id="fault-list"></div>';
}

function paintFaults() {
  const q = ($("#fault-q").value || "").toLowerCase();
  const rows = (DATA.faults || []).filter((fault) => {
    const blob = (fault.symptom + " " + fault.cause + " " + fault.fix + " " + fault.check).toLowerCase();
    return !q || blob.indexOf(q) !== -1;
  });
  $("#fault-list").innerHTML = '<p class="tiny">' + rows.length + " faults</p>" + rows.map((fault) => (
    '<article class="panel fault"><h2>' + esc(fault.symptom) + "</h2>" +
    "<p><strong>Cause. </strong>" + esc(fault.cause) + "</p>" +
    "<p><strong>Fix. </strong>" + esc(fault.fix) + "</p>" +
    "<p><strong>Check. </strong>" + esc(fault.check) + "</p>" +
    '<p class="tiny"><a href="' + esc(fault.url) + '">' + esc(fault.source) + "</a> · accessed " + esc(fault.accessed) + "</p></article>"
  )).join("");
}

function renderAudio() {
  window.__listen = "Offline audio. Tones are generated. Spoken clips are synthesized on this machine, not recorded from a carrier.";
  const groups = ["dtmf", "progress", "prompt", "intro"];
  return '<p class="kicker">No network</p><h1>Audio</h1><p class="lede">DTMF, call-progress tones, attendant samples, and short intros. Nothing is uploaded. Production attendants use a recorded prompt, not these clips.</p>' +
    groups.map((kind) => {
      const rows = (DATA.audio || []).filter((clip) => clip.kind === kind);
      return "<h2>" + esc(kind) + "</h2>" + rows.map((clip) => '<article class="panel audio-card"><h3>' + esc(clip.title) + "</h3><p>" + esc(clip.blurb) + '</p><audio controls preload="none" src="' + esc(clip.file) + '"></audio></article>').join("");
    }).join("");
}

function renderBossList() {
  return '<p class="kicker">Sit one</p><h1>Boss exams</h1><p class="lede">' + esc(DATA.examFact || "") + " Eighty percent is the study gate. The real exams use their own scale.</p><div class=\"lab-grid\">" +
    (DATA.bosses || []).map((boss) => '<a class="card" href="#/boss/' + boss.id + '"><p class="kicker">' + esc(boss.code) + '</p><h3>' + esc(boss.title) + "</h3><p>" + esc(boss.note) + "</p></a>").join("") +
    "</div>";
}

function renderBoss(id) {
  const boss = (DATA.bosses || []).find((item) => item.id === id);
  if (!boss) return missing();
  window.__listen = boss.note;
  const best = state.boss && state.boss[id] ? state.boss[id] + "% best in this browser" : "No score saved yet";
  const incident = boss.incident;
  const incidentHtml = incident
    ? '<section class="incident panel"><h2>' + esc(incident.title) + "</h2><p>" + esc(incident.brief) + '</p><h3>SBC and service log</h3><pre class="syslog">' + esc(incident.syslog) + '</pre><button class="primary" id="boss-incident" type="button">Work the incident</button><div id="incident-out" aria-live="polite"></div></section>'
    : "";
  return '<p class="kicker"><a href="#/boss">Boss exams</a></p><h1>' + esc(boss.code) + "</h1><p>" + esc(boss.note) + '</p><p class="tiny">' + best + "</p>" +
    incidentHtml +
    '<h2>Question bank</h2><button class="primary" id="boss-start" type="button">Start ' + boss.questions.length + ' questions</button><div id="boss-out"></div>';
}

function wireQuizRun(host, items, onDone) {
  let index = 0;
  let score = 0;
  function draw() {
    const item = items[index];
    if (!item) {
      onDone(score, items.length);
      return;
    }
    host.innerHTML = "<p class=\"tiny\">" + (index + 1) + " / " + items.length + "</p><h2>" + esc(item.q) + "</h2>" +
      item.choices.map((choice, choiceIndex) => '<button class="choice" type="button" data-i="' + choiceIndex + '">' + esc(choice) + "</button>").join("");
    $$(".choice", host).forEach((button) => {
      button.onclick = function () {
        const chosen = Number(button.getAttribute("data-i"));
        if (chosen === item.answer) score += 1;
        $$(".choice", host).forEach((peer, peerIndex) => {
          if (peerIndex === item.answer) peer.classList.add("right");
          if (peerIndex === chosen && chosen !== item.answer) peer.classList.add("wrong");
          peer.disabled = true;
        });
        host.insertAdjacentHTML("beforeend", "<div class=\"callout\">" + esc(item.explain) + "</div><button class=\"primary\" type=\"button\" data-next=\"1\">Next</button>");
        host.querySelector("[data-next]").onclick = function () { index += 1; draw(); };
      };
    });
  }
  draw();
}

function wireBoss(id) {
  const boss = (DATA.bosses || []).find((item) => item.id === id);
  const start = $("#boss-start");
  if (!boss || !start) return;
  const incidentButton = $("#boss-incident");
  if (incidentButton && boss.incident) {
    incidentButton.onclick = function () {
      wireQuizRun($("#incident-out"), boss.incident.steps, function (score, total) {
        const pct = Math.round((score / total) * 100);
        $("#incident-out").innerHTML = "<p><strong>" + score + " / " + total + "</strong> incident steps · " + pct + "%. The question bank is the study gate.</p>";
      });
    };
  }
  start.onclick = function () {
    let index = 0;
    let score = 0;
    function draw() {
      const item = boss.questions[index];
      if (!item) {
        const pct = Math.round((score / boss.questions.length) * 100);
        state.boss = state.boss || {};
        if (!state.boss[id] || pct > state.boss[id]) state.boss[id] = pct;
        markStudy();
        if (pct >= 80) confetti();
        $("#boss-out").innerHTML = "<p><strong>" + score + " / " + boss.questions.length + "</strong> · " + pct + "%. " + (pct >= 80 ? "Study gate cleared." : "Below the 80 percent study gate.") + "</p>";
        return;
      }
      $("#boss-out").innerHTML = "<p class=\"tiny\">" + (index + 1) + " / " + boss.questions.length + "</p><h2>" + esc(item.q) + "</h2>" +
        item.choices.map((choice, choiceIndex) => '<button class="choice" type="button" data-i="' + choiceIndex + '">' + esc(choice) + "</button>").join("");
      $$(".choice", $("#boss-out")).forEach((button) => {
        button.onclick = function () {
          const chosen = Number(button.getAttribute("data-i"));
          if (chosen === item.answer) score += 1;
          $$(".choice", $("#boss-out")).forEach((peer, peerIndex) => {
            if (peerIndex === item.answer) peer.classList.add("right");
            if (peerIndex === chosen && chosen !== item.answer) peer.classList.add("wrong");
            peer.disabled = true;
          });
          $("#boss-out").insertAdjacentHTML("beforeend", "<div class=\"callout\">" + esc(item.explain) + "</div><button class=\"primary\" id=\"boss-next\" type=\"button\">Next</button>");
          $("#boss-next").onclick = function () { index += 1; draw(); };
        };
      });
    }
    draw();
  };
}

function renderSettings() {
  window.__listen = "Settings for this browser. Theme, sound, narration, speed, motion, and type size stay on this device.";
  const theme = activeTheme();
  const themeButtons = THEMES.map((item) => '<button type="button" class="choice" data-theme-pick="' + item.id + '" aria-pressed="' + (theme === item.id) + '">' + esc(item.label) + "</button>").join("");
  const font = FONTS.some((item) => item.id === state.font) ? state.font : "md";
  const fontButtons = FONTS.map((item) => '<button type="button" class="choice" data-font-pick="' + item.id + '" aria-pressed="' + (font === item.id) + '">' + esc(item.label) + "</button>").join("");
  const motion = state.reduceMotion === "reduce" || state.reduceMotion === "full" ? state.reduceMotion : "system";
  return (
    '<p class="kicker">This browser</p>' +
    "<h1>Settings</h1>" +
    '<p class="lede">Theme, sound, narration, motion, and type size stay in local storage on this device. Nothing is uploaded.</p>' +
    '<div class="settings-grid">' +
    '<fieldset class="setting"><legend>Theme</legend><div class="choice-row">' + themeButtons + "</div></fieldset>" +
    '<fieldset class="setting"><legend>Sound effects</legend>' +
    '<label class="row"><input id="set-sound" type="checkbox"' + (state.sound === false ? "" : " checked") + "> Play a short tone when you finish a lesson</label>" +
    '<button class="ghost" id="set-sound-test" type="button">Play a tone</button></fieldset>' +
    '<fieldset class="setting"><legend>Narration</legend>' +
    '<label class="row"><input id="set-narration" type="checkbox"' + (state.narration === false ? "" : " checked") + "> Listen reads the page aloud</label>" +
    '<label class="field">Voice<select id="set-voice" aria-label="Narration voice"><option value="">Waiting for voices</option></select></label>' +
    '<p class="tiny" id="set-voice-note">Waiting for the browser to list voices.</p>' +
    '<label class="field">Speed <span id="set-rate-val"></span><input id="set-rate" type="range" min="0.75" max="1.5" step="0.05" value="' + esc(state.rate || 1) + '" aria-label="Narration speed"></label>' +
    '<button class="ghost" id="set-sample" type="button">Read a sample</button></fieldset>' +
    '<fieldset class="setting"><legend>Motion</legend>' +
    '<label class="field">Reduced motion<select id="set-motion" aria-label="Reduced motion">' +
    '<option value="system"' + (motion === "system" ? " selected" : "") + ">Match this device</option>" +
    '<option value="reduce"' + (motion === "reduce" ? " selected" : "") + ">Reduce motion</option>" +
    '<option value="full"' + (motion === "full" ? " selected" : "") + ">Allow motion</option>" +
    "</select></label></fieldset>" +
    '<fieldset class="setting"><legend>Type size</legend><div class="choice-row">' + fontButtons + "</div></fieldset>" +
    "</div>"
  );
}

function renderTips(id) {
  window.__listen = "Tips and traps for each track, plus a one-page cheat sheet.";
  if (!id) {
    const cards = DATA.tracks.map((track) => '<a class="card" href="#/tips/' + track.id + '"><p class="kicker">Track ' + esc(track.num) + "</p><h3>" + esc(track.title) + "</h3><p>Pro tips, interview traps, and a cheat sheet.</p></a>").join("");
    return '<p class="kicker">Study layer</p><h1>Tips and tricks</h1><p class="lede">One sheet per track. Open a track when you want the traps, not every sheet at once.</p><div class="lab-grid">' + cards + "</div>";
  }
  const track = trackById(id);
  if (!track || !tipPack(id)) return missing();
  return '<p class="kicker"><a href="#/tips">Tips</a> · Track ' + esc(track.num) + "</p><h1>" + esc(track.title) + "</h1>" + tipsBlock(id);
}

function paintView(html) {
  const view = $("#view");
  view.innerHTML = html;
  const heading = view.querySelector("h1");
  const title = heading ? heading.textContent : "Microsoft Voice & Contact Center Lab";
  const h1 = $("#view-title");
  if (h1) h1.textContent = title;
  document.title = title + " · Voice Lab";
  view.querySelectorAll("h1").forEach((node) => node.remove());
}

function readRoute() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/");
  const root = parts[0] || "home";
  const arg = parts[1] || "";
  return { root: root, arg: arg };
}

function redirectHash(next) {
  if ((location.hash || "#/") !== next) location.replace(next);
}

let renderGen = 0;
async function render() {
  const gen = ++renderGen;
  clearLadders();
  disposeTopology();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  speaking = false;
  const listen = $("#listen");
  if (listen) listen.textContent = state.narration === false ? "Narration off" : "Listen";
  const route = readRoute();
  const root = route.root;
  const arg = route.arg;
  const needsArg = { track: "#/track/t01", lesson: "#/", lab: "#/labs", scenario: "#/scenarios" };
  if (Object.prototype.hasOwnProperty.call(needsArg, root) && !arg) {
    redirectHash(needsArg[root]);
    return;
  }
  const known = ["home", "track", "lesson", "labs", "lab", "quiz", "cards", "scenarios", "scenario", "glossary", "map", "charts", "faults", "audio", "boss", "exam", "sources", "powershell", "topology", "settings", "tips"];
  if (known.indexOf(root) === -1) {
    redirectHash("#/");
    return;
  }
  if (root === "track" && !trackById(arg)) {
    redirectHash("#/");
    return;
  }
  if (root === "lesson" && !lessonStub(arg)) {
    redirectHash("#/");
    return;
  }
  if (root === "lab" && !DATA.labs.some((lab) => lab.id === arg)) {
    redirectHash("#/labs");
    return;
  }
  if (root === "scenario" && !DATA.scenarios.some((scene) => scene.id === arg)) {
    redirectHash("#/scenarios");
    return;
  }
  if (root === "tips" && arg && !tipPack(arg)) {
    redirectHash("#/tips");
    return;
  }
  paintView('<p class="loading">Loading this page.</p>');
  try {
    if (root === "lesson") {
      const stub = lessonStub(arg);
      await ensureTrack(stub.track);
    }
    if (root === "quiz") await ensureModule("quiz");
    if (root === "cards") await ensureModule("cards");
    if (root === "glossary") await ensureModule("glossary");
    if (root === "charts") await ensureModule("charts");
    if (root === "boss") await ensureModule("bosses");
    if (root === "boss" && arg && !(DATA.bosses || []).some((boss) => boss.id === arg)) {
      redirectHash("#/boss");
      return;
    }
  } catch (err) {
    if (gen !== renderGen) return;
    paintView('<p class="callout bad">This page did not load. Open the campus once while you are online so the service worker can keep it.</p>');
    return;
  }
  if (gen !== renderGen) return;
  let html = "";
  if (root === "home") html = renderHome();
  else if (root === "track") html = renderTrack(arg);
  else if (root === "lesson") html = renderLesson(arg);
  else if (root === "labs") html = renderLabs();
  else if (root === "lab") html = renderLab(arg);
  else if (root === "quiz") html = renderQuiz();
  else if (root === "cards") html = renderCards();
  else if (root === "scenarios") html = renderScenarios();
  else if (root === "scenario") html = renderScenario(arg);
  else if (root === "glossary") html = renderGlossary();
  else if (root === "map") html = renderMap();
  else if (root === "charts") html = renderCharts();
  else if (root === "faults") html = renderFaults();
  else if (root === "audio") html = renderAudio();
  else if (root === "boss") html = arg ? renderBoss(arg) : renderBossList();
  else if (root === "exam") html = renderExamPage();
  else if (root === "sources") html = renderSources();
  else if (root === "powershell") html = renderPowerShell();
  else if (root === "topology") html = renderTopology();
  else if (root === "settings") html = renderSettings();
  else if (root === "tips") html = renderTips(arg);
  else html = missing();
  paintView(html);
  $("#main").focus();
  wire(root, arg);
  paintNav(root, arg);
  const transcript = window.__listen || "Pick a lesson or a lab. Listen reads the short script for that page.";
  $("#transcript").textContent = transcript;
}

function renderPowerShell() {
  window.__listen = "Teams PowerShell simulator. New-CsOnlineVoiceRoute, Set-CsTeamsCallingPolicy, and Get-CsOnlinePSTNGateway run against a browser tenant.";
  return '<p class="kicker">Browser tenant</p><h1>Teams PowerShell</h1>' +
    '<p class="lede">The cmdlets below change a simulated tenant in this tab. They do not sign in to Microsoft 365. Get-Command lists what this shell accepts. Confirm every parameter with Get-Help in the module you actually run.</p>' +
    '<div id="ps-host"></div>';
}

function renderTopology() {
  window.__listen = "Geo-redundant SBC mesh. London and Manchester pairs, three SIP proxies, and a survivable branch appliance. Orbit the scene and toggle a failure.";
  return '<p class="kicker">Direct Routing</p><h1>SBC mesh</h1>' +
    '<p class="lede">London and Manchester each have a gateway. Three Teams SIP proxies sit in front of them. The Survivable Branch Appliance is the path that remains when the Manchester WAN drops. This is a teaching model, drawn with Three.js in this browser.</p>' +
    '<div class="topology-stage" id="topo-stage">' +
    '<div class="gl-fallback" id="topo-fallback">' + callRibbon() + '<p>Reduced motion keeps this flat diagram. The mesh does not spin on its own.</p></div>' +
    '<canvas id="topo-gl" hidden aria-label="Three.js topology of geo-redundant SBCs"></canvas>' +
    '</div>' +
    '<div class="scenario-bar">' +
    '<label class="row"><input id="topo-lon" type="checkbox"> London primary down</label>' +
    '<label class="row"><input id="topo-wan" type="checkbox"> Manchester WAN down</label>' +
    '<label class="row"><input id="topo-cert" type="checkbox"> Certificate mismatch</label>' +
    '</div>' +
    '<p class="tiny">Failover only works when the voice route lists the next gateway. A certificate name mismatch stops TLS before OPTIONS matters. A WAN failure does not move signaling onto the SBA unless the client can reach the appliance.</p>';
}

function paintNav(root, arg) {
  $$(".item", $("#nav")).forEach((link) => {
    const href = link.getAttribute("href") || "";
    const on = href === "#/" + root || href === "#/" + root + "/" + arg || (root === "home" && href === "#/");
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  $$(".bottom-nav a").forEach((link) => {
    const tab = link.getAttribute("data-tab");
    const on = tab === root || (tab === "home" && root === "home");
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function wire(root, arg) {
  const mark = $("#mark");
  if (mark && root === "lesson") {
    const lesson = lessonById(arg);
    if (lesson && lesson.flow && $("#flow-player")) mountFlowPlayer($("#flow-player"), lesson.flow);
    mark.onclick = function () {
      if (state.lessons.indexOf(arg) === -1) state.lessons.push(arg);
      markStudy();
      confetti();
      render();
    };
  }
  if (root === "lab" || root === "exam") wireLabs(root === "exam" ? "exam-map" : arg);
  if (root === "quiz") $("#qz-start").onclick = startQuiz;
  if (root === "cards") {
    $("#flip").onclick = function () { cardShow = !cardShow; render(); };
    $("#know").onclick = function () { cardShow = false; cardIndex += 1; state.cardsSeen += 1; markStudy(); render(); };
    $("#again").onclick = function () { cardShow = false; cardIndex += 1; render(); };
  }
  if (root === "scenario") {
    $$("[data-s]").forEach((button) => {
      button.onclick = function () {
        const scene = DATA.scenarios.find((item) => item.id === arg);
        const chosen = Number(button.getAttribute("data-s"));
        if (state.scenarios.indexOf(arg) === -1) state.scenarios.push(arg);
        markStudy();
        $$("[data-s]").forEach((peer, index) => {
          if (index === scene.answer) peer.classList.add("right");
          if (index === chosen && chosen !== scene.answer) peer.classList.add("wrong");
        });
        $("#sc-out").innerHTML = "<div class=\"callout\">" + esc(scene.debrief) + "</div>";
      };
    });
  }
  if (root === "glossary") {
    let track = "all";
    const paint = () => paintGlossary(track);
    $("#g-q").addEventListener("input", paint);
    $$("[data-g]").forEach((button) => {
      button.onclick = function () { track = button.getAttribute("data-g"); paint(); };
    });
    paint();
  }
  if (root === "faults") {
    $("#fault-q").addEventListener("input", paintFaults);
    paintFaults();
  }
  if (root === "boss" && arg) wireBoss(arg);
  if (root === "settings") wireSettings();
  if (root === "home") {
    const orbit = $("#home-orbit");
    if (orbit) {
      orbit.onclick = function () { openMesh("home-gl", "home-fallback", "home"); };
    }
    bindScenario("home");
  }
  if (root === "powershell") mountPowerShell($("#ps-host"));
  if (root === "topology") openMesh("topo-gl", "topo-fallback", "topo");
  if (root === "map") {
    $$("[data-href]").forEach((node) => {
      const go = () => { location.hash = node.getAttribute("data-href"); };
      node.onclick = go;
      node.onkeydown = (event) => { if (event.key === "Enter") go(); };
    });
  }
}

function navHtml() {
  const tracks = DATA.tracks.map((track) => '<a class="item" href="#/track/' + track.id + '"><span class="idx">' + esc(track.num) + '</span><span>' + esc(track.title) + "</span></a>").join("");
  const views = [
    ["#/", "Home"],
    ["#/labs", "Labs"],
    ["#/powershell", "PowerShell"],
    ["#/topology", "SBC mesh"],
    ["#/quiz", "Quiz"],
    ["#/cards", "Flashcards"],
    ["#/scenarios", "Scenarios"],
    ["#/glossary", "Glossary"],
    ["#/map", "Mind map"],
    ["#/charts", "Charts"],
    ["#/faults", "Fault catalog"],
    ["#/audio", "Audio"],
    ["#/boss", "Boss exams"],
    ["#/exam", "Exam map"],
    ["#/tips", "Tips and traps"],
    ["#/settings", "Settings"],
    ["#/sources", "Sources"],
  ];
  return '<h2>Campus</h2>' + views.map((view) => '<a class="item" href="' + view[0] + '">' + esc(view[1]) + "</a>").join("") +
    "<h2>Tracks</h2>" + tracks;
}

function openPalette() {
  const box = $("#palette");
  box.hidden = false;
  $("#q").value = "";
  paintHits("");
  $("#q").focus();
}

function closePalette() {
  $("#palette").hidden = true;
}

function paintHits(query) {
  const q = query.toLowerCase();
  const hits = [];
  const lessonHits = (DATA.lessonIndex && DATA.lessonIndex.length) ? DATA.lessonIndex : DATA.lessons;
  lessonHits.forEach((lesson) => hits.push({ href: "#/lesson/" + lesson.id, title: lesson.title, kind: "Lesson" }));
  DATA.labs.forEach((lab) => hits.push({ href: "#/lab/" + lab.id, title: lab.title, kind: "Lab" }));
  const termHits = (DATA.glossary && DATA.glossary.length) ? DATA.glossary : (DATA.termIndex || []);
  termHits.forEach((item) => hits.push({ href: "#/glossary", title: item.term, kind: "Term" }));
  DATA.scenarios.forEach((scene) => hits.push({ href: "#/scenario/" + scene.id, title: scene.title, kind: "Scenario" }));
  const filtered = hits.filter((hit) => !q || (hit.title + hit.kind).toLowerCase().indexOf(q) !== -1).slice(0, 12);
  $("#hits").innerHTML = filtered.map((hit, index) => '<button type="button" data-href="' + hit.href + '" aria-selected="' + (index === 0 ? "true" : "false") + '"><strong>' + esc(hit.kind) + "</strong> · " + esc(hit.title) + "</button>").join("") || "<p>No matches.</p>";
  $$("#hits button").forEach((button) => {
    button.onclick = function () {
      location.hash = button.getAttribute("data-href");
      closePalette();
    };
  });
}

let speaking = false;

function voicesReady() {
  const synth = window.speechSynthesis;
  if (!synth) return Promise.resolve([]);
  const existing = synth.getVoices();
  if (existing && existing.length) return Promise.resolve(existing);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      const list = synth.getVoices();
      if (settled) return;
      if (list && list.length) {
        settled = true;
        synth.removeEventListener("voiceschanged", finish);
        resolve(list);
      }
    };
    synth.addEventListener("voiceschanged", finish);
    try { synth.getVoices(); } catch (err) { /* Safari loads voices later */ }
    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices() || []);
    }, 1200);
  });
}

function isRoboticEdge(voice) {
  const name = voice.name || "";
  const uri = (voice.voiceURI || "") + " " + name;
  if (/natural|neural|premium|enhanced|wavenet/i.test(uri)) return false;
  if (/edge/i.test(voice.voiceURI || "") || /edge/i.test(name)) return true;
  if (/microsoft/i.test(uri) && /david|zira|mark|hazel|susan|george|heera|ravi/i.test(name)) return true;
  if (/microsoft/i.test(name) && !/online/i.test(name)) return true;
  return false;
}

function voiceScore(voice) {
  const name = voice.name || "";
  const blob = name + " " + (voice.voiceURI || "");
  let score = 0;
  if (/^en/i.test(voice.lang || "")) score += 30;
  if (/en[-_]US/i.test(voice.lang || "")) score += 12;
  else if (/en[-_]GB/i.test(voice.lang || "")) score += 8;
  if (/natural|neural|premium|enhanced|wavenet|studio/i.test(blob)) score += 60;
  if (/google/i.test(name)) score += 25;
  if (/samantha|daniel|karen|moira|tessa|serena|allison|ava|nicky|victoria/i.test(name)) score += 20;
  if (isRoboticEdge(voice)) score -= 100;
  return score;
}

function pickVoice(voices) {
  if (state.voiceURI) {
    const chosen = voices.find((voice) => voice.voiceURI === state.voiceURI || voice.name === state.voiceURI);
    if (chosen) return chosen;
  }
  const ranked = voices.slice().sort((a, b) => voiceScore(b) - voiceScore(a));
  const best = ranked[0];
  if (!best || isRoboticEdge(best) || voiceScore(best) < 0) return null;
  return best;
}

function listenLabel() {
  return state.narration === false ? "Narration off" : "Listen";
}

async function toggleListen() {
  const text = $("#transcript").textContent || "";
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (state.narration === false) {
    synth.cancel();
    speaking = false;
    $("#listen").textContent = "Narration off";
    return;
  }
  if (speaking) {
    synth.cancel();
    speaking = false;
    $("#listen").textContent = "Listen";
    return;
  }
  const voices = await voicesReady();
  if (speaking) return;
  const voice = pickVoice(voices);
  if (!voice) {
    $("#listen").textContent = "Pick a voice";
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Number(state.rate || $("#rate").value || 1);
  utterance.voice = voice;
  utterance.onend = function () { speaking = false; $("#listen").textContent = listenLabel(); };
  utterance.onerror = function () { speaking = false; $("#listen").textContent = listenLabel(); };
  speaking = true;
  $("#listen").textContent = "Stop";
  synth.cancel();
  window.setTimeout(() => {
    if (!speaking) return;
    if (synth.paused) synth.resume();
    synth.speak(utterance);
  }, 60);
}

let voiceWatch = null;

function fillVoiceSelect(voices) {
  const select = $("#set-voice");
  const note = $("#set-voice-note");
  if (!select || !note) return;
  const saved = state.voiceURI;
  const previous = state.voiceURI;
  state.voiceURI = "";
  const automatic = pickVoice(voices);
  state.voiceURI = previous;
  const options = ['<option value="">Automatic, natural voices only</option>'].concat(voices.map((voice) => {
    const robotic = isRoboticEdge(voice);
    const label = voice.name + " · " + (voice.lang || "") + (robotic ? " · robotic" : "");
    return '<option value="' + esc(voice.voiceURI || voice.name) + '">' + esc(label) + "</option>";
  }));
  select.innerHTML = options.join("");
  const match = saved && voices.some((voice) => voice.voiceURI === saved || voice.name === saved);
  select.value = match ? saved : "";
  if (!voices.length) {
    note.textContent = "No voices yet. This page waits for voiceschanged, then fills the list.";
  } else if (!automatic) {
    note.textContent = "No natural voice is available, so Listen will not start on a robotic Microsoft Edge voice. Pick one in the list if you want that voice.";
  } else {
    note.textContent = "Automatic uses " + automatic.name + ". Robotic Microsoft Edge voices stay in the list and are never the default.";
  }
}

function wireSettings() {
  const gen = renderGen;
  $$("[data-theme-pick]").forEach((button) => {
    button.onclick = function () {
      setTheme(button.getAttribute("data-theme-pick"));
      render();
    };
  });
  $$("[data-font-pick]").forEach((button) => {
    button.onclick = function () {
      state.font = button.getAttribute("data-font-pick");
      save();
      render();
    };
  });
  const sound = $("#set-sound");
  if (sound) {
    sound.onchange = function () {
      state.sound = sound.checked;
      save();
      if (state.sound) blip("ok");
    };
  }
  const test = $("#set-sound-test");
  if (test) {
    test.onclick = function () {
      if (state.sound === false) {
        test.textContent = "Turn sound on first";
        return;
      }
      test.textContent = "Play a tone";
      playTone(660, 120, false);
    };
  }
  const narration = $("#set-narration");
  if (narration) {
    narration.onchange = function () {
      state.narration = narration.checked;
      if (!state.narration && window.speechSynthesis) window.speechSynthesis.cancel();
      speaking = false;
      $("#listen").textContent = listenLabel();
      save();
    };
  }
  const motion = $("#set-motion");
  if (motion) {
    motion.onchange = function () {
      state.reduceMotion = motion.value;
      save();
    };
  }
  const rate = $("#set-rate");
  const rateVal = $("#set-rate-val");
  const syncRate = function () {
    if (rateVal && rate) rateVal.textContent = Number(rate.value).toFixed(2) + "×";
  };
  syncRate();
  if (rate) {
    rate.oninput = function () {
      state.rate = Number(rate.value);
      const dock = $("#rate");
      if (dock) dock.value = String(state.rate);
      save();
      syncRate();
    };
  }
  const sample = $("#set-sample");
  if (sample) {
    sample.onclick = async function () {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (state.narration === false) {
        const note = $("#set-voice-note");
        if (note) note.textContent = "Turn narration on to read the sample.";
        return;
      }
      const voices = await voicesReady();
      if (gen !== renderGen) return;
      const voice = pickVoice(voices);
      if (!voice) {
        const note = $("#set-voice-note");
        if (note) note.textContent = "Pick a voice first. Automatic will not use a robotic Microsoft Edge voice.";
        return;
      }
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance("Teams Phone is a license. A Calling Plan is a separate purchase.");
      utterance.voice = voice;
      utterance.rate = Number(state.rate || 1);
      synth.speak(utterance);
    };
  }
  const applyVoices = function (voices) {
    if (gen !== renderGen) return;
    fillVoiceSelect(voices || []);
    const select = $("#set-voice");
    if (!select || select.dataset.bound === "1") return;
    select.dataset.bound = "1";
    select.onchange = function () {
      state.voiceURI = select.value;
      save();
      fillVoiceSelect(window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
    };
  };
  voicesReady().then(applyVoices);
  if (voiceWatch && window.speechSynthesis) {
    window.speechSynthesis.removeEventListener("voiceschanged", voiceWatch);
  }
  voiceWatch = function () {
    if (gen !== renderGen) {
      if (window.speechSynthesis) window.speechSynthesis.removeEventListener("voiceschanged", voiceWatch);
      return;
    }
    applyVoices(window.speechSynthesis.getVoices());
  };
  if (window.speechSynthesis) window.speechSynthesis.addEventListener("voiceschanged", voiceWatch);
}

function scenarioState(prefix) {
  return {
    lonDown: !!($("#" + prefix + "-lon") && $("#" + prefix + "-lon").checked),
    wanDown: !!($("#" + prefix + "-wan") && $("#" + prefix + "-wan").checked),
    certFail: !!($("#" + prefix + "-cert") && $("#" + prefix + "-cert").checked),
  };
}

function bindScenario(prefix) {
  ["lon", "wan", "cert"].forEach((key) => {
    const box = $("#" + prefix + "-" + key);
    if (!box) return;
    box.onchange = function () {
      if (topoHandle) topoHandle.setScenario(scenarioState(prefix));
    };
  });
}

async function openMesh(canvasId, fallbackId, prefix) {
  const canvas = document.getElementById(canvasId);
  const fallback = document.getElementById(fallbackId);
  if (!canvas) return;
  const gen = renderGen;
  const reduced = motionMode() === "reduce";
  try {
    const mod = await import("./studios/topology.js");
    if (gen !== renderGen) return;
    disposeTopology();
    canvas.hidden = false;
    if (fallback) fallback.hidden = true;
    topoHandle = mod.mount(canvas);
    topoHandle.setScenario(scenarioState(prefix));
    if (reduced && fallback) {
      const note = document.createElement("p");
      note.className = "tiny";
      note.textContent = "Reduced motion: the mesh stays still until you drag it.";
      fallback.parentElement.appendChild(note);
    }
    bindScenario(prefix);
  } catch (err) {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }
}

async function boot() {
  $("#menu").onclick = function () { $("#nav").classList.toggle("open"); };
  const bottom = $("#bottom-menu");
  if (bottom) bottom.onclick = function () { $("#nav").classList.toggle("open"); };
  try {
    await bootData();
  } catch (err) {
    paintView('<p class="callout bad">The campus manifest did not load. Use a local server or GitHub Pages, then the service worker can keep the files.</p>');
    return;
  }
  $("#nav").innerHTML = navHtml();
  $("#search").onclick = openPalette;
  $("#palette").addEventListener("click", function (event) {
    if (event.target.id === "palette") closePalette();
  });
  $("#q").addEventListener("input", function () { paintHits($("#q").value); });
  $("#listen").onclick = toggleListen;
  $("#rate").addEventListener("input", function () {
    state.rate = Number($("#rate").value || 1);
    save();
    if (window.speechSynthesis && speaking) {
      window.speechSynthesis.cancel();
      speaking = false;
      toggleListen();
    }
  });
  document.addEventListener("keydown", function (event) {
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if ($("#palette").hidden) openPalette();
      else closePalette();
    }
    if (event.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      event.preventDefault();
      openPalette();
    }
    if (event.key === "Escape") closePalette();
    if (event.key === "[" || event.key === "]") {
      const hash = location.hash;
      const match = hash.match(/^#\/lesson\/(.+)$/);
      if (!match) return;
      const lesson = lessonById(match[1]);
      if (!lesson) return;
      const siblings = lessonsIn(lesson.track);
      const index = siblings.findIndex((item) => item.id === lesson.id);
      const next = event.key === "]" ? siblings[index + 1] : siblings[index - 1];
      if (next) location.hash = "#/lesson/" + next.id;
    }
  });
  window.addEventListener("hashchange", function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speaking = false;
    $("#listen").textContent = "Listen";
    $("#nav").classList.remove("open");
    render();
  });
  if (!state.theme) state.theme = initialTheme();
  paintChrome();
  render();
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* offline until the next visit */ });
  }
}

document.addEventListener("DOMContentLoaded", boot);

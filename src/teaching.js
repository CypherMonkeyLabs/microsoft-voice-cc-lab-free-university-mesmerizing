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

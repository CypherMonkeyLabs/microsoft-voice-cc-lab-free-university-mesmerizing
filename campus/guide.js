/* Guide Bot. Answers only from guide.json and data already loaded for this campus.
   Future cloud agent: set window.mvccGuideCloud = { url: "https://host/guide" }.
   POST { question, href }. This widget shows a reply only when the body is
   { grounded: true, answer: string, sources: [{ title, href }] }. */
(function () {
  "use strict";

  const STOP = ["a", "an", "the", "of", "to", "in", "on", "for", "and", "or", "is", "me", "my", "do", "does", "what", "how", "why", "where", "when", "this", "that", "with", "from", "about"];
  let kb = null;
  let kbPromise = null;
  let activeType = null;
  let tour = null;
  let quiz = null;

  function $(id) {
    return document.getElementById(id);
  }

  function reduced() {
    const mode = document.documentElement.dataset.motion;
    if (mode === "reduce") return true;
    if (mode === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function norm(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9.+#/\s-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokens(value) {
    return norm(value).split(" ").filter((token) => token.length > 1 && STOP.indexOf(token) === -1);
  }

  function distance(a, b) {
    if (a === b) return 0;
    if (!a || !b) return 9;
    if (Math.abs(a.length - b.length) > 2) return 9;
    const rows = [];
    for (let i = 0; i <= b.length; i += 1) rows[i] = [i];
    for (let j = 0; j <= a.length; j += 1) rows[0][j] = j;
    for (let i = 1; i <= b.length; i += 1) {
      for (let j = 1; j <= a.length; j += 1) {
        const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
        rows[i][j] = Math.min(rows[i - 1][j - 1] + cost, rows[i][j - 1] + 1, rows[i - 1][j] + 1);
      }
    }
    return rows[b.length][a.length];
  }

  function tokenScore(query, word) {
    if (!query || !word) return 0;
    if (query === word) return 1;
    if (word.indexOf(query) !== -1 || query.indexOf(word) !== -1) {
      if (Math.min(query.length, word.length) < 3) return 0;
      return 0.84;
    }
    const gap = distance(query, word);
    if (gap === 1 && query.length > 3) return 0.72;
    if (gap === 2 && query.length > 6) return 0.55;
    return 0;
  }

  function expand(queryTokens) {
    const extra = [];
    const groups = kb && kb.synonyms ? kb.synonyms : {};
    Object.keys(groups).forEach((key) => {
      const family = [key].concat(groups[key] || []);
      const hit = queryTokens.some((token) => family.some((word) => tokenScore(token, norm(word)) >= 0.72));
      if (hit) family.forEach((word) => tokens(word).forEach((token) => extra.push(token)));
    });
    return queryTokens.concat(extra);
  }

  function scoreText(queryTokens, text) {
    const words = tokens(text);
    if (!queryTokens.length || !words.length) return 0;
    let total = 0;
    queryTokens.forEach((token) => {
      let best = 0;
      words.forEach((word) => {
        const score = tokenScore(token, word);
        if (score > best) best = score;
      });
      total += best;
    });
    return total / queryTokens.length;
  }

  function loadKb() {
    if (kb) return Promise.resolve(kb);
    if (!kbPromise) {
      kbPromise = fetch("data/guide.json")
        .then((response) => {
          if (!response.ok) throw new Error("guide");
          return response.json();
        })
        .then((payload) => {
          kb = payload;
          return kb;
        });
    }
    return kbPromise;
  }

  function liveRows() {
    const data = window.DATA || {};
    const rows = [];
    (data.tracks || []).forEach((track) => {
      rows.push({
        title: "Track " + track.num + " " + track.title,
        href: "#/track/" + track.id,
        keywords: [track.title, track.id, "track"],
        answer: "Track " + track.num + " is " + track.title + ". " + (track.why || "") + (track.outcome ? " " + track.outcome : ""),
        source: "Track " + track.id + " in this campus",
      });
    });
    (data.lessonIndex || []).forEach((lesson) => {
      rows.push({
        title: lesson.title,
        href: "#/lesson/" + lesson.id,
        keywords: [lesson.title, lesson.id],
        answer: lesson.title + ". " + (lesson.say || "Open the lesson for the cited note."),
        source: "Lesson " + lesson.id,
      });
    });
    (data.labs || []).forEach((lab) => {
      rows.push({
        title: lab.title,
        href: "#/lab/" + lab.id,
        keywords: [lab.title, "lab"],
        answer: lab.title + ". " + (lab.summary || "This lab runs in the browser."),
        source: "Labs page",
      });
    });
    const glossary = data.glossary && data.glossary.length ? data.glossary : [];
    glossary.forEach((item) => {
      rows.push({
        title: item.term,
        href: "#/glossary",
        keywords: [item.term],
        answer: item.term + ". " + (item.plain || "") + (item.why ? " " + item.why : "") + (item.config ? " Config: " + item.config : "") + (item.fault ? " Fault: " + item.fault : ""),
        source: item.source || "Glossary",
      });
    });
    if (!glossary.length) {
      (data.termIndex || []).forEach((item) => {
        rows.push({
          title: item.term,
          href: "#/glossary",
          keywords: [item.term],
          answer: "The glossary lists " + item.term + ". Open the glossary for the config note, the fault, and the source. I will not paraphrase a definition that is not loaded.",
          source: "Glossary index",
        });
      });
    }
    return rows;
  }

  function countAnswer(question) {
    const counts = window.DATA && window.DATA.counts;
    const q = norm(question);
    if (!counts || !/how many|count of|number of/.test(q)) return null;
    const pairs = [
      ["lesson", "lessons"],
      ["track", "tracks"],
      ["lab", "labs"],
      ["quiz", "quiz"],
      ["flashcard", "cards"],
      ["card", "cards"],
      ["chart", "charts"],
      ["flow", "flows"],
      ["glossary", "glossary"],
      ["fault", "faults"],
      ["source", "sources"],
      ["audio", "audio"],
      ["boss", "bosses"],
      ["scenario", "scenarios"],
      ["illustration", "illustrations"],
      ["figure", "illustrations"],
    ];
    for (let i = 0; i < pairs.length; i += 1) {
      if (q.indexOf(pairs[i][0]) !== -1 && counts[pairs[i][1]] != null) {
        return {
          title: "Manifest count",
          href: "#/",
          answer: "The manifest loaded in this browser counts " + counts[pairs[i][1]] + " " + pairs[i][1] + ". Home shows the same counters.",
          source: "Campus manifest on this page",
        };
      }
    }
    return null;
  }

  function bestLocal(question) {
    const counted = countAnswer(question);
    if (counted) return counted;
    const query = expand(tokens(question));
    let best = null;
    let bestScore = 0;
    const pool = (kb.entries || []).concat(liveRows());
    pool.forEach((entry) => {
      const blob = [entry.title, entry.answer, (entry.keywords || []).join(" ")].join(" ");
      const score = scoreText(query, blob);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });
    if (!best || bestScore < 0.45) return null;
    return best;
  }

  function askCloud(question) {
    const hook = window.mvccGuideCloud;
    if (!hook || typeof hook.url !== "string" || !hook.url) return Promise.resolve(null);
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), 4000) : 0;
    return fetch(hook.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: question, href: location.hash || "#/" }),
      signal: controller ? controller.signal : undefined,
    }).then((response) => (response.ok ? response.json() : null)).then((body) => {
      window.clearTimeout(timer);
      if (!body || body.grounded !== true || typeof body.answer !== "string" || !body.answer.trim()) return null;
      const sources = Array.isArray(body.sources) ? body.sources : [];
      if (!sources.length) return null;
      return {
        title: "Cloud agent",
        href: sources[0].href || "#/",
        answer: body.answer.trim(),
        source: sources.map((item) => item.title || item.href).filter(Boolean).join("; "),
      };
    }).catch(() => {
      window.clearTimeout(timer);
      return null;
    });
  }

  function logNode() {
    return $("guide-log");
  }

  function scrollLog() {
    const log = logNode();
    if (log) log.scrollTop = log.scrollHeight;
  }

  function bubble(role, text) {
    const log = logNode();
    if (!log) return null;
    const node = document.createElement("p");
    node.className = "guide-bubble " + role;
    node.textContent = text;
    log.appendChild(node);
    scrollLog();
    return node;
  }

  function finishTyping() {
    if (!activeType) return;
    window.clearTimeout(activeType.timer);
    activeType.node.textContent = activeType.text;
    activeType.node.classList.remove("typing");
    const done = activeType.done;
    activeType = null;
    done();
  }

  function typeText(node, text) {
    finishTyping();
    if (!node) return Promise.resolve();
    if (reduced()) {
      node.textContent = text;
      node.classList.remove("typing");
      scrollLog();
      return Promise.resolve();
    }
    node.classList.add("typing");
    node.textContent = "";
    return new Promise((resolve) => {
      let index = 0;
      const step = () => {
        if (!activeType || activeType.node !== node) return;
        index += 2;
        node.textContent = text.slice(0, index);
        scrollLog();
        if (index < text.length) activeType.timer = window.setTimeout(step, 16);
        else {
          node.classList.remove("typing");
          activeType = null;
          resolve();
        }
      };
      activeType = { node: node, text: text, timer: 0, done: resolve };
      step();
    });
  }

  function chips(items) {
    const host = $("guide-chips");
    if (!host) return;
    host.innerHTML = "";
    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "guide-chip";
      button.textContent = item.label;
      button.addEventListener("click", () => item.run());
      host.appendChild(button);
    });
  }

  function defaultChips() {
    chips([
      { label: "What is this lab?", run: () => ask("What is this lab?") },
      { label: "Direct Routing prefixes", run: () => ask("Direct Routing firewall prefixes") },
      { label: "Exam status", run: () => ask("exam status MS-700") },
      { label: "Tours", run: () => listTours() },
      { label: "Quiz me", run: () => startQuiz() },
      { label: "Ecosystem", run: () => ask("ecosystem mind map") },
    ]);
  }

  function reply(entry) {
    const text = entry.answer + (entry.source ? " Source: " + entry.source + "." : "");
    const node = bubble("bot", "");
    return typeText(node, text).then(() => {
      if (entry.href) {
        const link = document.createElement("a");
        link.href = entry.href;
        link.textContent = entry.title ? "Open " + entry.title : "Open the page";
        const row = document.createElement("p");
        row.className = "guide-jump";
        row.appendChild(link);
        logNode().appendChild(row);
        scrollLog();
      }
    });
  }

  function listTours() {
    tour = null;
    quiz = null;
    bubble("bot", "Three tours are stored. Each stop only reads the page it opens.");
    chips((kb.tours || []).map((item) => ({
      label: item.title,
      run: () => startTour(item.id),
    })).concat([{ label: "Back", run: () => defaultChips() }]));
  }

  function startTour(id) {
    const found = (kb.tours || []).find((item) => item.id === id);
    if (!found) {
      bubble("bot", kb.fallback);
      defaultChips();
      return;
    }
    quiz = null;
    tour = { steps: found.steps, index: 0, title: found.title };
    showTourStep();
  }

  function showTourStep() {
    const step = tour.steps[tour.index];
    if (location.hash !== step.href) location.hash = step.href;
    const node = bubble("bot", "");
    const text = tour.title + ", stop " + (tour.index + 1) + " of " + tour.steps.length + ". " + step.say;
    typeText(node, text);
    const next = tour.index < tour.steps.length - 1;
    chips([
      next ? { label: "Next stop", run: () => { tour.index += 1; showTourStep(); } } : { label: "Done", run: () => { tour = null; bubble("bot", "Tour finished. I can quiz you from the same notes."); defaultChips(); } },
      { label: "Stop tour", run: () => { tour = null; defaultChips(); } },
    ]);
  }

  function startQuiz() {
    if (!kb.quiz || !kb.quiz.length) {
      bubble("bot", kb.fallback);
      return;
    }
    tour = null;
    quiz = { index: 0, score: 0, locked: false };
    askQuiz();
  }

  function askQuiz() {
    const item = kb.quiz[quiz.index];
    quiz.locked = false;
    const node = bubble("bot", "");
    typeText(node, "Question " + (quiz.index + 1) + " of " + kb.quiz.length + ". " + item.q);
    chips(item.choices.map((choice, index) => ({
      label: choice,
      run: () => answerQuiz(index),
    })));
  }

  function answerQuiz(index) {
    if (!quiz || quiz.locked) return;
    quiz.locked = true;
    const item = kb.quiz[quiz.index];
    const correct = index === item.answer;
    if (correct) quiz.score += 1;
    bubble("you", item.choices[index]);
    const node = bubble("bot", "");
    const verdict = correct ? "That matches the stored note. " : "That does not match the stored note. ";
    typeText(node, verdict + item.why + " Source: " + item.source + ".");
    quiz.index += 1;
    if (quiz.index >= kb.quiz.length) {
      const score = quiz.score;
      const total = kb.quiz.length;
      quiz = null;
      chips([
        { label: "Score " + score + " of " + total, run: () => bubble("bot", "Score " + score + " of " + total + ". I only marked answers that matched the notes in guide.json.") },
        { label: "Try again", run: () => startQuiz() },
        { label: "Back", run: () => defaultChips() },
      ]);
      return;
    }
    chips([{ label: "Next question", run: () => askQuiz() }]);
  }

  function ask(question) {
    const clean = String(question || "").trim();
    if (!clean) return;
    bubble("you", clean);
    const input = $("guide-q");
    if (input) input.value = "";
    const q = norm(clean);
    if (/^tours?$|start a tour|show tours/.test(q)) {
      listTours();
      return;
    }
    if (/quiz/.test(q)) {
      startQuiz();
      return;
    }
    const pending = bubble("bot", reduced() ? "Checking the campus notes." : "");
    if (pending && !reduced()) {
      pending.classList.add("typing");
      pending.textContent = "…";
    }
    loadKb().then(() => askCloud(clean).then((remote) => remote || bestLocal(clean))).then((hit) => {
      if (pending && pending.parentNode) pending.parentNode.removeChild(pending);
      if (!hit) {
        const node = bubble("bot", "");
        typeText(node, kb.fallback);
        defaultChips();
        return;
      }
      reply(hit).then(() => { if (!tour && !quiz) defaultChips(); });
    }).catch(() => {
      if (pending && pending.parentNode) pending.parentNode.removeChild(pending);
      bubble("bot", "The campus notes did not load. I will not guess.");
    });
  }

  function openPanel() {
    const panel = $("guide-panel");
    const button = $("guide-open");
    if (!panel || !button) return;
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    loadKb().then(() => {
      if (!$("guide-log").childElementCount) {
        const node = bubble("bot", "");
        const hello = kb.identity + " I answer from this campus only. " + kb.copyright;
        typeText(node, hello).then(() => defaultChips());
      }
      const input = $("guide-q");
      if (input) input.focus();
    }).catch(() => {
      bubble("bot", "The campus notes did not load. I will not guess.");
    });
  }

  function closePanel() {
    const panel = $("guide-panel");
    const button = $("guide-open");
    if (!panel || !button) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.focus();
  }

  function boot() {
    const open = $("guide-open");
    const close = $("guide-close");
    const form = $("guide-form");
    if (!open || !form) return;
    open.addEventListener("click", () => {
      if ($("guide-panel").hidden) openPanel();
      else closePanel();
    });
    if (close) close.addEventListener("click", closePanel);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      ask($("guide-q").value);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}());

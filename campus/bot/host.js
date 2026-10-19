/* Mount the offline Voice Lab chat inside the existing guide panel. */
import { createRetriever } from "./engine.js";
import { chatMarkup, paintChat, chatInput } from "./ui.js";

const EXAMPLES = [
  "What can you help with",
  "What is Direct Routing?",
  "What is a dial plan?",
  "What is a call queue?",
  "Where do I start?",
];

const messages = [];
let retriever = null;
let loading = null;
let lastAsk = "";
let lastAt = 0;

function panel() {
  return document.getElementById("guide-panel");
}

function rootOf() {
  const node = panel();
  return node ? node.querySelector("[data-py-chat]") : null;
}

function loadIndex() {
  if (retriever) return Promise.resolve(retriever);
  if (!loading) {
    loading = fetch(new URL("./voicebot-index.json", import.meta.url))
      .then((response) => {
        if (!response.ok) throw new Error("index");
        return response.json();
      })
      .then((data) => {
        retriever = createRetriever(data);
        return retriever;
      })
      .catch(() => null);
  }
  return loading;
}

function push(msg) {
  messages.push(msg);
  if (messages.length > 40) messages.splice(0, messages.length - 40);
  const root = rootOf();
  if (root) paintChat(root, messages, false);
}

function progress() {
  let done = 0;
  try {
    const saved = JSON.parse(localStorage.getItem("mvcc-lab-v1") || "{}");
    done = Array.isArray(saved.done) ? saved.done.length : 0;
  } catch (err) {
    done = 0;
  }
  return { done, total: 130, xpLevel: 1, nextHref: "#/lesson/t01-tenant", nextTitle: "The tenant boundary" };
}

async function answer(raw) {
  const question = String(raw || "").trim();
  if (!question) return;
  const now = Date.now();
  if (question === lastAsk && now - lastAt < 350) return;
  lastAsk = question;
  lastAt = now;
  const guide = panel();
  if (guide) {
    guide.hidden = false;
    guide.classList.add("has-voicebot");
    const button = document.getElementById("guide-open");
    if (button) button.setAttribute("aria-expanded", "true");
  }
  push({ role: "user", text: question });
  const input = chatInput(guide);
  if (input) input.value = "";
  const engine = await loadIndex();
  if (!engine) {
    push({ role: "bot", text: "The lesson index did not load. I will not invent an answer." });
    return;
  }
  const result = engine.ask(question, { progress });
  push({
    role: "bot",
    text: result.text,
    href: result.href || "",
    link: result.link || "",
    example: result.example || "",
    closest: result.closest || [],
    follow: result.follow || "",
    followQ: result.followQ || "",
  });
}

function clearChat() {
  messages.splice(0, messages.length);
  if (retriever) retriever.reset();
  messages.push({
    role: "bot",
    text: "Chat cleared. I only quote this lab's lessons, and I can be wrong.",
    follow: "Where do I start?",
    followQ: "Where do I start?",
  });
  const root = rootOf();
  if (root) paintChat(root, messages, false);
}

function listen() {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = chatInput(panel());
  if (!Rec) {
    push({ role: "bot", text: "This browser has no speech recognition. Type the question instead." });
    return;
  }
  const rec = new Rec();
  rec.lang = "en-US";
  rec.onresult = (event) => {
    const text = event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript : "";
    answer(text);
  };
  rec.onerror = () => push({ role: "bot", text: "I could not hear that. Type the question instead." });
  try { rec.start(); } catch (err) {
    push({ role: "bot", text: "The mic did not start. Type the question instead." });
    if (input) input.focus();
  }
}

function mount() {
  const guide = panel();
  if (!guide || guide.querySelector("[data-py-chat]")) return;
  window.mvccVoicebotOwnsChat = true;
  guide.classList.add("has-voicebot");
  const slot = document.createElement("div");
  slot.innerHTML = chatMarkup(EXAMPLES);
  guide.appendChild(slot.firstElementChild);
  messages.push({
    role: "bot",
    text: "Ask about a lesson in this lab. I quote the pages and I can be wrong. Cypher Monkey is a lifelong student and an AI builder.",
    follow: "What can you help with",
    followQ: "What can you help with",
  });
  paintChat(rootOf(), messages, false);
  loadIndex();
  guide.addEventListener("submit", (event) => {
    const form = event.target.closest(".py-chat-form");
    if (!form) return;
    event.preventDefault();
    const input = chatInput(guide);
    answer(input ? input.value : "");
  });
  guide.addEventListener("click", (event) => {
    const ask = event.target.closest("[data-py-ask]");
    if (ask) {
      event.preventDefault();
      answer(ask.dataset.pyAsk || ask.textContent);
      return;
    }
    if (event.target.closest("[data-py-clear]")) {
      event.preventDefault();
      clearChat();
      return;
    }
    if (event.target.closest("[data-py-mic]")) {
      event.preventDefault();
      listen();
      return;
    }
    const read = event.target.closest("[data-py-read]");
    if (read && window.speechSynthesis) {
      event.preventDefault();
      const msg = messages[Number(read.dataset.pyRead)];
      if (!msg) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg.text));
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();

try {
  var t = localStorage.getItem("canon-theme");
  if (["bloom", "aurora", "futuristic", "gaming", "neon", "sunset", "paper", "holographic", "cyberpunk", "contrast"].indexOf(t) < 0) t = "bloom";
  document.documentElement.dataset.theme = t || "bloom";
  var f = localStorage.getItem("canon-font");
  if (f === "sm" || f === "md" || f === "lg") document.documentElement.dataset.font = f;
  var m = localStorage.getItem("canon-motion");
  if (m === "reduce" || m === "full") document.documentElement.dataset.motion = m;
  var ink = localStorage.getItem("canon-ink");
  if (ink && /^#[0-9a-f]{6}$/i.test(ink)) document.documentElement.style.setProperty("--ink", ink);
} catch (e) {
  document.documentElement.dataset.theme = "bloom";
}

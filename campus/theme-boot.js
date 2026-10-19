try {
  var saved = JSON.parse(localStorage.getItem("mvcc-lab-v1") || "{}");
  var theme = saved.theme || "neon";
  document.documentElement.dataset.theme = theme;
  if (saved.lang === "ar") document.documentElement.dir = "rtl";
  if (saved.lang) document.documentElement.lang = saved.lang;
  document.documentElement.dataset.font = saved.font || "md";
  var motion = saved.reduceMotion || "system";
  var reduce = motion === "reduce" || (motion !== "full" && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  document.documentElement.dataset.motion = reduce ? "reduce" : "full";
} catch (err) {}

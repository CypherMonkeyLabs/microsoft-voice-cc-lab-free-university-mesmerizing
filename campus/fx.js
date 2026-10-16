/* Soft particles for the campus. Off when motion is reduced. */
(function () {
  var root = document.documentElement;
  function reduced() {
    if (root.dataset.motion === "reduce") return true;
    if (root.dataset.motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  if (reduced()) return;
  var canvas = document.createElement("canvas");
  canvas.className = "fx-particles";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var dots = [];
  var running = true;
  function size() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (dots.length) return;
    var i;
    for (i = 0; i < 16; i += 1) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.2 + Math.random() * 2,
        vy: -0.15 - Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        hue: [187, 262, 330][i % 3]
      });
    }
  }
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i;
    for (i = 0; i < dots.length; i += 1) {
      var dot = dots[i];
      dot.y += dot.vy;
      dot.x += dot.vx;
      if (dot.y < -6) dot.y = canvas.height + 6;
      ctx.beginPath();
      ctx.fillStyle = "hsla(" + dot.hue + ", 90%, 64%, 0.5)";
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    window.requestAnimationFrame(frame);
  }
  size();
  window.addEventListener("resize", size);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!running) { running = true; frame(); }
  });
  frame();
  var hero = document.querySelector(".neon-hero");
  if (!hero) return;
  window.addEventListener("scroll", function () {
    var shift = Math.max(-24, Math.min(24, Math.round(window.scrollY * 0.06)));
    hero.style.transform = "translate3d(0," + shift + "px,0)";
  }, { passive: true });
})();

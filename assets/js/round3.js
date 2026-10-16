/* Particles and a light parallax shift. Stays still when motion is reduced. */
(function () {
  var root = document.documentElement;

  function motionReduced() {
    if (root.dataset.motion === "reduce") return true;
    if (root.dataset.motion === "full") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  if (motionReduced()) return;

  var canvas = document.createElement("canvas");
  canvas.className = "fx-particles";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var dots = [];
  var running = true;

  function size() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    if (!dots.length) {
      var i;
      for (i = 0; i < 18; i += 1) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.2 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.15 - Math.random() * 0.35,
          hue: [187, 262, 330, 48][i % 4]
        });
      }
    }
  }

  function frame() {
    if (!running) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var i;
    for (i = 0; i < dots.length; i += 1) {
      var dot = dots[i];
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.y < -8) dot.y = h + 8;
      if (dot.x < -8) dot.x = w + 8;
      if (dot.x > w + 8) dot.x = -8;
      ctx.beginPath();
      ctx.fillStyle = "hsla(" + dot.hue + ", 90%, 62%, 0.55)";
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    window.requestAnimationFrame(frame);
  }

  size();
  window.addEventListener("resize", size);
  document.addEventListener("visibilitychange", function () {
    var hidden = document.hidden;
    if (hidden) running = false;
    else if (!running) {
      running = true;
      frame();
    }
  });
  frame();

  var hero = document.querySelector(".hero-band");
  if (!hero) return;
  var scheduled = false;
  window.addEventListener("scroll", function () {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      var shift = Math.max(-40, Math.min(40, Math.round(window.scrollY * 0.08)));
      hero.style.setProperty("--px", shift + "px");
    });
  }, { passive: true });
})();

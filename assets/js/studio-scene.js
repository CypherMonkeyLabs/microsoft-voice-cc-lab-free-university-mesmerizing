/* Aurora over the topic worlds. Canvas only, and it stops when motion is reduced. */
(function () {
  var host = document.querySelector(".aurora");
  if (!host) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
  if (reduce) return;
  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var frame = 0;
  var running = true;

  function size() {
    var rect = host.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
  }
  size();
  window.addEventListener("resize", size);

  function draw() {
    if (!running) return;
    frame += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < 3; i += 1) {
      var y = canvas.height * (0.3 + 0.2 * i) + Math.sin((frame + i * 40) / 28) * 6;
      ctx.strokeStyle = i === 1 ? "rgba(253, 224, 71, 0.85)" : "rgba(153, 246, 228, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var x = 0; x <= canvas.width; x += 8) {
        var yy = y + Math.sin((x + frame * 3 + i * 50) / 40) * 8;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    window.requestAnimationFrame(draw);
  }
  window.requestAnimationFrame(draw);
  document.addEventListener("visibilitychange", function () {
    running = document.visibilityState !== "hidden";
    if (running) window.requestAnimationFrame(draw);
  });
})();

document.querySelectorAll(".world-card").forEach(function (card) {
  card.addEventListener("click", function () {
    document.querySelectorAll(".world-card").forEach(function (other) {
      other.setAttribute("aria-pressed", other === card ? "true" : "false");
    });
    var note = document.getElementById("world-note");
    if (note) note.textContent = card.getAttribute("data-note") || "";
  });
});

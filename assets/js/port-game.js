(function () {
  var pairs = [{"code": "5061", "label": "Direct Routing signaling"}, {"code": "3478", "label": "Media low"}, {"code": "49152", "label": "Media high"}, {"code": "50000", "label": "Client audio"}, {"code": "50070", "label": "Client signaling"}];
  var i = 0;
  function ask() {
    document.getElementById("port-prompt").textContent = "Which label matches " + pairs[i].code + "?";
  }
  document.getElementById("port-choices").addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-port]");
    if (!btn) return;
    var ok = btn.getAttribute("data-port") === pairs[i].code;
    document.getElementById("port-result").textContent = ok ? "Yes. That matches the sheet." : "Not that one. Read the sheet under the game.";
    if (ok) { i = (i + 1) % pairs.length; ask(); }
  });
  ask();
})();

(function () {
  var hash = location.hash || "";
  var home = !hash || hash === "#" || hash === "#/";
  document.body.dataset.home = home ? "1" : "0";
})();

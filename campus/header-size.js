(function () {
  var bar = document.querySelector(".top");
  if (bar) document.documentElement.style.setProperty("--header-h", bar.offsetHeight + "px");
})();

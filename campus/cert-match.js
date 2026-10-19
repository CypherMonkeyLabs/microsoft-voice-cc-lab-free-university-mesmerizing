(function () {
  var form = document.getElementById("cert-form");
  var out = document.getElementById("result");
  function norm(value) {
    return String(value || "").trim().toLowerCase().replace(/\.$/, "");
  }
  function match(fqdn, san, wild) {
    if (!fqdn || !san) return false;
    if (fqdn === san) return true;
    if (!wild || san.charAt(0) !== "*" || san.charAt(1) !== ".") return false;
    var suffix = san.slice(1);
    var rest = fqdn.slice(0, fqdn.length - suffix.length);
    return fqdn.endsWith(suffix) && rest.length > 0 && rest.indexOf(".") === -1;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var fqdn = norm(document.getElementById("fqdn").value);
    var san = norm(document.getElementById("san").value);
    var wild = document.getElementById("wild").checked;
    var ok = match(fqdn, san, wild);
    out.className = "result " + (ok ? "ok" : "bad");
    out.textContent = ok
      ? "Simulation: the names match. This did not contact a vendor. OPTIONS and the certificate chain are separate checks."
      : "Simulation: the names do not match. A paired FQDN that is absent from the certificate name fails before media. Nothing was sent to a vendor.";
  });
})();

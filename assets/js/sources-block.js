/* Re-render a Sources and go deeper list from the room sources.json when fetch works. */
(function () {
  var KIND = {
    learn: "Microsoft Learn",
    docs: "Docs",
    rfc: "RFC",
    community: "Community",
    wikipedia: "Wikipedia",
    vendor: "Vendor"
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function publicNote(note) {
    return String(note || "")
      .replace(/Opened in place of https?:\/\/\S+, which did not open/g, "Opened in place of a page that did not open when checked")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,;])/g, "$1")
      .trim();
  }

  function item(source) {
    var title = esc(source.title || "Untitled");
    var url = esc(source.url || "");
    var checked = esc(source.lastChecked || "2026-10");
    var note = publicNote(source.note);
    if (source.status !== "ok" || !url) {
      return '<li class="is-confirm"><strong>' + title + "</strong> — confirm — last checked " +
        checked + ". Did not open when checked." + (note ? " " + esc(note) + "." : "") + "</li>";
    }
    var kind = KIND[source.kind] || "Docs";
    return '<li><a href="' + url + '">' + title + "</a> — " + kind + " — last checked " + checked + "." +
      (note ? " " + esc(note) : "") + "</li>";
  }

  function paint(block, data) {
    if (!data || !data.sources || !data.sources.length) return;
    var list = block.querySelector("ul");
    if (!list) return;
    list.innerHTML = data.sources.map(item).join("");
  }

  document.querySelectorAll("[data-sources]").forEach(function (block) {
    var href = block.getAttribute("data-sources");
    if (!href || href.indexOf("http") === 0) return;
    fetch(href).then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    }).then(function (data) {
      paint(block, data);
    }).catch(function () {
      /* Static list stays. file:// cannot fetch the JSON. */
    });
  });
})();

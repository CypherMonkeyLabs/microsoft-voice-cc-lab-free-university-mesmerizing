"""Large lab menu shared by the site footer and generated downloads."""

from __future__ import annotations

import html

WEB = "https://cyphermonkeylabs.com"

# Icons, labels, and one-line descriptions for the sister labs.
LABS: tuple[tuple[str, str, str, str, str], ...] = (
    ("UC Lab", f"{WEB}/uc-lab-free-university-mesmerizing/", "☎️", "#0f766e", "Cisco calling, studied offline and free."),
    ("Webex Lab", f"{WEB}/webex-lab-free-university-mesmerizing/", "📹", "#6366f1", "Webex calling and meetings, with the sources named."),
    ("Genesys Cloud", f"{WEB}/genesys-cloud-lab-free-university-mesmerizing/", "☁️", "#7c3aed", "Genesys Cloud contact center, public pages only."),
    ("Amazon Connect", f"{WEB}/amazon-connect-lab-free-university-mesmerizing/", "📞", "#d97706", "Amazon Connect flows, without a live account."),
    ("Five9", f"{WEB}/five9-lab-free-university-mesmerizing/", "🎧", "#0284c7", "Five9 contact center, cited for study."),
    ("NiCE CXone", f"{WEB}/nice-cxone-lab-free-university-mesmerizing/", "🧭", "#db2777", "NiCE CXone routing and quality, for study."),
    ("SIP Universe", f"{WEB}/sip-universe-lab-free-university-mesmerizing/", "🔀", "#059669", "SIP, trunks, and the path a call takes."),
    ("AI Lab", f"{WEB}/ai-lab-free-university-mesmerizing/", "✨", "#4f46e5", "Models and agents, separate from the phone system."),
)

VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">'

CSP_META = (
    '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; '
    "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
    "media-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; "
    "worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'\">"
)

SHEET_STYLE = (
    "<style>"
    "html{box-sizing:border-box}"
    "body{box-sizing:border-box;margin:0 auto;width:100%;max-width:880px;padding:16px;"
    "font:17px/1.5 system-ui,sans-serif;color:#0f172a;background:#f8fafc;overflow-wrap:anywhere}"
    "h1{font-size:1.8rem}"
    "a,p,li,h1,h2,h3{overflow-wrap:anywhere}"
    "ul,ol{margin:0.4rem 0;padding-left:1.15rem}"
    "a{color:#0b3a8f;font-weight:800}"
    ".disclaimer-panel a,.sources-deeper a{color:#0b3a8f}"
    ".sources-deeper{max-width:100%;box-sizing:border-box}"
    "img,svg,video{max-width:100%;height:auto}"
    "</style>"
)

DIAGRAM_STYLE = (
    "<style>"
    "html{box-sizing:border-box}"
    "body{margin:0;padding:16px;box-sizing:border-box;font:16px/1.45 system-ui,sans-serif;"
    "background:#0b1020;color:#e2e8f0;overflow-wrap:anywhere}"
    "svg{width:100%;max-width:100%;height:auto;display:block}"
    ".box{margin:0;padding:16px;border:2px solid #0f766e;border-radius:16px;background:#ecfdf5;"
    "color:#0b1f2a;overflow-wrap:anywhere;box-sizing:border-box;max-width:100%}"
    ".box a{color:#0b3a8f;font-weight:800;overflow-wrap:anywhere}"
    "a,p,li,h1,h2{overflow-wrap:anywhere}"
    "img,svg,video{max-width:100%;height:auto}"
    "</style>"
)

CAMPUS_STYLE = """<style>
  html { box-sizing: border-box; }
  body { box-sizing: border-box; margin: 0 auto; width: 100%; max-width: 820px; padding: 24px 16px; font: 16px/1.45 Inter, Segoe UI, sans-serif; color: #142033; background: #f7f4ea; overflow-wrap: anywhere; }
  h1 { font-size: 28px; letter-spacing: -0.03em; }
  p { margin: 0 0 6px; overflow-wrap: anywhere; }
  a, li, h1, h2 { overflow-wrap: anywhere; }
  footer { margin-top: 28px; border-top: 2px solid #123; padding-top: 12px; font-size: 13px; max-width: 100%; }
  a { color: #123; }
  img, svg { max-width: 100%; height: auto; }
  @media print { body { background: #fff; } }
</style>"""

CAMPUS_GLOSSARY_STYLE = """<style>
  html { box-sizing: border-box; }
  body { box-sizing: border-box; margin: 0 auto; width: 100%; max-width: 820px; padding: 24px 16px; font: 16px/1.45 Inter, Segoe UI, sans-serif; color: #142033; overflow-wrap: anywhere; }
  a, p, li, h1 { overflow-wrap: anywhere; }
  footer { margin-top: 24px; font-size: 13px; max-width: 100%; }
  img, svg { max-width: 100%; height: auto; }
</style>"""

CAMPUS_FLASH_STYLE = """<style>
  html { box-sizing: border-box; }
  body { box-sizing: border-box; font: 15px/1.4 Inter, Segoe UI, sans-serif; margin: 0 auto; width: 100%; max-width: 960px; padding: 16px; color: #142033; background: #fff; overflow-wrap: anywhere; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 10px; }
  .card { break-inside: avoid; border: 1px solid #123; border-radius: 10px; padding: 10px 12px; min-width: 0; }
  h2 { font-size: 16px; margin: 0 0 6px; overflow-wrap: anywhere; }
  p, a, li { margin: 0; overflow-wrap: anywhere; }
  .meta { color: #475569; margin-top: 6px; font-size: 12px; }
  footer { margin-top: 18px; font-size: 12px; max-width: 100%; }
  img, svg { max-width: 100%; height: auto; }
  @media print { .card { break-inside: avoid; } }
</style>"""

FOOTER_CSS = "../../assets/css/footer.css"


def lab_menu_html() -> str:
    """Card grid: icon, label, and a one-line description for each sister lab."""
    cards = []
    for name, href, icon, color, blurb in LABS:
        cards.append(
            f'<a class="lab-card" style="--c:{html.escape(color)}" href="{html.escape(href, quote=True)}">'
            f'<span class="lab-card-ico" aria-hidden="true">{html.escape(icon)}</span>'
            f'<span class="lab-card-copy"><strong>{html.escape(name)}</strong>'
            f"<small>{html.escape(blurb)}</small></span></a>"
        )
    return (
        '<nav class="next-labs" aria-label="More labs">'
        '<p class="next-title">More labs</p>'
        f'<div class="lab-cards">{"".join(cards)}</div></nav>'
    )

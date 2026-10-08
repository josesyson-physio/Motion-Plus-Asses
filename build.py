"""Build index.html from src/: inserts the template library and app script into the page shell."""
from pathlib import Path

src = Path(__file__).parent / "src"
html = (src / "shell.html").read_text(encoding="utf-8")
html = html.replace("/*TEMPLATES*/", (src / "templates.js").read_text(encoding="utf-8"))
html = html.replace("/*APP*/", (src / "app.js").read_text(encoding="utf-8"))
(Path(__file__).parent / "index.html").write_text(html, encoding="utf-8")
print("Built index.html")

# Posture app: src/posture.html is the page content (also published as a Claude artifact).
# posture/index.html wraps it as a standalone page for any browser or web host.
posture = (src / "posture.html").read_text(encoding="utf-8")
head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#1d5fa8"><link rel="manifest" href="manifest.webmanifest">'
        '<link rel="apple-touch-icon" href="../assets/motionplus-logo.jpg">'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
(Path(__file__).parent / "posture" / "index.html").write_text(head + posture + "</body></html>", encoding="utf-8")
print("Built posture/index.html")

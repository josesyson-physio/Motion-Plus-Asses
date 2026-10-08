"""Build index.html from src/: inserts the template library and app script into the page shell."""
from pathlib import Path

src = Path(__file__).parent / "src"
html = (src / "shell.html").read_text(encoding="utf-8")
html = html.replace("/*TEMPLATES*/", (src / "templates.js").read_text(encoding="utf-8"))
html = html.replace("/*APP*/", (src / "app.js").read_text(encoding="utf-8"))
(Path(__file__).parent / "index.html").write_text(html, encoding="utf-8")
print("Built index.html")

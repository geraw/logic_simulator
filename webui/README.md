# Logic Simulator Web UI

Two delivery modes are supported:

1. Dynamic server (FastAPI) – original prototype (`webui/app.py`).
2. 100% static, in‑browser Python via Pyodide / WebAssembly (`webui/static/pyodide.html`).

---
## 1. FastAPI Mode (Dynamic Backend)

### Features
- Code editing (CodeMirror) + simulate via Python backend
- Runs scoring scripts server‑side

### Run Locally

```bash
pip install fastapi uvicorn jinja2 python-multipart pygments
python -m webui.app
```
Open: http://127.0.0.1:8000

---
## 2. Pure Static (Pyodide) Mode

`webui/static/pyodide.html` loads Pyodide in the browser, fetches the existing `simulator.py`, `circuit_parser.py`, and `grammar.lark`, installs `lark` via `micropip`, and executes simulations entirely client‑side. No server needed – suitable for GitHub Pages.

### What Works Now
- Simulate arbitrary circuit text
- Provide inputs (e.g. `X=1010;Y=11`) and steps
- Run challenge scoring (fetches each challenge's `score.py` and executes it in Pyodide)

### Try It (after publishing on GitHub Pages)
Navigate to: `https://<your_user>.github.io/<repo>/webui/static/pyodide.html`

If running locally without a server, most browsers block `fetch()` of local files. Use a tiny dev server:
```bash
python -m http.server 8001
# then open http://127.0.0.1:8001/webui/static/pyodide.html
```

### How It Works Internally
1. Loads Pyodide runtime
2. Installs `lark` (pure Python) with `micropip`
3. Fetches project Python sources (relative paths) & writes them into Pyodide's virtual FS
4. Exposes JS helpers: `simulate(code, inputs, steps)` and `score(challenge, code)`
5. Scoring fetches `challenges/<id>/score.py`, loads it, writes a temp circuit `_web_submission.cir`, runs `verify_circuit()`.

### Limitations / Next Improvements
- Initial load (~ a few MB) due to Pyodide + lark
- No offline caching strategy (could add Service Worker)
- Waveform view still textual
- No custom syntax highlighting yet (current mode = plain text)

---
## 3. Choosing a Mode
| Goal | Recommended | Notes |
|------|-------------|-------|
| Quick local dev | FastAPI | Faster incremental edits |
| Zero install demo | Pyodide | Pure static hosting |
| Lowest load time | JS port (future) | Would remove Pyodide overhead |

---
## 4. Security Considerations
Both modes execute user‑supplied Python-equivalent logic (your circuit DSL is safe, but scoring scripts are code). Do **not** expose dynamic mode publicly without sandboxing. Pyodide runs in browser sandbox (safer) but still executes fetched Python packages.

---
## 5. File Reference
| File | Purpose |
|------|---------|
| `webui/app.py` | FastAPI backend server |
| `webui/templates/index.html` | Dynamic UI template |
| `webui/static/pyodide.html` | Stand‑alone static Pyodide UI |
| `webui/static/pyodide.js` | JS glue for Pyodide simulator & scoring |
| `webui/static/challenges_index.json` | Static list of challenge IDs (used by Pyodide UI) |

---
## 6. Roadmap Ideas
- Custom CodeMirror mode for the circuit DSL
- SVG waveform panel
- LocalStorage persistence per challenge
- Service Worker for offline caching
- JS-native parser/simulator (remove Pyodide)

---
## 7. Contributing
PRs welcome. Keep static + dynamic modes in sync when adjusting core logic.

---
## 8. License
(Add license details here if applicable.)


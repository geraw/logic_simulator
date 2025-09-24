
# Logic Simulator Web UI (Zero Install, Pure Static Hosting)

This project is now **100% static** and runs entirely in the browser using Pyodide (WebAssembly Python). No server or installation required.

## Usage

1. Open [`webui/static/pyodide.html`](webui/static/pyodide.html) in your browser.
	- For GitHub Pages: `https://<your_user>.github.io/<repo>/webui/static/pyodide.html`
	- For local testing: run a static server (e.g. `python -m http.server 8001`) and open `http://127.0.0.1:8001/webui/static/pyodide.html`

## Features
- Edit circuit code with syntax highlighting (custom CodeMirror mode)
- Enter input bitstreams per signal
- Simulate and view outputs (all logic runs in-browser)
- Run challenge scoring (fetches each challenge's `score.py` and executes in Pyodide)

## How It Works
1. Loads Pyodide runtime in the browser
2. Installs `lark` (pure Python) with `micropip`
3. Fetches project Python sources (`simulator.py`, `circuit_parser.py`, `grammar.lark`, etc.) and writes them into Pyodide's virtual FS
4. Runs simulation and scoring entirely client-side

## Limitations / Next Improvements
- Initial load (~ a few MB) due to Pyodide + lark
- No offline caching strategy (could add Service Worker)
- Waveform view still textual
- LocalStorage persistence per challenge (planned)
- SVG waveform panel (planned)

## Security Considerations
All code runs in the browser sandbox. Scoring scripts are executed as Python in Pyodide; do not fetch untrusted code.

## File Reference
| File | Purpose |
|------|---------|
| `webui/static/pyodide.html` | Main static UI (Pyodide) |
| `webui/static/circuit_mode.js` | Custom CodeMirror mode for circuit DSL |
| `webui/static/challenges_index.json` | Static list of challenge IDs (used by Pyodide UI) |

## Contributing
PRs welcome. Keep static mode up to date with any core logic changes.




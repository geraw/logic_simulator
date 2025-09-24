"""FastAPI + HTMX web UI for the logic simulator."""

import uvicorn
from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os, sys, importlib.util, traceback, types
from typing import Dict, List

# Ensure project root is importable
ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(ROOT)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from circuit_parser import parse_file
from simulator import Simulator

app = FastAPI()

templates = Jinja2Templates(directory=os.path.join(ROOT, 'templates'))

# Static assets (CodeMirror, htmx, etc.) will go in static/
static_path = os.path.join(ROOT, 'static')
os.makedirs(static_path, exist_ok=True)
app.mount('/static', StaticFiles(directory=static_path), name='static')

CHALLENGES_DIR = os.path.join(PROJECT_ROOT, 'challenges')

CODEMIRROR_CSS = "https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css"
CODEMIRROR_JS = "https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js"
CODEMIRROR_MODE = "https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/clike/clike.min.js"  # placeholder
HTMX_JS = "https://unpkg.com/htmx.org@1.9.12"

BASE_SAMPLE = """# Example circuit\nNOT(x) := NAND(x,x)\nA = NOT(B)\n"""


def list_challenges() -> List[str]:
    return sorted([d for d in os.listdir(CHALLENGES_DIR) if os.path.isdir(os.path.join(CHALLENGES_DIR,d))])


def load_challenge_solution(challenge: str) -> str:
    sol_path = os.path.join(CHALLENGES_DIR, challenge, 'solution.cir')
    if os.path.exists(sol_path):
        return open(sol_path).read()
    return BASE_SAMPLE


@app.get('/', response_class=HTMLResponse)
async def index(request: Request, challenge: str | None = None):
    challenges = list_challenges()
    challenge = challenge or (challenges[0] if challenges else '')
    code = load_challenge_solution(challenge) if challenge else BASE_SAMPLE
    return templates.TemplateResponse('index.html', {
        'request': request,
        'code': code,
        'challenges': challenges,
        'selected': challenge,
        'codemirror_css': CODEMIRROR_CSS,
        'codemirror_js': CODEMIRROR_JS,
        'codemirror_mode': CODEMIRROR_MODE,
        'htmx_js': HTMX_JS,
    })


@app.post('/simulate')
async def simulate(code: str = Form(...), steps: int = Form(8), inputs: str = Form("")):
    """Simulate posted circuit code with provided inputs string."""
    try:
        tmp_path = os.path.join(ROOT, '_tmp.cir')
        with open(tmp_path,'w') as f:
            f.write(code)
        circuit = parse_file(tmp_path)
        sim = Simulator(circuit)

        # Parse inputs like: X=1010;Y=111
        input_map: Dict[str,str] = {}
        if inputs.strip():
            for pair in inputs.split(';'):
                if not pair.strip():
                    continue
                if '=' not in pair:
                    return JSONResponse({'error': f'Invalid input fragment: {pair}'}, status_code=400)
                name,val = pair.split('=',1)
                input_map[name.strip()] = ''.join(ch for ch in val.strip() if ch in '01')
        outputs = sim.run(input_map, steps)
        return JSONResponse({'outputs': outputs, 'history': sim.history})
    except Exception as e:
        return JSONResponse({'error': str(e), 'trace': traceback.format_exc()}, status_code=500)


@app.post('/score')
async def score(challenge: str = Form(...), code: str = Form(...)):
    """Run the challenge's score.py with the provided code instead of solution.cir."""
    try:
        challenge_dir = os.path.join(CHALLENGES_DIR, challenge)
        if not os.path.isdir(challenge_dir):
            return JSONResponse({'error': f'Unknown challenge {challenge}'}, status_code=404)
        # Write temp file inside challenge dir so relative imports work
        temp_circuit = os.path.join(challenge_dir, '_web_submission.cir')
        with open(temp_circuit,'w') as f:
            f.write(code)

        # Dynamic import of score.py
        score_path = os.path.join(challenge_dir, 'score.py')
        if not os.path.exists(score_path):
            return JSONResponse({'error': 'score.py not found for challenge'}, status_code=404)

        spec = importlib.util.spec_from_file_location(f'score_{challenge}', score_path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module  # type: ignore
        assert spec.loader
        spec.loader.exec_module(module)  # type: ignore

        if hasattr(module, 'verify_circuit'):
            ok = module.verify_circuit(temp_circuit)
            return JSONResponse({'passed': ok})
        return JSONResponse({'error': 'verify_circuit() not exported in score.py'}, status_code=500)
    except Exception as e:
        return JSONResponse({'error': str(e), 'trace': traceback.format_exc()}, status_code=500)


def main():
    uvicorn.run('webui.app:app', host='127.0.0.1', port=8000, reload=True)

if __name__ == '__main__':
    main()

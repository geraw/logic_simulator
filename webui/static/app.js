// Use a global flag to prevent the script from running more than once
if (window.appInitialized) {
    console.warn("app.js is already initialized. Skipping redundant execution.");
} else {
    window.appInitialized = true;

    // Wait for the DOM to be fully loaded before executing the script
    document.addEventListener('DOMContentLoaded', function () {

        // Logic Simulator JavaScript Application

        // Inside the DOMContentLoaded listener...
        let editor = CodeMirror.fromTextArea(document.getElementById('code'), {
            lineNumbers: true,
            mode: 'circuitdsl',
            theme: 'material', 
            gutters: ["CodeMirror-linenumbers", "syntax-errors"]
        });

        // Configure CodeMirror wrapper for proper flex layout
        const editorWrapper = editor.getWrapperElement();
        if (editorWrapper) {
            editorWrapper.style.flex = '1'; // Make editor fill its container
            editorWrapper.style.minHeight = '150px';
        }

        // DOM element references
        const statusEl = document.getElementById('status');
        const logEl = document.getElementById('log');
        const challengeSelect = document.getElementById('challengeSelect');
        const challengesPanel = document.getElementById('challengesPanel');
        const logModal = document.getElementById('logModal');
        const scoreModal = document.getElementById('scoreModal');
        const readmeModal = document.getElementById('readmeModal');

        // Global keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            }
            if (e.ctrlKey && (e.key === 'q' || e.key === 'Q')) {
                e.preventDefault(); // Prevent browser default action for Ctrl+Q
                const activeBtn = document.querySelector('#challengesPanel button.active');
                const selectedChallenge = challengeSelect ? challengeSelect.value : (activeBtn ? activeBtn.dataset.challenge : null);
                if (selectedChallenge) {
                    loadChallengeCode(selectedChallenge);
                    log(`Loaded solution for ${selectedChallenge} via shortcut.`);
                } else {
                    log('No challenge selected to load via shortcut.');
                }
            }
        });

        // Logging utility
        function log(msg) {
            logEl.textContent += msg + "\n";
            logEl.scrollTop = logEl.scrollHeight;
        }

        // Log modal functionality
        document.getElementById('logMenuBtn').addEventListener('click', function () {
            logModal.style.display = 'flex';
        });

        // Resolve project-relative URLs robustly for GitHub Pages
        const REPO_SLUG = 'AliceBobCasino';
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        const idx = pathname.indexOf('/webui/static/');
        const basePrefix = (idx >= 0 ? pathname.substring(0, idx + 1) : '/'); // '/AliceBobCasino/' or '/'
        const buildUrl = (relPath) => new URL(relPath.replace(/^\/+/, ''), origin + basePrefix).toString();
        async function fetchWithPagesFallback(relPath) {
            // First try the computed base
            let url = buildUrl(relPath);
            let r = await fetch(url);
            if (r.ok) return r;
            // If served at root of *.github.io (user site), try prefixing the repo slug
            if (basePrefix === '/' && /\.github\.io$/i.test(window.location.hostname)) {
                const alt = `${origin}/${REPO_SLUG}/${relPath.replace(/^\/+/, '')}`;
                const r2 = await fetch(alt);
                if (r2.ok) return r2;
            }
            return r; // return original response (to preserve status/message)
        }

        // README display functions
    async function showMainReadme() {
            try {
                const r = await fetchWithPagesFallback('webui/README.md');
                if (!r.ok) throw new Error(`Could not fetch main README`);
                const readmeText = await r.text();
                const converter = new showdown.Converter();
                const html = converter.makeHtml(readmeText);
                document.getElementById('readmeContent').innerHTML = html;
                readmeModal.style.display = 'flex';
            } catch (e) {
                log('Error showing main README: ' + e.message);
                alert('Could not load main README.');
            }
        }

        document.getElementById('mainReadmeBtn').addEventListener('click', async function (e) {
            e.preventDefault();
            showMainReadme();
        });

        async function showChallengeReadme(challengeName) {
            if (!challengeName) {
                log('No challenge name provided');
                return;
            }
            try {
                const r = await fetchWithPagesFallback(`challenges/${challengeName}/README.md`);
                if (!r.ok) throw new Error(`Could not fetch README for ${challengeName}`);
                const readmeText = await r.text();
                const converter = new showdown.Converter();
                const html = converter.makeHtml(readmeText);
                document.getElementById('readmeContent').innerHTML = html;
                readmeModal.style.display = 'flex';

                // Update internal state and UI to reflect the selection
                if (challengeSelect) {
                    challengeSelect.value = challengeName;
                } else {
                    log('No challengeSelect element, using buttons only');
                }
                document.querySelectorAll('#challengesPanel button').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.challenge === challengeName);
                });

            } catch (e) {
                log('Error showing README: ' + e.message);
                //alert('Could not load README for this challenge.');
            }
        }

        // Challenge code loading
        async function loadChallengeCode(challengeName) {
            if (!challengeName) return;
            try {
                const response = await fetchWithPagesFallback(`challenges/${challengeName}/solution.cir`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const code = await response.text();
                editor.setValue(code);
            } catch (e) {
                log(`Failed to load challenge ${challengeName}: ${e.message}`);
                editor.setValue(`# Failed to load: ${challengeName}\n`);
            }
        }

        // Challenge panel click handler
        challengesPanel.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.challenge) {
                showChallengeReadme(e.target.dataset.challenge);
            }
        });

        // Load challenges from a hardcoded list (no network fetch)
        async function loadChallenges() {
            const challenges = [
                '01-palindrome',
                '02-debruijn',
                '03-comparison',
                '04-majority',
                '05-checksum',
                '06-CRC',
                '99-alice_bob_casino'
            ];

            challenges.forEach(c => {
                // Populate hidden select if present
                if (challengeSelect) {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    challengeSelect.appendChild(opt);
                }

                // Create button in the panel
                const btn = document.createElement('button');
                btn.textContent = c;
                btn.dataset.challenge = c;
                challengesPanel.appendChild(btn);
            });

            // If using buttons-only UI, set the first challenge as active by default
            const anyActive = document.querySelector('#challengesPanel button.active');
            if (!anyActive) {
                const firstBtn = document.querySelector('#challengesPanel button[data-challenge]');
                if (firstBtn) firstBtn.classList.add('active');
            }

            // Add score button at the end
            const checkBtn = document.createElement('button');
            checkBtn.textContent = 'Check Solution';
            checkBtn.id = 'checkSolutionBtn';
            challengesPanel.appendChild(checkBtn);
            checkBtn.addEventListener('click', scoreChallenge);
        }

        // Pyodide initialization
        let pyodideReadyPromise = (async () => {
            statusEl.textContent = 'Loading Pyodide...';
            const pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
            });
            statusEl.textContent = 'Installing lark via micropip...';
            await pyodide.loadPackage('micropip');
            await pyodide.runPythonAsync(`import micropip; await micropip.install('lark-parser')`);
            statusEl.textContent = 'Fetching project sources...';

            async function fetchText(path) {
                const r = await fetch(path);
                if (!r.ok) throw new Error('fetch failed ' + path);
                return await r.text();
            }

            // Load project files using the same base logic
            const rootPrefix = basePrefix;
            const files = ['circuit_parser.py', 'simulator.py', 'grammar.lark', 'scoring_framework.py'];
            for (const f of files) {
                let ok = false;
                try {
                    const path = buildUrl(f);
                    const txt = await fetchText(path);
                    pyodide.FS.writeFile(f, txt);
                    log('Loaded ' + f + ' from ' + path);
                    ok = true;
                } catch (e) {
                    log('FAILED to load ' + f + ' (adjust paths if hosting structure differs)');
                }
            }

            // Provide a lightweight wrapper for simulate in Python
            await pyodide.runPythonAsync(`
import json
from circuit_parser import parse_file
from simulator import Simulator

def simulate_inline(code:str, inputs:dict, steps:int):
  with open('_inline.cir','w') as f:
    f.write(code)
  circuit = parse_file('_inline.cir')
  sim = Simulator(circuit)
  outputs = sim.run(inputs, steps)
  result = {'outputs': outputs, 'history': sim.history}
  return json.dumps(result)
`);

            return pyodide;
        })();

        // Live syntax checking
        async function checkSyntaxLive(code) {
            const pyodide = await pyodideReadyPromise;
            // Remove previous error highlights and gutter markers
            if (window._errMarker) {
                window._errMarker.clear();
                window._errMarker = null;
            }
            editor.clearGutter("syntax-errors");
            try {
                pyodide.FS.writeFile('_inline.cir', code);
                await pyodide.runPythonAsync(`from circuit_parser import parse_file\nparse_file('_inline.cir')`);
            } catch (e) {
                let fullMsg = (e && e.message) ? String(e.message) : String(e);
                let lineColMatch = fullMsg.match(/at Line (\d+), Column (\d+)|line (\d+) col (\d+)/);
                let lineNum = null, colNum = null;
                if (lineColMatch) {
                    lineNum = parseInt(lineColMatch[1] || lineColMatch[3], 10);
                    colNum = parseInt(lineColMatch[2] || lineColMatch[4], 10);
                }
                if (lineNum) {
                    window._errMarker = editor.markText({ line: lineNum - 1, ch: colNum ? colNum - 1 : 0 }, { line: lineNum - 1, ch: colNum ? colNum : 100 }, { className: 'cm-error-highlight' });
                    const marker = document.createElement("div");
                    marker.style.color = "#b00";
                    marker.innerHTML = "&#x25CF;";
                    marker.title = "Syntax error";
                    editor.setGutterMarker(lineNum - 1, "syntax-errors", marker);
                }
            }
        }

        editor.on('change', function () {
            checkSyntaxLive(editor.getValue());
        });

        // --- Simplified Resizer Functionality ---
        const resizer = document.getElementById('resizer');
        const editorSection = document.querySelector('.editor-section');
        const outputsSection = document.querySelector('.outputs-section');
        const main = document.querySelector('main');

        const startResize = (e) => {
            e.preventDefault();
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('touchmove', handleResize, { passive: false });
            window.addEventListener('mouseup', stopResize);
            window.addEventListener('touchend', stopResize);
        };

        const handleResize = (e) => {
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const mainRect = main.getBoundingClientRect();
            const newEditorHeight = clientY - mainRect.top;
            const minEditorHeight = 150;
            const minOutputsHeight = 100;

            if (newEditorHeight > minEditorHeight && newEditorHeight < (mainRect.height - minOutputsHeight)) {
                editorSection.style.flexBasis = newEditorHeight + 'px';
                outputsSection.style.flexBasis = (mainRect.height - newEditorHeight - resizer.offsetHeight) + 'px';
            }
        };

        const stopResize = () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('touchmove', handleResize);
            window.removeEventListener('mouseup', stopResize);
            window.removeEventListener('touchend', stopResize);
        };

        resizer.addEventListener('mousedown', startResize);
        resizer.addEventListener('touchstart', startResize, { passive: false });


        // Error display
        function showError(message) {
            document.getElementById('errormsg').innerHTML = message;
            document.getElementById('errorModal').style.display = 'flex';
            statusEl.textContent = 'Input validation error';
        }

        // Input validation
        function validateInputFormat(inputStr) {
            if (!inputStr) {
                showError('Input cannot be empty. Expected format: VariableName=BinaryString (e.g., I=1010; X=111)');
                return false;
            }
            const assignments = inputStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
            if (assignments.length === 0) {
                showError('Input cannot be empty. Expected format: VariableName=BinaryString (e.g., I=1010)');
                return false;
            }
            const validVarName = /^[A-Za-z_][A-Za-z0-9_]*$/;
            for (const assignment of assignments) {
                const parts = assignment.split('=');
                if (parts.length !== 2) {
                    showError(`Invalid assignment "${assignment}". Expected format: VariableName=BinaryString (e.g., I=1010)`);
                    return false;
                }
                const [varName, value] = parts.map(s => s.trim());
                if (!varName || !validVarName.test(varName)) {
                    showError(`Invalid variable name "${varName}".`);
                    return false;
                }
                if (!value || /[^01]/.test(value)) {
                    showError(`Value for variable "${varName}" contains invalid characters. Only 0s and 1s are allowed.`);
                    return false;
                }
            }
            return true;
        }

        // Main simulation function
        async function simulate() {
            const pyodide = await pyodideReadyPromise;
            const inputStr = document.getElementById('inputs').value.trim();
            if (!validateInputFormat(inputStr)) {
                return;
            }
            statusEl.textContent = 'Simulating...';
            const code = editor.getValue();
            const steps = parseInt(document.getElementById('steps').value, 10) || 8;
            const inputs = {};
            if (inputStr) {
                for (const frag of inputStr.split(';')) {
                    if (!frag) continue;
                    const [k, v] = frag.split('=');
                    if (k && v) inputs[k.trim()] = v.trim();
                }
            }
            try {
                document.getElementById('errorModal').style.display = 'none';
                document.getElementById('errormsg').innerHTML = '';
                const pySnippet = `res = simulate_inline(${JSON.stringify(code)}, ${JSON.stringify(inputs)}, ${steps})`;
                log('Running simulation with inputs: ' + JSON.stringify(inputs) + ', steps: ' + steps);
                await pyodide.runPythonAsync(pySnippet);
                log('Simulation completed');
                const pyResult = pyodide.runPython('res');
                if (!pyResult) throw new Error('Result object is null');
                const jsResult = JSON.parse(pyResult);
                let outputsObj = jsResult.outputs;
                if (!outputsObj) throw new Error('Missing outputs in result');
                const outDiv = document.getElementById('outputs');
                outDiv.innerHTML = '';
                Object.entries(outputsObj).forEach(([k, v]) => {
                    const d = document.createElement('div');
                    d.textContent = k + ': ' + v;
                    outDiv.appendChild(d);
                });
                statusEl.textContent = 'Done';
            } catch (e) {
                let fullMsg = (e && e.message) ? String(e.message) : String(e);
                let errorText = fullMsg;
                if (fullMsg.includes('Traceback')) {
                    errorText = fullMsg.split('\n').filter(l => !/pyodide|run_async|_pyodide|File "<exec>"/.test(l)).join('\n');
                }
                errorText = errorText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                errorText = errorText.split('\n').map(l => l.replace(/^ +/g, m => '&nbsp;'.repeat(m.length))).join('<br>');
                document.getElementById('errormsg').innerHTML = `<div style='font-family:monospace; white-space:pre;'>${errorText}</div>`;
                document.getElementById('errorModal').style.display = 'flex';
                log('Error: ' + fullMsg);
                statusEl.textContent = 'Error';
            }
        }

        // Challenge scoring function
        async function scoreChallenge() {
            const activeBtn = document.querySelector('#challengesPanel button.active');
            const challenge = activeBtn ? activeBtn.dataset.challenge : null;
            if (!challenge) {
                alert('Please select a challenge first.');
                return;
            }
            const pyodide = await pyodideReadyPromise;
            statusEl.textContent = 'Scoring...';
            try {
                const scorePath = `../../challenges/${challenge}/score.py`;
                const r = await fetch(scorePath);
                if (!r.ok) throw new Error(`Cannot fetch ${scorePath}`);
                const scoreCode = await r.text();
                pyodide.FS.writeFile('score_tmp.py', scoreCode);
                const code = editor.getValue();
                pyodide.FS.writeFile('_web_submission.cir', code);

                const py = `
import importlib.util, sys, io
from contextlib import redirect_stdout

spec = importlib.util.spec_from_file_location('score_tmp','score_tmp.py')
mod = importlib.util.module_from_spec(spec)
sys.modules['score_tmp'] = mod
spec.loader.exec_module(mod)
import json

result = {'passed': False, 'error': 'verify_circuit() missing'}
output_log = io.StringIO()
if hasattr(mod, 'verify_circuit'):
    with redirect_stdout(output_log):
        ok = mod.verify_circuit('_web_submission.cir')
    result = {'passed': ok, 'log': output_log.getvalue()}
json.dumps(result)
`;
                const jsonRes = await pyodide.runPythonAsync(py);
                const jsRes = JSON.parse(jsonRes);

                let resultHtml = jsRes.passed ?
                    '<span style="color:green; font-weight:bold;">All tests passed ✔</span>' :
                    '<span style="color:orange; font-weight:bold;">Tests failed ✖</span>';

                if (jsRes.log) {
                    resultHtml += `<pre style="background:#eee; border:1px solid #ccc; padding:8px; margin-top:12px; text-align:left;">${jsRes.log.replace(/</g, '&lt;')}</pre>`;
                }

                document.getElementById('scoreresult').innerHTML = resultHtml;
                scoreModal.style.display = 'flex';
                statusEl.textContent = 'Score complete';
            } catch (e) {
                log('Score error: ' + e);
                statusEl.textContent = 'Score error';
                document.getElementById('scoreresult').innerHTML = `<span style="color:red">An error occurred during scoring. See console log.</span>`;
                scoreModal.style.display = 'flex';
            }
        }

        // Event listeners
        document.getElementById('runBtn').addEventListener('click', simulate);

        // Initialize application
        loadChallenges();
        showMainReadme();

    }); // End of DOMContentLoaded
}
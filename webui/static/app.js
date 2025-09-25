// Logic Simulator JavaScript Application

// Initialize CodeMirror editor
let editor = CodeMirror.fromTextArea(document.getElementById('code'), { 
  lineNumbers: true, 
  mode: 'circuitdsl', 
  gutters: ["CodeMirror-linenumbers", "syntax-errors"] 
});

// Configure CodeMirror wrapper for proper flex layout
const editorWrapper = editor.getWrapperElement();
if (editorWrapper) {
  editorWrapper.style.flex = '4 1 80%';
  editorWrapper.style.minHeight = '200px';
  console.log('CodeMirror wrapper configured for flex layout - 80% editor, 20% outputs');
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
document.getElementById('logMenuBtn').addEventListener('click', function() {
  logModal.style.display = 'flex';
});

// README display functions
async function showMainReadme() {
  try {
  const readmePath = `/webui/README.md`;
    const r = await fetch(readmePath);
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

document.getElementById('mainReadmeBtn').addEventListener('click', async function(e) {
  e.preventDefault();
  showMainReadme();
});

async function showChallengeReadme(challengeName) {
  if (!challengeName) { 
    log('No challenge name provided'); 
    return; 
  }
  try {
  const readmePath = `/challenges/${challengeName}/README.md`;
    const r = await fetch(readmePath);
    if (!r.ok) throw new Error(`Could not fetch README for ${challengeName}`);
    const readmeText = await r.text();
    const converter = new showdown.Converter();
    const html = converter.makeHtml(readmeText);
    document.getElementById('readmeContent').innerHTML = html;
    readmeModal.style.display = 'flex';

    // Update internal state and UI to reflect the selection
    if (challengeSelect) {
      challengeSelect.value = challengeName;
    }
    else {
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
  const path = `/challenges/${challengeName}/solution.cir`;
  const response = await fetch(path);
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
  const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
  statusEl.textContent = 'Installing lark via micropip...';
  await pyodide.loadPackage('micropip');
  await pyodide.runPythonAsync(`import micropip; await micropip.install('lark-parser')`);
  statusEl.textContent = 'Fetching project sources...';

  async function fetchText(path) {
    const r = await fetch(path); 
    if (!r.ok) throw new Error('fetch failed ' + path); 
    return await r.text(); 
  }
  
  // Load project files relative to the server root
  const rootPrefix = '/';
  const files = ['circuit_parser.py', 'simulator.py', 'grammar.lark', 'scoring_framework.py'];
  for (const f of files) {
    let ok = false;
    for (const prefix of [rootPrefix, '../' + f]) { // try root then legacy wrong path for diagnostics
      try {
        const path = prefix === rootPrefix ? rootPrefix + f : '../' + f; // clarity
        const txt = await fetchText(path);
        pyodide.FS.writeFile(f, txt);
        log('Loaded ' + f + ' from ' + path);
        ok = true; 
        break;
      } catch (e) {
        // continue to next attempt
      }
    }
    if (!ok) log('FAILED to load ' + f + ' (adjust paths if hosting structure differs)');
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
    // Try parsing only, don't run simulation
    await pyodide.runPythonAsync(`from circuit_parser import parse_file\nparse_file('_inline.cir')`, { 
      globals: { 
        '__builtins__': pyodide.globals.get('__builtins__'), 
        'open': () => ({ write: () => code }) 
      } 
    });
    // No error, do nothing
  } catch (e) {
    let fullMsg = (e && e.message) ? String(e.message) : String(e);
    // Extract line/col info
    let lineColMatch = fullMsg.match(/at line (\d+) col (\d+)/);
    let lineNum = null, colNum = null;
    if (lineColMatch) {
      lineNum = parseInt(lineColMatch[1], 10);
      colNum = parseInt(lineColMatch[2], 10);
    }
    // Highlight error line and gutter
    if (lineNum) {
      window._errMarker = editor.markText(
        { line: lineNum - 1, ch: colNum ? colNum - 1 : 0 }, 
        { line: lineNum - 1, ch: colNum ? colNum : 100 }, 
        { className: 'cm-error-highlight' }
      );
      const marker = document.createElement("div");
      marker.style.color = "#b00";
      marker.innerHTML = "&#x25CF;";
      marker.title = "Syntax error";
      editor.setGutterMarker(lineNum - 1, "syntax-errors", marker);
    }
  }
}

editor.on('change', function() {
  checkSyntaxLive(editor.getValue());
});

// Resizer functionality
let isResizing = false;
let startY = 0;
let startEditorHeight = 0;
let startOutputsHeight = 0;

function startResize(clientY) {
  isResizing = true;
  startY = clientY;
  
  // Get current heights
  const editorElement = editor.getWrapperElement();
  const outputsSection = document.querySelector('.outputs-section');
  
  if (editorElement && outputsSection) {
    startEditorHeight = editorElement.offsetHeight;
    startOutputsHeight = outputsSection.offsetHeight;
    
    console.log('Starting resize - Editor height:', startEditorHeight, 'Outputs height:', startOutputsHeight);
  }
  
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
}

// Mouse events for resizer
document.getElementById('resizer').addEventListener('mousedown', function(e) {
  startResize(e.clientY);
  e.preventDefault();
});

// Touch events for mobile resizer
document.getElementById('resizer').addEventListener('touchstart', function(e) {
  if (e.touches.length === 1) {
    startResize(e.touches[0].clientY);
    e.preventDefault();
  }
}, { passive: false });

function handleResize(clientY) {
  if (!isResizing) return;

  const editorElement = editor.getWrapperElement();
  const outputsSection = document.querySelector('.outputs-section');
  if (!editorElement || !outputsSection) {
    console.log('Missing elements during resize');
    return;
  }

  // Calculate the change in position
  const deltaY = clientY - startY;
  
  // Calculate new heights
  let newEditorHeight = startEditorHeight + deltaY;
  let newOutputsHeight = startOutputsHeight - deltaY;
  
  // Calculate maximum available height for better limits
  const main = document.querySelector('main');
  const inputsPanel = document.querySelector('.inputs-panel');
  const resizer = document.getElementById('resizer');
  const availableHeight = main.clientHeight - inputsPanel.offsetHeight - resizer.offsetHeight - 16; // Account for gaps
  
  // Minimum sizes
  const minEditorHeight = 150;
  const minOutputsHeight = 100;
  
  // Enforce minimum and maximum sizes
  if (newEditorHeight < minEditorHeight) {
    newEditorHeight = minEditorHeight;
    newOutputsHeight = availableHeight - newEditorHeight;
  } else if (newOutputsHeight < minOutputsHeight) {
    newOutputsHeight = minOutputsHeight;
    newEditorHeight = availableHeight - newOutputsHeight;
  } else if (newEditorHeight + newOutputsHeight > availableHeight) {
    // Proportionally reduce both if they exceed available space
    const ratio = availableHeight / (newEditorHeight + newOutputsHeight);
    newEditorHeight = Math.floor(newEditorHeight * ratio);
    newOutputsHeight = availableHeight - newEditorHeight;
  }

  // Apply new heights with !important to override flex
  editorElement.style.setProperty('height', newEditorHeight + 'px', 'important');
  outputsSection.style.setProperty('height', newOutputsHeight + 'px', 'important');
  
  // Override flex properties to use fixed heights during resize
  editorElement.style.setProperty('flex', 'none', 'important');
  outputsSection.style.setProperty('flex', 'none', 'important');

  // Refresh CodeMirror to handle resize
  editor.refresh();
}

// Mouse move event
document.addEventListener('mousemove', function(e) {
  handleResize(e.clientY);
});

// Touch move event
document.addEventListener('touchmove', function(e) {
  if (e.touches.length === 1) {
    handleResize(e.touches[0].clientY);
    e.preventDefault();
  }
}, { passive: false });

// Mouse up event
document.addEventListener('mouseup', function() {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    console.log('Resize complete');
  }
});

// Touch end event
document.addEventListener('touchend', function() {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    console.log('Resize complete');
  }
});

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
  
  // Split by semicolons to get individual variable assignments
  const assignments = inputStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  if (assignments.length === 0) {
    showError('Input cannot be empty. Expected format: VariableName=BinaryString (e.g., I=1010)');
    return false;
  }
  
  // Regular expression for valid variable name
  const validVarName = /^[A-Za-z_][A-Za-z0-9_]*$/;
  
  for (const assignment of assignments) {
    // Check if assignment contains exactly one equals sign
    const parts = assignment.split('=');
    if (parts.length !== 2) {
      showError(`Invalid assignment "${assignment}". Expected format: VariableName=BinaryString (e.g., I=1010)`);
      return false;
    }
    
    const [varName, value] = parts.map(s => s.trim());
    
    // Validate variable name
    if (!varName) {
      showError(`Variable name cannot be empty in assignment "${assignment}"`);
      return false;
    }
    
    if (!validVarName.test(varName)) {
      showError(`Invalid variable name "${varName}". Variable names must start with a letter or underscore and contain only letters, numbers, and underscores.`);
      return false;
    }
    
    // Validate value (should only contain 0s and 1s after trimming)
    if (!value) {
      showError(`Value cannot be empty for variable "${varName}". Expected binary string (e.g., 1010)`);
      return false;
    }
    
    const cleanValue = value.replace(/[^01]/g, '');
    if (cleanValue.length === 0) {
      showError(`Value for variable "${varName}" must contain at least one binary digit (0 or 1)`);
      return false;
    }
    
    if (cleanValue !== value) {
      showError(`Value for variable "${varName}" contains invalid characters. Only 0s and 1s are allowed.`);
      return false;
    }
  }
  
  return true;
}

// Main simulation function
async function simulate() {
  const pyodide = await pyodideReadyPromise;
  
  // Validate input format
  const inputStr = document.getElementById('inputs').value.trim();
  if (!validateInputFormat(inputStr)) {
    return; // Error message already shown by validateInputFormat
  }
  
  statusEl.textContent = 'Simulating...';
  const code = editor.getValue();
  const steps = parseInt(document.getElementById('steps').value, 10) || 8;
  const inputs = {};
  if (inputStr) {
    for (const frag of inputStr.split(';')) {
      if (!frag) continue; 
      const [k, v] = frag.split('='); 
      if (k && v) inputs[k.trim()] = v.trim().replace(/[^01]/g, '');
    }
  }
  
  try {
    document.getElementById('errorModal').style.display = 'none';
    document.getElementById('errormsg').innerHTML = '';
    const pySnippet = `res = simulate_inline(${JSON.stringify(code)}, ${JSON.stringify(inputs)}, ${steps})`;
    log('Running simulation with inputs: ' + JSON.stringify(inputs) + ', steps: ' + steps);
    await pyodide.runPythonAsync(pySnippet);
    log('Simulation completed');
    if (!pyodide.runPython("'res' in globals()")) throw new Error('No result returned');
    const pyResult = pyodide.runPython('res');
    log('Simulation result: ' + pyResult);
    if (!pyResult) throw new Error('Result object is null');
    let jsResult;
    try { jsResult = JSON.parse(pyResult); } catch (_) { throw new Error('Failed to parse simulation result as JSON'); }
    if (!jsResult || typeof jsResult !== 'object') throw new Error('Result not an object');
    let outputsObj = jsResult.outputs;
    if (!outputsObj) {
      log('Debug jsResult keys: ' + Object.keys(jsResult));
      throw new Error('Missing outputs in result');
    }
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
    // Extract error text based on type
    let errorText = '';
    if (fullMsg.includes('RuntimeError:')) {
      errorText = fullMsg.split('RuntimeError:')[1].trim();
      let syntaxBlock = errorText.match(/---[^\n]+---[\s\S]*?(?=\n\s*Details:|$)/);
      if (syntaxBlock) {
        errorText = syntaxBlock[0];
      }
      let detailsMatch = fullMsg.match(/Details:[\s\S]*$/);
      if (detailsMatch) {
        errorText += '\n' + detailsMatch[0];
      }
    } else if (fullMsg.includes('ValueError:')) {
      errorText = fullMsg.split('ValueError:')[1].trim();
    } else if (fullMsg.includes('MacroCycleError:')) {
      errorText = fullMsg.split('MacroCycleError:')[1].trim();
    } else {
      let lines = fullMsg.split('\n');
      let filtered = lines.filter(l => !l.includes('Traceback') && !l.match(/File "/) && !l.match(/eval_code_async/) && !l.match(/run_async/) && !l.match(/CodeRunner/) && !l.match(/<exec>/));
      errorText = filtered.join('\n').trim();
      if (!errorText) errorText = fullMsg;
    }
    // HTML escape, but preserve leading spaces for alignment
    errorText = errorText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Replace each line's leading spaces with &nbsp; for correct arrow alignment
    errorText = errorText.split('\n').map(l => l.replace(/^ +/g, m => '&nbsp;'.repeat(m.length))).join('<br>');
    let html = `<div style='margin-bottom:8px; color:#b00; font-family:monospace; white-space:pre;'>${errorText}</div>`;
    document.getElementById('errormsg').innerHTML = html;
    document.getElementById('errorModal').style.display = 'flex';
    log('Error: ' + fullMsg);
    statusEl.textContent = 'Error';
    // Remove previous gutter marker
    editor.clearGutter("syntax-errors");
    // Highlight error line in editor and add gutter marker for syntax errors
    let lineColMatch = fullMsg.match(/at line (\d+) col (\d+)/);
    let lineNum = null, colNum = null;
    if (lineColMatch) {
      lineNum = parseInt(lineColMatch[1], 10);
      colNum = parseInt(lineColMatch[2], 10);
      window._errMarker = editor.markText(
        { line: lineNum - 1, ch: colNum ? colNum - 1 : 0 }, 
        { line: lineNum - 1, ch: colNum ? colNum : 100 }, 
        { className: 'cm-error-highlight' }
      );
      if (fullMsg.includes('Syntax Error') || fullMsg.includes('UnexpectedCharacters')) {
        const marker = document.createElement("div");
        marker.style.color = "#b00";
        marker.innerHTML = "&#x25CF;";
        marker.title = "Syntax error";
        editor.setGutterMarker(lineNum - 1, "syntax-errors", marker);
      }
      editor.scrollIntoView({ line: lineNum - 1, ch: 0 }, 100);
    }
  }
  // Add error highlight style
  const style = document.createElement('style');
  style.innerHTML = `.cm-error-highlight { background: #ffb8b8; border-bottom: 2px solid #b00; }`;
  document.head.appendChild(style);
}

// Challenge scoring function
async function scoreChallenge() {
  const activeBtn = document.querySelector('#challengesPanel button.active');
  const challenge = challengeSelect ? challengeSelect.value : (activeBtn ? activeBtn.dataset.challenge : null);
  if (!challenge) { 
    log('No challenge selected'); 
    return; 
  }
  const pyodide = await pyodideReadyPromise;
  statusEl.textContent = 'Scoring...';
  try {
    // Fetch score.py
    const scorePath = '../../challenges/' + challenge + '/score.py';
    const r = await fetch(scorePath); 
    if (!r.ok) throw new Error('Cannot fetch ' + scorePath);
    const scoreCode = await r.text();
    pyodide.FS.writeFile('score_tmp.py', scoreCode);
    // Write circuit submission
    const code = editor.getValue();
    pyodide.FS.writeFile('_web_submission.cir', code);

    const py = `import importlib.util, sys\n` +
      `spec = importlib.util.spec_from_file_location('score_tmp','score_tmp.py')\n` +
      `mod = importlib.util.module_from_spec(spec)\n` +
      `sys.modules['score_tmp'] = mod\n` +
      `spec.loader.exec_module(mod)\n` +
      `import json\n` +
      `result = {'passed': False, 'error': 'verify_circuit() missing'}\n` +
      `if hasattr(mod, 'verify_circuit'):\n` +
      `    ok = mod.verify_circuit('_web_submission.cir')\n` +
      `    result = {'passed': ok}\n` +
      `result`;
    const pyRes = await pyodide.runPythonAsync(py);
    let jsRes;
    try { jsRes = pyRes.toJs(); } catch (_) { jsRes = pyRes; }
    let passedVal = (jsRes && (jsRes.passed !== undefined ? jsRes.passed : (jsRes.get ? jsRes.get('passed') : undefined)));
    if (passedVal === undefined) {
      document.getElementById('scoreresult').innerHTML = '<span style="color:red">Malformed scoring result</span>';
      log('Score debug keys: ' + (jsRes ? Object.keys(jsRes) : 'none'));
    } else {
      document.getElementById('scoreresult').innerHTML = passedVal ? '<span style="color:green">All tests passed ✔</span>' : '<span style="color:orange">Tests failed ✖</span>';
    }
    scoreModal.style.display = 'flex';
    statusEl.textContent = 'Score complete';
  } catch (e) {
    log('Score error: ' + e);
    statusEl.textContent = 'Score error';
  }
}

// Event listeners
document.getElementById('runBtn').addEventListener('click', simulate);

// Initialize application
loadChallenges();
showMainReadme();
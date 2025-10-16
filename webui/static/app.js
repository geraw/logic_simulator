// Use a global flag to prevent the script from running more than once
if (window.appInitialized) {
    console.warn("app.js is already initialized. Skipping redundant execution.");
} else {
    window.appInitialized = true;

    // Wait for the DOM to be fully loaded before executing the script
    document.addEventListener('DOMContentLoaded', function () {

        // Logic Simulator JavaScript Application

        // Apply persisted or system theme before initializing UI components
        const savedThemePref = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedThemePref ? savedThemePref : (systemPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', initialTheme);

        // NOTE: CodeMirror may show passive event listener warnings in the console.
        // These are expected and normal for text editor functionality:
        // - touchstart/touchmove: Required for proper touch text selection
        // - mousewheel: Required for controlled scrolling within the editor
        // These warnings can be safely ignored as they don't affect functionality or performance.

        // Inside the DOMContentLoaded listener...
        // --- Google Sheets / Form configuration ---
        // If you want a public, read-only ladderboard, publish your Google Sheet and
        // paste the CSV URL here. Example: 'https://docs.google.com/spreadsheets/d/e/<id>/pub?output=csv'
        const PUBLISHED_SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdfehYU9cYz_oCsm8NqdGKuiDd0N6cuSfaSIirDOZUkpLD7AXtD-XGijSDBvfyE7bIaLS8ZwnGGuA4/pub?gid=1958512379&single=true&output=csv';

        // Optional: Google Form action URL to append rows without a server.
        // Create a Google Form and set FORM_ACTION to its `formResponse` endpoint.
        // Example: 'https://docs.google.com/forms/d/e/<FORM_ID>/formResponse'
        const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSdN3uWZvbLBdX64xCu_xWUO7orq00VrvyMYUb_nDWAQ_loyZA/formResponse';

        // Map form entry fields (entry.123456) to values sent when submitting.
        // e.g. { challenge: 'entry.111111', email: 'entry.222222', code: 'entry.333333' }
        const FORM_ENTRY_MAP = { challenge: 'entry.269672141', submitter: 'entry.489618731', email: 'entry.1430478055', D_gates: 'entry.614063262', NAND_gates: 'entry.548483256', circuit: 'entry.135561246' };

        let editor = CodeMirror.fromTextArea(document.getElementById('code'), {
            lineNumbers: true,
            mode: 'circuitdsl',
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'material' : 'default',
            gutters: ["CodeMirror-linenumbers", "syntax-errors"],
            //scrollbarStyle: "native", // Use native scrollbars
            //viewportMargin: 10 // Only render ~10 lines outside viewport, then scroll
        });

        // Configure CodeMirror wrapper to respect container size and enable scrolling
        const editorWrapper = editor.getWrapperElement();
        if (editorWrapper) {
            editorWrapper.style.height = '100%'; // Fill the container
            editorWrapper.style.maxHeight = '100%'; // Don't grow beyond container
        }

        // Force CodeMirror to use container size, not content size
        editor.setSize(null, '100%');


        // DOM element references
        const logEl = document.getElementById('log');
        const challengeSelect = document.getElementById('challengeSelect');
        const challengesPanel = document.getElementById('challengesPanel');
        const logModal = document.getElementById('logModal');
        const scoreModal = document.getElementById('scoreModal');
        const readmeModal = document.getElementById('readmeModal');
        const themeToggle = document.getElementById('themeToggle');

        // Theme management
        function initializeTheme() {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                updateThemeIcon(savedTheme);
            } else if (systemPrefersDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
                updateThemeIcon('dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                updateThemeIcon('light');
            }

            if (editor) {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const cmTheme = currentTheme === 'dark' ? 'material' : 'default';
                editor.setOption('theme', cmTheme);
            }
        }

        function updateThemeIcon(theme) {
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);

            // Update CodeMirror theme
            if (editor) {
                const cmTheme = newTheme === 'dark' ? 'material' : 'default';
                editor.setOption('theme', cmTheme);
            }
        }

        // Initialize theme
        initializeTheme();

        // Theme toggle event listener
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                updateThemeIcon(newTheme);

                if (editor) {
                    const cmTheme = newTheme === 'dark' ? 'material' : 'default';
                    editor.setOption('theme', cmTheme);
                }
            }
        });

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

        function escapeHtml(value) {
            if (value === null || value === undefined) {
                return '';
            }
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function extractPythonErrorMessage(fullMsg, fallbackLabel = 'Error') {
            if (!fullMsg) return fallbackLabel;

            const lines = fullMsg.split('\n');
            let lastExceptionLine = -1;

            // Find the last line that looks like an exception (e.g., "RuntimeError: ...")
            for (let i = lines.length - 1; i >= 0; i--) {
                if (/^[a-zA-Z0-9_.]*Error:/.test(lines[i])) {
                    lastExceptionLine = i;
                    break;
                }
            }

            if (lastExceptionLine === -1) {
                // If no exception line is found, return the last non-empty line as a fallback.
                for (let i = lines.length - 1; i >= 0; i--) {
                    if (lines[i].trim()) {
                        return lines[i].trim();
                    }
                }
                return fallbackLabel; // Or the original message if all lines are empty
            }

            // Join the exception line and all subsequent lines
            const message = lines.slice(lastExceptionLine).join('\n');

            // The first line is "ExceptionType: Message part 1". We want to extract from "Message part 1"
            const firstLine = lines[lastExceptionLine];
            const colonIndex = firstLine.indexOf(':');
            if (colonIndex !== -1) {
                // Return the message starting from after the colon on the first line
                const firstLineMessage = firstLine.substring(colonIndex + 1).trim();
                const restOfMessage = lines.slice(lastExceptionLine + 1).join('\n');
                return (firstLineMessage + '\n' + restOfMessage).trim();
            }

            // Fallback if the format is unexpected
            return message.trim();
        }

        // Log modal functionality
        document.getElementById('logMenuBtn').addEventListener('click', function () {
            logModal.style.display = 'flex';
        });

        // Resolve project-relative URLs robustly for GitHub Pages
        const REPO_SLUG = 'logic_simulator';
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
        function createMarkdownConverter() {
            const converter = new showdown.Converter({
                tables: true,
                strikethrough: true,
                tasklists: true,
                ghCodeBlocks: true,
                ghMentions: false,
                ghMentionsLink: false,
                emoji: true,
                underline: true,
                completeHTMLDocument: false,
                metadata: false,
                splitAdjacentBlockquotes: true,
                smoothLivePreview: true,
                smartIndentationFix: true,
                disableForced4SpacesIndentedSublists: true,
                simpleLineBreaks: true,
                requireSpaceBeforeHeadingText: true,
                encodeEmails: false,
                openLinksInNewWindow: true,
                backslashEscapesHTMLTags: true,
                literalMidWordUnderscores: true,
                parseImgDimensions: true
            });

            // Add custom extensions for better circuit language support
            converter.addExtension({
                type: 'lang',
                filter: function (text) {
                    // Better handling of circuit syntax in code blocks
                    return text.replace(/```cir\n([\s\S]*?)```/g, function (match, code) {
                        return '```circuit\n' + code + '```';
                    });
                }
            });

            return converter;
        }

        function renderMathInElement(element) {
            if (typeof renderMathInElement !== 'undefined' && window.katex) {
                try {
                    window.renderMathInElement(element, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\[', right: '\\]', display: true },
                            { left: '\\(', right: '\\)', display: false }
                        ],
                        throwOnError: false,
                        errorColor: '#cc0000',
                        strict: false
                    });
                } catch (e) {
                    console.warn('KaTeX rendering failed:', e);
                }
            }
        }

        function enhanceCodeBlocks(element) {
            // Add copy buttons to code blocks
            const codeBlocks = element.querySelectorAll('pre code');
            codeBlocks.forEach(codeBlock => {
                const pre = codeBlock.parentElement;
                if (pre && !pre.querySelector('.copy-button')) {
                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy-button';
                    copyButton.textContent = 'Copy';
                    copyButton.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(codeBlock.textContent);
                            copyButton.textContent = 'Copied!';
                            copyButton.classList.add('copied');
                            setTimeout(() => {
                                copyButton.textContent = 'Copy';
                                copyButton.classList.remove('copied');
                            }, 2000);
                        } catch (err) {
                            // Fallback for browsers that don't support clipboard API
                            const textArea = document.createElement('textarea');
                            textArea.value = codeBlock.textContent;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            copyButton.textContent = 'Copied!';
                            copyButton.classList.add('copied');
                            setTimeout(() => {
                                copyButton.textContent = 'Copy';
                                copyButton.classList.remove('copied');
                            }, 2000);
                        }
                    });
                    pre.appendChild(copyButton);
                }
            });

            // Smooth scroll for internal links
            const links = element.querySelectorAll('a[href^="#"]');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = element.querySelector(`#${targetId}`);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Auto-generate IDs for headings if they don't have them
            const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                if (!heading.id) {
                    const id = heading.textContent
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    if (id) {
                        heading.id = id;
                    }
                }
            });

            // Improve table responsiveness
            const tables = element.querySelectorAll('table');
            tables.forEach(table => {
                if (!table.parentElement.classList.contains('table-wrapper')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-wrapper';
                    wrapper.style.overflowX = 'auto';
                    wrapper.style.marginBottom = '16px';
                    table.parentElement.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            });
        }

        async function showMainReadme() {
            try {
                const r = await fetchWithPagesFallback('webui/README.md');
                if (!r.ok) throw new Error(`Could not fetch main README`);
                const readmeText = await r.text();
                const converter = createMarkdownConverter();
                const html = converter.makeHtml(readmeText);
                const readmeContentEl = document.getElementById('readmeContent');
                readmeContentEl.innerHTML = html;

                // Enhance the content with interactive features
                setTimeout(() => {
                    renderMathInElement(readmeContentEl);
                    enhanceCodeBlocks(readmeContentEl);
                    if (window.mermaid) {
                        mermaid.run({
                            nodes: readmeContentEl.querySelectorAll('.mermaid')
                        });
                    }
                }, 100);

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
                const converter = createMarkdownConverter();
                const html = converter.makeHtml(readmeText);
                const readmeContentEl = document.getElementById('readmeContent');
                readmeContentEl.innerHTML = html;

                // Enhance the content with interactive features
                setTimeout(() => {
                    renderMathInElement(readmeContentEl);
                    enhanceCodeBlocks(readmeContentEl);
                }, 100);

                readmeModal.style.display = 'flex';

                // Update internal state and UI to reflect the selection
                if (challengeSelect) {
                    challengeSelect.value = challengeName;
                }
                document.querySelectorAll('#challengesPanel button').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.challenge === challengeName);
                });

                // Save the current challenge to local storage
                localStorage.setItem('logic_simulator_challenge', challengeName);

                // Load typical inputs for this challenge
                await loadTypicalInputs(challengeName);

            } catch (e) {
                log('Error showing README: ' + e.message);
                //alert('Could not load README for this challenge.');
            }
        }

        // Challenge code loading
        async function loadTypicalInputs(challengeName) {
            if (!challengeName) return;
            try {
                const inputResponse = await fetchWithPagesFallback(`challenges/${challengeName}/typical_input`);
                if (inputResponse.ok) {
                    const inputText = await inputResponse.text();
                    const trimmed = inputText.trim();

                    // Parse format: "steps, inputs"
                    const commaIndex = trimmed.indexOf(',');
                    if (commaIndex !== -1) {
                        const steps = trimmed.substring(0, commaIndex).trim();
                        const inputs = trimmed.substring(commaIndex + 1).trim();

                        // Set the steps input
                        const stepsInput = document.getElementById('steps');
                        if (stepsInput && steps) {
                            stepsInput.value = steps;
                        }

                        // Set the inputs input
                        const inputsInput = document.getElementById('inputs');
                        if (inputsInput) {
                            inputsInput.value = inputs;
                        }
                    }
                }
            } catch (inputError) {
                // Typical input file is optional, so we just ignore errors
                console.log(`No typical input file for ${challengeName}`);
            }
        }

        async function loadChallengeCode(challengeName) {
            if (!challengeName) return;
            try {
                const response = await fetchWithPagesFallback(`challenges/${challengeName}/solution.cir`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const code = await response.text();
                editor.setValue(code);

                // Load typical inputs
                await loadTypicalInputs(challengeName);
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

        // Load challenges from the generated JSON file
        async function loadChallenges() {
            try {
                const response = await fetchWithPagesFallback('challenges/challenges.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const challenges = await response.json();

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
            } catch (error) {
                log(`Failed to load challenges: ${error.message}`);
                challengesPanel.innerHTML = '<p class="error">Could not load challenges. Please try refreshing the page.</p>';
            }
        }

        // Pyodide initialization
        let pyodideReadyPromise = (async () => {
            log('Loading Pyodide...');
            const pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
            });
            log('Installing lark via micropip...');
            await pyodide.loadPackage('micropip');
            await pyodide.runPythonAsync(`import micropip; await micropip.install('lark-parser')`);
            log('Fetching project sources...');

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
    try:
        with open('_inline.cir','w') as f:
            f.write(code)
        circuit = parse_file('_inline.cir')
        sim = Simulator(circuit)
        outputs = sim.run(inputs, steps)
        result = {'outputs': outputs, 'history': sim.history}
        return json.dumps(result)
    except Exception as exc:
        raise RuntimeError(str(exc))
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
        const container = document.body; // Use body as container since main was removed

        const startResize = (e) => {
            // CSS touch-action: none handles touch preventDefault, so we only need it for mouse
            if (e.type === 'mousedown') {
                e.preventDefault();
            }
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('touchmove', handleResize, { passive: false });
            window.addEventListener('mouseup', stopResize);
            window.addEventListener('touchend', stopResize);
        };

        const handleResize = (e) => {
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const containerRect = container.getBoundingClientRect();

            // Calculate position relative to container (body), accounting for header
            const header = document.querySelector('header');
            const headerHeight = header ? header.offsetHeight : 0;
            const totalAvailableHeight = containerRect.height - headerHeight - resizer.offsetHeight - 60; // 60px for footer space

            const newEditorHeight = clientY - containerRect.top - headerHeight;
            const newOutputsHeight = totalAvailableHeight - newEditorHeight;

            const minEditorHeight = 50;
            const minOutputsHeight = 50;

            if (newEditorHeight > minEditorHeight && newOutputsHeight > minOutputsHeight) {
                // Update editor section height
                editorSection.style.height = newEditorHeight + 'px';
                editorSection.style.flex = 'none';

                // Update outputs section height
                outputsSection.style.height = newOutputsHeight + 'px';
                outputsSection.style.flex = 'none';
            }
        };

        const stopResize = () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('touchmove', handleResize);
            window.removeEventListener('mouseup', stopResize);
            window.removeEventListener('touchend', stopResize);
        };

        resizer.addEventListener('mousedown', startResize);

        // Set initial resizer position to 80% from the top
        const initializeLayout = () => {
            const containerRect = container.getBoundingClientRect();
            const header = document.querySelector('header');
            const headerHeight = header ? header.offsetHeight : 0;
            const totalAvailableHeight = containerRect.height - headerHeight - resizer.offsetHeight - 60; // 60px for footer space

            // Set editor to 80% and outputs to 20%
            const editorHeight = totalAvailableHeight * 0.8;
            const outputsHeight = totalAvailableHeight * 0.2;

            editorSection.style.height = editorHeight + 'px';
            editorSection.style.flex = 'none';

            outputsSection.style.height = outputsHeight + 'px';
            outputsSection.style.flex = 'none';
        };

        // Initialize layout on page load
        initializeLayout();
        resizer.addEventListener('touchstart', startResize, { passive: true });


        // Error display
        function showError(message) {
            document.getElementById('errormsg').innerHTML = message;
            document.getElementById('errorModal').style.display = 'flex';
            log('Input validation error');
        }

        // Input validation
        function validateInputFormat(inputStr) {
            const assignments = inputStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
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
            log('Simulating...');
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
                log('Simulation complete with outputs displayed');
            } catch (e) {
                const rawMsg = (e && typeof e.message === 'string') ? e.message : String(e);
                const fullMsg = rawMsg || 'Unknown error';
                const summary = extractPythonErrorMessage(fullMsg, 'Simulation error');
                const safeSummary = escapeHtml(summary || 'Interpreter error');
                const safeFull = escapeHtml(fullMsg.trim() || summary || 'Interpreter error');

                document.getElementById('errormsg').innerHTML = `
                    <pre class="error-message">${safeSummary}</pre>
                    <details class="error-details">
                        <summary>Interpreter output</summary>
                        <pre>${safeFull}</pre>
                    </details>
                `;
                document.getElementById('errorModal').style.display = 'flex';
                // Keep full message in log for debugging
                log('Error: ' + fullMsg);
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
            log('Scoring challenge...');
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
import json

# Default to a failure state
result = {'passed': False, 'log': 'An unknown error occurred in the Python scoring script.'}

try:
    spec = importlib.util.spec_from_file_location('score_tmp','score_tmp.py')
    mod = importlib.util.module_from_spec(spec)
    sys.modules['score_tmp'] = mod
    spec.loader.exec_module(mod)

    output_log = io.StringIO()
    if not hasattr(mod, 'verify_circuit'):
        raise RuntimeError('Scoring script is invalid: verify_circuit() function is missing.')

    with redirect_stdout(output_log):
        ok = mod.verify_circuit('_web_submission.cir')

    result = {'passed': ok, 'log': output_log.getvalue()}

except Exception as exc:
    # Capture the exception and format it for the log.
    import traceback
    error_log = io.StringIO()
    traceback.print_exc(file=error_log)
    result = {'passed': False, 'log': f"Scoring script failed:\\n{error_log.getvalue()}"}

# Always ensure a JSON result is returned
json.dumps(result)
`;
                const jsonRes = await pyodide.runPythonAsync(py);
                const jsRes = JSON.parse(jsonRes);

                let resultHtml = jsRes.passed ?
                    '<span style="color:green; font-weight:bold;">All tests passed ✔</span>' :
                    '<span style="color:orange; font-weight:bold;">Tests failed ✖</span>';

                if (jsRes.log) {
                    const safeLog = jsRes.log.replace(/</g, '&lt;');
                    resultHtml += `<pre class="score-log">${safeLog}</pre>`;
                }

                const scoreresultEl = document.getElementById('scoreresult');
                scoreresultEl.innerHTML = resultHtml;

                // Remove any previous submission panel (avoid duplicates)
                const prevForm = document.getElementById('submissionFormDiv');
                if (prevForm && prevForm.parentElement) prevForm.parentElement.removeChild(prevForm);

                // If all tests passed, show the submission panel immediately (no button)
                if (jsRes.passed) {
                    if (!GOOGLE_FORM_ACTION || !FORM_ENTRY_MAP || !FORM_ENTRY_MAP.challenge) {
                        alert('Submission not configured: GOOGLE_FORM_ACTION or FORM_ENTRY_MAP is missing.');
                    } else {
                        const code = editor.getValue();
                        const challenge = (document.querySelector('#challengesPanel button.active') || {}).dataset?.challenge || '';

                        const formDiv = document.createElement('div');
                        formDiv.id = 'submissionFormDiv';
                        formDiv.style.marginTop = '8px';
                        formDiv.style.borderTop = '1px solid #ddd';
                        formDiv.style.paddingTop = '8px';

                        const info = document.createElement('div');
                        info.textContent = 'Submit this solution to the public ladderboard:';
                        formDiv.appendChild(info);

                        const nameLabel = document.createElement('label');
                        nameLabel.textContent = 'Name: ';
                        const nameInput = document.createElement('input');
                        nameInput.type = 'text';
                        nameInput.style.width = '200px';
                        // Prefill from localStorage if available
                        try {
                            const savedName = localStorage.getItem('ladder_submit_name');
                            if (savedName) nameInput.value = savedName;
                        } catch (e) {
                            // ignore localStorage errors (e.g., private mode)
                        }
                        nameInput.addEventListener('input', () => {
                            try { localStorage.setItem('ladder_submit_name', nameInput.value || ''); } catch (e) {}
                        });
                        nameLabel.appendChild(nameInput);
                        formDiv.appendChild(nameLabel);

                        formDiv.appendChild(document.createElement('br'));

                        const emailLabel = document.createElement('label');
                        emailLabel.textContent = 'Email: ';
                        const emailInput = document.createElement('input');
                        emailInput.type = 'email';
                        emailInput.style.width = '200px';
                        // Prefill from localStorage if available
                        try {
                            const savedEmail = localStorage.getItem('ladder_submit_email');
                            if (savedEmail) emailInput.value = savedEmail;
                        } catch (e) {}
                        emailInput.addEventListener('input', () => {
                            try { localStorage.setItem('ladder_submit_email', emailInput.value || ''); } catch (e) {}
                        });
                        emailLabel.appendChild(emailInput);
                        formDiv.appendChild(emailLabel);

                        formDiv.appendChild(document.createElement('br'));

                        // No editable code field: submissions will use the current editor content

                        const submitFormBtn = document.createElement('button');
                        submitFormBtn.textContent = 'Submit to Ladderboard';
                        submitFormBtn.style.marginTop = '8px';
                        submitFormBtn.addEventListener('click', async () => {
                            submitFormBtn.disabled = true;
                            submitFormBtn.textContent = 'Submitting...';
                            try {
                                // Use current editor contents for submission (non-editable in the form)
                                const submissionCode = editor.getValue() || '';
                                const submitter = nameInput.value || '';
                                const email = emailInput.value || '';

                                // Prefer grader-reported gate counts when available (e.g. "Gates used: 27 NAND, 5 D")
                                let dCount = 0;
                                let nandCount = 0;
                                try {
                                    if (jsRes && jsRes.log) {
                                        const logText = String(jsRes.log);
                                        const nandMatch = logText.match(/(\d+)\s*NAND/i);
                                        const dMatch = logText.match(/(\d+)\s*D\b/i);
                                        if (nandMatch) nandCount = parseInt(nandMatch[1], 10) || 0;
                                        if (dMatch) dCount = parseInt(dMatch[1], 10) || 0;
                                    }
                                } catch (e) {
                                    // ignore parsing errors and fall back to heuristics below
                                }

                                // Fallback: simple heuristics on the submission text if grader didn't report counts
                                if (!dCount) dCount = (submissionCode.match(/\bD\(/g) || []).length;
                                if (!nandCount) nandCount = (submissionCode.match(/NAND/gi) || []).length;

                                const entryMap = {};
                                // Map configured form entries to values
                                if (FORM_ENTRY_MAP.challenge) entryMap[FORM_ENTRY_MAP.challenge] = challenge;
                                if (FORM_ENTRY_MAP.submitter) entryMap[FORM_ENTRY_MAP.submitter] = submitter;
                                if (FORM_ENTRY_MAP.email) entryMap[FORM_ENTRY_MAP.email] = email;
                                if (FORM_ENTRY_MAP.D_gates) entryMap[FORM_ENTRY_MAP.D_gates] = String(dCount);
                                if (FORM_ENTRY_MAP.NAND_gates) entryMap[FORM_ENTRY_MAP.NAND_gates] = String(nandCount);
                                if (FORM_ENTRY_MAP.circuit) entryMap[FORM_ENTRY_MAP.circuit] = submissionCode;

                                const ok = await submitToGoogleForm(GOOGLE_FORM_ACTION, entryMap);
                                if (ok) {
                                    submitFormBtn.textContent = 'Submitted ✅';
                                    formDiv.style.opacity = '0.6';
                                    log('Submission posted to Google Form');
                                } else {
                                    submitFormBtn.textContent = 'Submit to Ladderboard';
                                    submitFormBtn.disabled = false;
                                    alert('Failed to submit to Google Form.');
                                }
                            } catch (err) {
                                submitFormBtn.textContent = 'Submit to Ladderboard';
                                submitFormBtn.disabled = false;
                                alert('Submission error: ' + (err && err.message ? err.message : err));
                            }
                        });

                        formDiv.appendChild(submitFormBtn);

                        scoreresultEl.appendChild(formDiv);
                    }
                }

                scoreModal.style.display = 'flex';
                log('Scoring complete');
            } catch (e) {
                const rawMsg = (e && typeof e.message === 'string') ? e.message : String(e);
                const fullMsg = rawMsg || 'Unknown scoring error';
                const summary = extractPythonErrorMessage(fullMsg, 'Scoring error');
                const safeSummary = escapeHtml(summary || 'Scoring error');
                const safeFull = escapeHtml(fullMsg.trim() || summary || 'Scoring error');
                log('Score error: ' + fullMsg);
                document.getElementById('scoreresult').innerHTML = `
                    <pre class="error-message" style="color:red; font-weight:bold;">${safeSummary}</pre>
                    <details class="error-details">
                        <summary>Interpreter output</summary>
                        <pre>${safeFull}</pre>
                    </details>
                `;
                scoreModal.style.display = 'flex';
            }
        }

        // Function to save session state
        function saveSessionState() {
            const activeBtn = document.querySelector('#challengesPanel button.active');
            const currentChallenge = activeBtn ? activeBtn.dataset.challenge : null;

            localStorage.setItem('logic_simulator_code', editor.getValue());
            localStorage.setItem('logic_simulator_inputs', document.getElementById('inputs').value);
            localStorage.setItem('logic_simulator_steps', document.getElementById('steps').value);
            if (currentChallenge) {
                localStorage.setItem('logic_simulator_challenge', currentChallenge);
            }
        }

        // Function to restore session state
        async function restoreSessionState() {
            const savedCode = localStorage.getItem('logic_simulator_code');
            const savedInputs = localStorage.getItem('logic_simulator_inputs');
            const savedSteps = localStorage.getItem('logic_simulator_steps');
            const savedChallenge = localStorage.getItem('logic_simulator_challenge');

            if (savedChallenge) {
                // Wait a moment for challenge buttons to be created
                await new Promise(resolve => setTimeout(resolve, 100));
                const challengeBtn = document.querySelector(`#challengesPanel button[data-challenge="${savedChallenge}"]`);
                if (challengeBtn) {
                    await showChallengeReadme(savedChallenge);
                }
            }

            if (savedCode) {
                editor.setValue(savedCode);
            }
            if (savedInputs) {
                document.getElementById('inputs').value = savedInputs;
            }
            if (savedSteps) {
                document.getElementById('steps').value = savedSteps;
            }

            log('Session state restored.');
        }

        // Debounced save function for the editor
        let saveTimeout;
        editor.on('change', function () {
            checkSyntaxLive(editor.getValue());
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveSessionState, 500);
        });

        // Save other inputs on change
        document.getElementById('inputs').addEventListener('input', saveSessionState);
        document.getElementById('steps').addEventListener('input', saveSessionState);

        // Event listeners
        document.getElementById('runBtn').addEventListener('click', simulate);

        // Initialize application
        (async () => {
            await loadChallenges();
            const restored = localStorage.getItem('logic_simulator_challenge');
            if (!restored) {
                showMainReadme();
            }
            await restoreSessionState();
            // Load ladderboard if sheet URL provided
            if (PUBLISHED_SHEET_CSV) {
                try {
                    await loadLeaderboardFromSheet(PUBLISHED_SHEET_CSV);
                } catch (err) {
                    console.warn('Could not load ladderboard:', err);
                }
            }
        })();

        // Force CodeMirror to respect container size after initial layout
        setTimeout(() => {
            if (editor && typeof editor.refresh === 'function') {
                editor.refresh();
            }
        }, 100);

    }); // End of DOMContentLoaded
}

// --- Google Sheets/Form helpers (outside DOMContentLoaded scope) ---
async function loadLeaderboardFromSheet(csvUrl) {
    const el = document.getElementById('ladderboard');
    el.textContent = 'Loading...';
    const r = await fetch(csvUrl);
    if (!r.ok) throw new Error('Failed to fetch sheet');
    const text = await r.text();
    const rows = text.trim().split('\n').map(l => l.split(','));
    if (rows.length === 0) {
        el.textContent = 'No data';
        return;
    }
    const table = document.createElement('table');
    table.className = 'ladderboard-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    rows[0].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.slice(1).forEach(rw => {
        const tr = document.createElement('tr');
        rw.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    el.innerHTML = '';
    el.appendChild(table);
}

async function submitToGoogleForm(formActionUrl, entryMap) {
    // entryMap: { 'entry.123': 'Challenge name', ... }
    // Browsers block fetch/XHR to Google Forms because Google does not send CORS headers.
    // Workaround: create a hidden <form> targeted to an invisible iframe and submit it.
    return new Promise((resolve, reject) => {
        try {
            const iframeName = 'gs_submit_iframe_' + Date.now();
            const iframe = document.createElement('iframe');
            iframe.name = iframeName;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const form = document.createElement('form');
            form.action = formActionUrl;
            form.method = 'POST';
            form.target = iframeName;
            form.style.display = 'none';

            Object.entries(entryMap).forEach(([k, v]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = k;
                input.value = v;
                form.appendChild(input);
            });

            document.body.appendChild(form);

            const cleanup = () => {
                setTimeout(() => {
                    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                    if (form.parentNode) form.parentNode.removeChild(form);
                }, 500);
            };

            // Resolve when iframe finishes loading (form submission complete or redirected)
            iframe.onload = function () {
                cleanup();
                resolve(true);
            };

            // Submit the form. If onload doesn't fire (some redirects), fall back after timeout.
            form.submit();
            setTimeout(() => {
                cleanup();
                resolve(true);
            }, 4000);
        } catch (err) {
            reject(err);
        }
    });
}
// CodeMirror simple mode for circuit DSL
// Highlights macros, assignments, signal names, numbers, gate calls

CodeMirror.defineSimpleMode("circuitdsl", {
  start: [
    // Macro definition: NAME (params) := expr
    {regex: /[A-Za-z_][A-Za-z0-9_]*\s*\(/, token: "variable-2", next: "macrodef"},
    // Assignment: NAME = expr
    {regex: /[A-Za-z_][A-Za-z0-9_]*\s*=\s*/, token: "variable-2"},
    // Gate call: NAME(
    {regex: /[A-Za-z_][A-Za-z0-9_]*\s*\(/, token: "builtin", next: "call"},
    // Number
    {regex: /\b[01]\b/, token: "number"},
    // Comments
    {regex: /#.*/, token: "comment"},
    // Operators
    {regex: /:=|=|,|\(|\)/, token: "operator"},
    // Whitespace
    {regex: /\s+/, token: null},
    // Anything else
    {regex: /[^#\s]+/, token: null}
  ],
  macrodef: [
    {regex: /\)/, token: "operator", next: "start"},
    {regex: /,/, token: "operator"},
    {regex: /[A-Za-z_][A-Za-z0-9_]*/, token: "variable"},
    {regex: /\s+/, token: null}
  ],
  call: [
    {regex: /\)/, token: "operator", next: "start"},
    {regex: /,/, token: "operator"},
    {regex: /[A-Za-z_][A-Za-z0-9_]*/, token: "variable"},
    {regex: /[01]/, token: "number"},
    {regex: /\s+/, token: null}
  ],
  meta: {
    lineComment: "#"
  }
});

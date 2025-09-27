// CodeMirror simple mode for circuit DSL

CodeMirror.defineSimpleMode("circuitdsl", {
  start: [
    // A comment goes to the end of the line
    { regex: /#.*/, token: "comment" },

    // Macro definition name: e.g., "NOT" in "NOT(x) :="
    // This uses a lookahead to find ":=" later on the line
    { regex: /([A-Za-z_][A-Za-z0-9_]*)(?=\s*\(.*\)\s*:=)/, token: "def" },

    // Assignment target name: e.g., "O0" in "O0 = XOR(...)"
    // The "sol: true" flag ensures this only matches at the start of a line
    { regex: /([A-Za-z_][A-Za-z0-9_]*)(?=\s*=)/, sol: true, token: "variable-2" },

    // Gate or macro call name: e.g., "XOR" in "O0 = XOR(...)"
    { regex: /([A-Za-z_][A-Za-z0-9_]+)(?=\s*\()/, token: "builtin" },

    // Operators
    { regex: /:=|=|,/, token: "operator" },

    // Numbers (0 or 1)
    { regex: /\b[01]\b/, token: "number" },

    // Any other variable or signal name
    { regex: /[A-Za-z_][A-Za-z0-9_]*/, token: "variable" },
    
    // Parentheses
    { regex: /[()]/, token: "bracket" }
  ],
  meta: {
    lineComment: "#"
  }
});
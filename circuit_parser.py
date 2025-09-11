# File: circuit_parser.py
# Handles parsing the circuit description file into a structured representation.

from lark import Lark, Transformer, UnexpectedToken, UnexpectedCharacters
from dataclasses import dataclass
from typing import List, Dict, Union

# --- Abstract Syntax Tree (AST) Nodes ---
# These classes represent the components of our language in a structured way.

@dataclass
class Number:
    value: int

@dataclass
class Variable:
    name: str

@dataclass
class Call:
    name: str
    args: list

@dataclass
class Assignment:
    target: str
    expression: Union[Number, Variable, Call]

@dataclass
class MacroDef:
    name: str
    params: List[str]
    expression: Union[Number, Variable, Call]

@dataclass
class Circuit:
    """A container for the entire parsed circuit."""
    assignments: Dict[str, Assignment]
    macros: Dict[str, MacroDef]


class CircuitTransformer(Transformer):
    """
    Transforms the Lark parse tree into our custom AST nodes.
    Each method corresponds to a rule in the grammar.lark file.
    """
    def number(self, n):
        # This check prevents the "list index out of range" error
        if not n:
            # This case should ideally not be reached with a correct grammar,
            # but serves as a safeguard.            
            raise ValueError("Parser created an invalid 'number' node.")
        
        return Number(1 if n[0].data == 'one' else 0)

    def variable(self, v):
        return Variable(str(v[0]))

    def arg_list(self, a):
        return a

    def call(self, c):
        name = str(c[0])
        args = c[1] if len(c) > 1 else []
        return Call(name, args)

    def assignment(self, a):
        return Assignment(target=str(a[0]), expression=a[1])
    
    def param_list(self, p):
        return [str(param) for param in p]

    def macro_definition(self, m):
        """Handles macro definitions with or without parameters."""
        name = str(m[0])
        if len(m) == 3:
            params, expr = m[1], m[2]
        else:
            params, expr = [], m[1]
        return MacroDef(name, params, expr)

    def start(self, s):
        """
        Processes the top-level statements into a single Circuit object.
        's' is expected to be a list of Assignment and MacroDef objects.
        """
        print(f"{s= }")  # Debug print to inspect 's'
        
        circuit = Circuit(assignments={}, macros={})
        for item in s:
            if isinstance(item, Assignment):
                if item.target in circuit.assignments:
                    raise ValueError(f"Signal '{item.target}' is defined more than once.")
                circuit.assignments[item.target] = item
            elif isinstance(item, MacroDef):
                if item.name in circuit.macros:
                    raise ValueError(f"Macro '{item.name}' is defined more than once.")
                circuit.macros[item.name] = item
        return circuit

def parse_file(filepath: str) -> Circuit:
    """
    Reads a circuit file, parses it, and transforms it into a Circuit object
    with improved error handling for syntax issues.
    """
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        with open('grammar.lark', 'r') as g:
            grammar = g.read()
    except FileNotFoundError as e:
        raise FileNotFoundError(f"Could not find required file: {e.filename}")

    parser = Lark(grammar, start='start')
    
    try:
        tree = parser.parse(content)
        transformer = CircuitTransformer()
        # With the grammar fix, the transformer now reliably returns a Circuit object.
        # The previous workaround is no longer necessary.
        return transformer.transform(tree)

    except (UnexpectedToken, UnexpectedCharacters) as e:
        # This block handles clear syntax errors (e.g., missing comma)
        lines = content.splitlines()
        error_line = lines[e.line - 1] if e.line <= len(lines) else ""
        pointer = ' ' * (e.column - 1) + '^'
        
        error_message = (
            f"\n\n--- Syntax Error ---\n"
            f"Error in file: '{filepath}'\n"
            f"Location: Line {e.line}, Column {e.column}\n\n"
            f"Problematic Line:\n"
            f"  {error_line}\n"
            f"  {pointer}\n\n"
            f"The parser encountered an unexpected token or character."
        )
        raise ValueError(error_message) from e
    except Exception as e:
        # This is the more general error handler for unexpected issues.
        error_type = type(e).__name__
        error_message = (
            f"\n\n--- An Unexpected Parser Error Occurred ---\n"
            f"Error Type: {error_type}\n"
            f"Error Details: {e}\n\n"
            f"This could be caused by a subtle syntax issue in '{filepath}' that\n"
            f"the parser could not handle gracefully.\n\n"
            f"Please double-check your circuit file for correct syntax."
        )
        raise RuntimeError(error_message) from e


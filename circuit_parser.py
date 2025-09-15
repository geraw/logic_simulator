from lark import Lark, Transformer
from lark.exceptions import LarkError, VisitError
from dataclasses import dataclass
from typing import List, Dict
import os

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
    expression: object

@dataclass
class MacroDef:
    name: str
    params: List[str]
    expression: object

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
        # This method is now more explicit. 'n[0]' is a Token object,
        # and we get its string content from the '.value' attribute.
        return Number(int(n[0].value))

    def variable(self, v):
        return Variable(str(v[0]))

    def arg_list(self, a):
        return a

    def expression(self, e):
        # This method handles the explicit 'expression' rule.
        # e will be a list containing one item: the actual expression node (call, variable, or number).
        return e[0]

    def call(self, c):
        name = str(c[0])
        args = c[1] if len(c) > 1 else []
        return Call(name, args)

    def assignment(self, a):
        return Assignment(target=str(a[0]), expression=a[1])
    
    def param_list(self, p):
        return [str(param) for param in p]

    def macro_definition(self, m):
        name = str(m[0])
        params = m[1] if len(m) > 2 else []
        expr = m[2] if len(m) > 2 else m[1]
        return MacroDef(name, params, expr)

    def start(self, s):
        """Processes the top-level statements into a single Circuit object."""
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
    Reads a circuit file, parses it, and transforms it into a Circuit object.
    Includes detailed error reporting for syntax issues.
    """
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Use absolute path for grammar.lark
        grammar_path = os.path.join(os.path.dirname(__file__), 'grammar.lark')
        with open(grammar_path, 'r') as g:
            grammar = g.read()

        parser = Lark(grammar, start='start')
        tree = parser.parse(content)
        
        transformer = CircuitTransformer()
        result = transformer.transform(tree)
        
        return result

    except VisitError as e:
        # This handles errors that occur during the transformation phase.
        original = e.orig_exc
        if isinstance(original, ValueError):
            error_message = (
                f"\n--- Semantic Error in '{filepath}' ---\n"
                f"{original}\n\n"
                f"Please check for issues like duplicate definitions or incorrect macro usage."
            )
            raise RuntimeError(error_message) from e
        else:
            # Re-raise if it's an unexpected error type
            raise

    except LarkError as e:
        
        
        # This handles syntax errors found by Lark.
        context = e.get_context(content).strip()
        line, col = e.line, e.column
        
        error_pointer = ' ' * (col - 1) + '^'
        
        error_message = (
            f"\n--- Syntax Error in '{filepath}' at Line {line}, Column {col} ---\n"
            f"{context}\n"
            f"{error_pointer}\n"
            f"Details: {e}"
        )
        raise RuntimeError(error_message) from e
        
    except Exception as e:
        # This is a fallback for unexpected errors during the parsing/transformation phase.
        error_message = (
            f"\n--- An Unexpected Parser Error Occurred ---\n"
            f"Error Type: {type(e).__name__}\n"
            f"Error Details: {e}\n\n"
            f"This is likely caused by a subtle syntax issue in '{filepath}' or\n"
            f"a mismatch between the grammar and the parser logic."
        )
        raise RuntimeError(error_message) from e


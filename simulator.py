# File: simulator.py
# Contains the core logic for simulating the circuit over time.

import copy
from circuit_parser import Circuit, Call, Variable, Number
from typing import Dict, List

class UnresolvedSignalError(Exception):
    """Custom exception for dependency resolution during evaluation."""
    pass

class Simulator:
    """
    Executes a parsed circuit description over a series of time steps.
    """
    def __init__(self, circuit: Circuit):
        
        self.circuit = circuit
        #print(f"Loaded {len(circuit.assignments)} assignments and {len(circuit.macros)} macros.")
        
        # First, expand all macros to get expressions with only base functions
        self.expanded_assignments = self._expand_all_macros()
        self.history = []  # List of dictionaries, one for each time step's state

    def _expand_expression(self, expr, macro_context: dict):
        """Recursively expands all macros within a single expression."""
        if isinstance(expr, Number):
            return expr
        
        if isinstance(expr, Variable):
            # If the variable is a macro parameter, substitute it with the argument
            return macro_context.get(expr.name, expr)

        if isinstance(expr, Call):
            # First, expand all arguments of the current call
            expanded_args = [self._expand_expression(arg, macro_context) for arg in expr.args]

            # If the call is to a macro, substitute and expand its body
            if expr.name in self.circuit.macros:
                macro = self.circuit.macros[expr.name]
                if len(macro.params) != len(expanded_args):
                    raise ValueError(
                        f"Macro '{macro.name}' called with {len(expanded_args)} args, "
                        f"but expected {len(macro.params)}."
                    )
                
                # Create a new context for this macro expansion
                new_macro_context = dict(zip(macro.params, expanded_args))
                # The expression body needs to be a deep copy to prevent modification
                return self._expand_expression(copy.deepcopy(macro.expression), new_macro_context)
            else:
                # It's a base function (like Nand, D)
                return Call(expr.name, expanded_args)
        
        raise TypeError(f"Unknown expression type during expansion: {type(expr)}")

    def _expand_all_macros(self):
        """
        Iterates through all assignments and expands their expressions fully,
        leaving only base functions (Nand, D) and variables.
        """
        #print("Expanding all macros...")
        expanded = {}
        for target, assignment in self.circuit.assignments.items():
            # Start with an empty context for top-level assignments
            # print(f"Expanding assignment for {target}: {dir(assignment.expression.children[0])}")
            expanded[target] = self._expand_expression(assignment.expression, {})
        return expanded

    def _evaluate(self, expr, time_step: int):
        """Recursively evaluates an expanded expression at a specific time step."""
        current_state = self.history[time_step]

        if isinstance(expr, Number):
            return expr.value
        
        if isinstance(expr, Variable):
            if expr.name not in current_state:
                raise UnresolvedSignalError(f"Signal '{expr.name}' has not been calculated yet at t={time_step}")
            return current_state[expr.name]

        if isinstance(expr, Call):
            # --- Base Function Implementations ---
            if expr.name == 'Nand' or expr.name == 'NAND':
                val1 = self._evaluate(expr.args[0], time_step)
                val2 = self._evaluate(expr.args[1], time_step)
                return 1 - (val1 * val2)  # Nand logic

            if expr.name == 'D':
                expr_to_eval, default_expr = expr.args[0], expr.args[1]
                if time_step == 0:
                    # At t=0, use the default value (evaluated at t=0)
                    return self._evaluate(default_expr, time_step)
                else:
                    # For t>0, evaluate the main expression at the *previous* time step
                    # Note: we use _evaluate_at_past_step to avoid raising UnresolvedSignalError
                    # for signals that may not exist at t=0 but do at t-1.
                    return self._evaluate_at_past_step(expr_to_eval, time_step - 1)
            
            raise ValueError(f"Unknown function '{expr.name}' in expanded expression.")
        
        raise TypeError(f"Unknown expression type during evaluation: {type(expr)}")

    def _evaluate_at_past_step(self, expr, time_step: int):
        """
        Evaluates an expression at a specific past time step. This is a wrapper
        around _evaluate to handle cases where a signal might not exist yet.
        """
        if time_step < 0:
            raise IndexError("Cannot evaluate at a negative time step.")
        
        # Temporarily swap history to the target past state for evaluation
        original_history = self.history
        self.history = self.history[:time_step + 1]
        try:
            # We use time_step as the index, which is now the last item in the temp history
            result = self._evaluate(expr, time_step)
        finally:
            self.history = original_history # Always restore history
        return result

    def run(self, inputs: Dict[str, str], num_steps: int):
        """
        Runs the simulation for a given number of steps.
        
        :param inputs: Dict mapping input signal names to their value strings, e.g., {'B': '101'}.
        :param num_steps: The total number of time steps to simulate.
        """
        self.history = []
        
        for t in range(num_steps):
            current_state = {}
            self.history.append(current_state)

            # 1. Set known inputs for the current time step
            for name, seq in inputs.items():
                if t < len(seq):
                    current_state[name] = int(seq[t])
                else:
                    # If input sequence is too short, default to 0
                    current_state[name] = 0
            
            # 2. Iteratively solve for combinational logic signals
            unresolved = set(self.expanded_assignments.keys())
            
            # Limit iterations to prevent infinite loops from combinational cycles
            max_iterations = len(unresolved) + 2
            for i in range(max_iterations): 
                resolved_this_pass = set()
                for name in list(unresolved):
                    try:
                        value = self._evaluate(self.expanded_assignments[name], t)
                        current_state[name] = value
                        resolved_this_pass.add(name)
                    except UnresolvedSignalError:
                        continue  # Skip this signal for now, will try again
                
                unresolved -= resolved_this_pass
                if not unresolved:
                    break  # All signals for this time step are resolved
            
            if unresolved:
                raise RuntimeError(f"Combinational loop or unresolved dependency detected involving signals: {unresolved}")

        return self.get_outputs(list(self.circuit.assignments.keys()), num_steps)

    def get_outputs(self, signal_names: List[str], num_steps: int) -> Dict[str, str]:
        """Formats the simulation history into output strings."""
        outputs = {}
        for name in signal_names:
            if name in self.history[0]: # Check if the signal is part of the simulation
                outputs[name] = "".join(str(self.history[t].get(name, '?')) for t in range(num_steps))
        return outputs


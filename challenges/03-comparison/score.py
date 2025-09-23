"""
Scoring script for the "Largest of Three" challenge.

"""

import itertools
import os
import sys
from typing import Dict, Any

# Add project root to path for framework import
def find_project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    while current_dir != os.path.dirname(current_dir):
        if os.path.exists(os.path.join(current_dir, 'scoring_framework.py')):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    return None

root_dir = find_project_root()
if root_dir and root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from scoring_framework import ScoringFramework, IterativeTestGenerator
except ImportError as e:
    print(f"Error: Could not import scoring framework: {e}")
    sys.exit(1)


def max_of_three(x1: str, x2: str, x3: str) -> str:
    """Return the largest of three bit‑strings according to numeric value.

    Inputs are bit‑strings of equal length.  Ties are resolved in favour
    of x1 over x2 over x3 (lexicographic by input order).
    """
    n1 = int(x1, 2)
    n2 = int(x2, 2)
    n3 = int(x3, 2)

    # Determine which is greatest; ties favour the earlier signal
    if n1 >= n2 and n1 >= n3:
        return x1
    if n2 >= n1 and n2 >= n3:
        return x2
    return x3


def validate_max_of_three(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    """Validate that the circuit output matches the expected maximum."""
    inputs = test_case['inputs']
    x1, x2, x3 = inputs['X1'], inputs['X2'], inputs['X3']
    expected = max_of_three(x1, x2, x3)
    result = outputs.get('Y', '?' * len(expected))
    return result == expected


def error_reporter(test_case: Dict[str, Any], outputs: Dict[str, str], expected: Dict[str, str]) -> None:
    """Custom error reporter for this challenge."""
    inputs = test_case['inputs']
    x1, x2, x3 = inputs['X1'], inputs['X2'], inputs['X3']
    expected_output = max_of_three(x1, x2, x3)
    actual_output = outputs.get('Y', '?' * len(expected_output))
    
    print(f"Failed for inputs X1={x1}, X2={x2}, X3={x3}")
    print(f"Expected Y={expected_output}")
    print(f"Got      Y={actual_output}")


def verify_circuit(circuit_file: str, num_bits: int = 3) -> bool:
    """Verify that the circuit produces the correct output for all inputs."""
    framework = ScoringFramework()
    
    # Generate all possible test cases
    test_cases = IterativeTestGenerator.generate_all_bitstring_combinations(
        num_bits, ['X1', 'X2', 'X3']
    )
    
    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=num_bits,
        validator=validate_max_of_three,
        error_reporter=error_reporter
    )


if __name__ == '__main__':
    framework = ScoringFramework()
    
    # Create CLI with additional bits argument
    args = framework.create_default_cli(
        description='Verify largest‑of‑three circuit',
        additional_args=[
            {
                'names': ['--bits', '-b'],
                'type': int,
                'default': 3,
                'help': 'Number of bits per input signal (default: 3)'
            }
        ]
    )
    
    verify_circuit(args.circuit, args.bits)
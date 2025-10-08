"""
Scoring script for the "Palindrome Detection" challenge.
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


def is_palindrome(bits: str) -> bool:
    """Check if a bit string is a palindrome."""
    return bits == bits[::-1]


def validate_counter(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    """
    Validate that the circuit correctly implements a running 3-bit counter
    that increments when the input 'I' is 1.
    """
    inputs = test_case['inputs']
    i_input = inputs['I']
    
    running_count = 0
    expected_o0 = ""
    expected_o1 = ""
    expected_o2 = ""

    for bit in i_input:
        if bit == '1':
            running_count = (running_count + 1) % 8
        
        expected_o0 += str((running_count >> 0) & 1)
        expected_o1 += str((running_count >> 1) & 1)
        expected_o2 += str((running_count >> 2) & 1)

    actual_o0 = outputs.get('O0', '')
    actual_o1 = outputs.get('O1', '')
    actual_o2 = outputs.get('O2', '')

    return actual_o0 == expected_o0 and actual_o1 == expected_o1 and actual_o2 == expected_o2

def error_reporter(test_case: Dict[str, Any], outputs: Dict[str, str], expected: Dict[str, str]) -> None:
    """Custom error reporter for the counter challenge."""
    inputs = test_case['inputs']
    i_input = inputs['I']

    running_count = 0
    expected_o0 = ""
    expected_o1 = ""
    expected_o2 = ""

    for bit in i_input:
        if bit == '1':
            running_count = (running_count + 1) % 8
        
        expected_o0 += str((running_count >> 0) & 1)
        expected_o1 += str((running_count >> 1) & 1)
        expected_o2 += str((running_count >> 2) & 1)

    actual_o0 = outputs.get('O0', '?' * len(i_input))
    actual_o1 = outputs.get('O1', '?' * len(i_input))
    actual_o2 = outputs.get('O2', '?' * len(i_input))
    
    print(f"Failed for input I={i_input}")
    print(f"         | Expected | Actual")
    print(f"---------|----------|---------")
    print(f"Output O0| {expected_o0} | {actual_o0}")
    print(f"Output O1| {expected_o1} | {actual_o1}")
    print(f"Output O2| {expected_o2} | {actual_o2}")


def verify_circuit(circuit_file: str) -> bool:
    """Verify the circuit works correctly for all possible 8-bit inputs."""
    framework = ScoringFramework()

    # Generate all possible 8-bit test cases
    test_cases = IterativeTestGenerator.generate_single_signal_combinations(8, 'I')

    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=8,
        validator=validate_counter,
        error_reporter=error_reporter
    )


if __name__ == '__main__':
    framework = ScoringFramework()
    
    # Create CLI
    args = framework.create_default_cli(
        description='Verify palindrome detector circuit'
    )
    
    verify_circuit(args.circuit)
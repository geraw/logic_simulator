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


def validate_palindrome_detection(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    """Validate that the circuit correctly detects palindromes."""
    inputs = test_case['inputs']
    i_input = inputs['I']
    expected = '000001' if is_palindrome(i_input) else '000000'
    result = outputs.get('O', '?' * 6)
    return result == expected


def error_reporter(test_case: Dict[str, Any], outputs: Dict[str, str], expected: Dict[str, str]) -> None:
    """Custom error reporter for palindrome detection."""
    inputs = test_case['inputs']
    i_input = inputs['I']
    expected_output = '000001' if is_palindrome(i_input) else '000000'
    actual_output = outputs.get('O', '?' * 6)
    
    print(f"Failed for input I={i_input}")
    print(f"Expected O={expected_output}")
    print(f"Got      O={actual_output}")


def verify_circuit(circuit_file: str) -> bool:
    """Verify the circuit works correctly for all possible 6-bit inputs."""
    framework = ScoringFramework()
    
    # Generate all possible 6-bit test cases
    test_cases = IterativeTestGenerator.generate_single_signal_combinations(6, 'I')
    
    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=6,
        validator=validate_palindrome_detection,
        error_reporter=error_reporter
    )


if __name__ == '__main__':
    framework = ScoringFramework()
    
    # Create CLI
    args = framework.create_default_cli(
        description='Verify palindrome detector circuit'
    )
    
    verify_circuit(args.circuit)
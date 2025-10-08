# Majority Bit Challenge Scoring Script
# Uses the common scoring framework
import os
import sys
from typing import Dict, Any

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

def majority_bit(x1: str, x2: str, x3: str) -> str:
    # For each bit position, output the majority value
    return ''.join(
        '1' if (int(a) + int(b) + int(c)) >= 2 else '0'
        for a, b, c in zip(x1, x2, x3)
    )

def validate_majority(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    inputs = test_case['inputs']
    x1, x2, x3 = inputs['X1'], inputs['X2'], inputs['X3']
    expected = majority_bit(x1, x2, x3)
    result = outputs.get('Y', '?' * len(expected))
    return result == expected

def error_reporter(test_case: Dict[str, Any], outputs: Dict[str, str], expected: Dict[str, str]) -> None:
    inputs = test_case['inputs']
    x1, x2, x3 = inputs['X1'], inputs['X2'], inputs['X3']
    expected_output = majority_bit(x1, x2, x3)
    actual_output = outputs.get('Y', '?' * len(expected_output))
    print(f"Failed for inputs X1={x1}, X2={x2}, X3={x3}")
    print(f"Expected Y={expected_output}")
    print(f"Got      Y={actual_output}")

def verify_circuit(circuit_file: str, num_bits: int = 3) -> bool:
    framework = ScoringFramework()
    test_cases = IterativeTestGenerator.generate_all_bitstring_combinations(
        num_bits, ['X1', 'X2', 'X3']
    )
    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=num_bits,
        validator=validate_majority,
        error_reporter=error_reporter
    )

if __name__ == '__main__':
    framework = ScoringFramework()
    args = framework.create_default_cli(
        description='Verify majority bit circuit',
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

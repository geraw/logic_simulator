# 3-bit CRC Challenge Scoring Script (Polynomial x^3 + x + 1)
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

def crc3(x: str) -> str:
    # Implements CRC-3 with polynomial x^3 + x + 1 (binary 1011)
    # Append three zeros
    reg = [0, 0, 0]
    for bit in x + '000':
        feedback = int(bit) ^ reg[2]
        reg = [feedback, reg[0] ^ feedback, reg[1] ^ feedback]
    return ''.join(str(b) for b in reg)

def validate_crc(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    inputs = test_case['inputs']
    x = inputs['X']
    expected = crc3(x)
    # Output should be the final value of CRC after all bits have been read
    result = outputs.get('CRC', '?' * 3)[-3:] if outputs.get('CRC') else '???'
    return result == expected

def error_reporter(test_case: Dict[str, Any], outputs: Dict[str, str], expected: Dict[str, str]) -> None:
    x = test_case['inputs']['X']
    expected_output = crc3(x)
    actual_output = outputs.get('CRC', '?' * 3)[-3:] if outputs.get('CRC') else '???'
    print(f"Failed for input X={x}")
    print(f"Expected CRC={expected_output}")
    print(f"Got      CRC={actual_output}")

def verify_circuit(circuit_file: str, num_bits: int = 4) -> bool:
    framework = ScoringFramework()
    test_cases = IterativeTestGenerator.generate_single_signal_combinations(num_bits, 'X')
    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=num_bits,
        validator=validate_crc,
        error_reporter=error_reporter
    )

if __name__ == '__main__':
    framework = ScoringFramework()
    args = framework.create_default_cli(
        description='Verify 3-bit CRC circuit (polynomial x^3 + x + 1)',
        additional_args=[
            {
                'names': ['--bits', '-b'],
                'type': int,
                'default': 4,
                'help': 'Number of bits per input signal (default: 4)'
            }
        ]
    )
    verify_circuit(args.circuit, args.bits)

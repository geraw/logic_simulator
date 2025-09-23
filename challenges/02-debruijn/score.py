# Refactored to use the common scoring framework
import os
import sys
from collections import defaultdict
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
    from scoring_framework import ScoringFramework
except ImportError as e:
    print(f"Error: Could not import scoring framework: {e}")
    sys.exit(1)

def verify_debruijn(sequence: str, n: int = 4) -> bool:
    if len(sequence) != 2**n:
        return False
    seen = defaultdict(int)
    for i in range(len(sequence)):
        pattern = sequence[i:i+n] if i+n <= len(sequence) else sequence[i:] + sequence[:(i+n-len(sequence))]
        seen[pattern] += 1
    return all(seen[format(i, f'0{n}b')] == 1 for i in range(2**n))

def verify_prefer_one_construction(sequence: str) -> bool:
    seen = set()
    current = '0000'
    seen.add(current)
    for bit in sequence:
        next_try = current[1:] + '1'
        if next_try not in seen:
            if bit != '1':
                return False
            current = next_try
        else:
            if bit != '0':
                return False
            current = current[1:] + '0'
        seen.add(current)
    return True

def validate_debruijn(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    sequence = outputs.get('Y', '?' * 16)
    return verify_debruijn(sequence) and verify_prefer_one_construction(sequence)

def error_reporter(test_case: Dict[str, Any], outputs: Dict[str, str], expected: Dict[str, str]) -> None:
    sequence = outputs.get('Y', '?' * 16)
    if not verify_debruijn(sequence):
        print(f"Failed: {sequence} is not a valid De Bruijn sequence")
    elif not verify_prefer_one_construction(sequence):
        print(f"Failed: {sequence} does not follow prefer-one construction")
    else:
        print(f"Failed: {sequence}")

def verify_circuit(circuit_file: str) -> bool:
    framework = ScoringFramework()
    test_cases = [{'inputs': {}}]
    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=16,
        validator=validate_debruijn,
        error_reporter=error_reporter
    )

if __name__ == '__main__':
    framework = ScoringFramework()
    args = framework.create_default_cli(
        description='Verify De Bruijn sequence generator circuit'
    )
    verify_circuit(args.circuit)

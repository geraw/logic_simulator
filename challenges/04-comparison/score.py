import itertools
import os
import sys


def find_project_root() -> str:
    """Find the project root directory containing simulator.py and circuit_parser.py.

    The scoring script may be run from within the challenge directory or from
    elsewhere.  This helper walks up the directory hierarchy until it finds
    both `simulator.py` and `circuit_parser.py` to ensure imports work.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    while current_dir != os.path.dirname(current_dir):
        required = [
            os.path.join(current_dir, 'simulator.py'),
            os.path.join(current_dir, 'circuit_parser.py'),
        ]
        if all(os.path.exists(path) for path in required):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    return os.path.dirname(os.path.abspath(__file__))


# Add project root to Python path if not already there
root_dir = find_project_root()
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    # Lazy import so the modules are only loaded if the script is run
    from simulator import Simulator  # type: ignore
    from circuit_parser import parse_file  # type: ignore
except ImportError as e:
    print("Error: Could not import required modules. Make sure you're running from the project root or challenges directory.")
    print(f"Project root detected as: {root_dir}")
    print(f"Import error: {e}")
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


def verify_circuit(circuit_file: str, num_bits: int = 3) -> bool:
    """Verify that the circuit produces the correct output for all inputs.

    The simulator will be run for `num_bits` time steps.  For each
    combination of X1, X2 and X3 (each of length `num_bits`), the output
    signal Y must match the largest input according to `max_of_three`.
    """
    try:
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)

        # Generate all possible inputs of length num_bits
        bitstrings = ["".join(bits) for bits in itertools.product('01', repeat=num_bits)]

        for x1 in bitstrings:
            for x2 in bitstrings:
                for x3 in bitstrings:
                    expected = max_of_three(x1, x2, x3)
                    # Run simulation for num_bits steps
                    outputs = sim.run({'X1': x1, 'X2': x2, 'X3': x3}, num_bits)
                    result = outputs.get('Y', '?' * num_bits)
                    if result != expected:
                        print(f"Failed for inputs X1={x1}, X2={x2}, X3={x3}")
                        print(f"Expected Y={expected}")
                        print(f"Got      Y={result}")
                        return False

        print("Success! Circuit produces correct outputs for all inputs.")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Verify largest‑of‑three circuit')
    default_circuit = os.path.join(os.path.dirname(__file__), 'solution.cir')
    parser.add_argument('--circuit', '-c', default=default_circuit,
                        help='Path to the circuit file (default: solution.cir in this directory)')
    parser.add_argument('--bits', '-b', type=int, default=3,
                        help='Number of bits per input signal (default: 3)')
    args = parser.parse_args()

    verify_circuit(args.circuit, args.bits)
# File: main.py
# The command-line interface for the logic circuit simulator.

import argparse
from circuit_parser import parse_file
from simulator import Simulator


def main():
    """Parses command-line arguments and runs the simulation."""
    parser = argparse.ArgumentParser(
        description="A digital logic circuit simulator.",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "circuit_file", help="Path to the .cir circuit description file."
    )

    parser.add_argument(
        "-i",
        "--input",
        action="append",
        metavar="SIGNAL=SEQUENCE",
        help="Define an input signal sequence. Can be used multiple times.\n"
        "Example: -i B=1011 -i C=0110",
    )
    parser.add_argument(
        "-o",
        "--output",
        action="append",
        metavar="SIGNAL",
        help="Specify which signals to display as output. If not provided,\n"
        "all signals from the circuit file will be shown.",
    )
    parser.add_argument(
        "-s",
        "--steps",
        type=int,
        help="Number of simulation steps. If not provided, it's inferred\n"
        "from the longest input sequence.",
    )

    args = parser.parse_args()

    # --- Parse Input Arguments ---
    inputs = {}
    max_input_len = 0
    if args.input:
        for val in args.input:
            if "=" not in val:
                parser.error(
                    f"Invalid input format: '{val}'. Expected 'SIGNAL=SEQUENCE'."
                )
            name, seq = val.split("=", 1)
            if not seq.isdigit() or not all(c in "01" for c in seq):
                parser.error(
                    f"Input sequence for '{name}' must be a binary string (e.g., '1011')."
                )
            inputs[name] = seq
            max_input_len = max(max_input_len, len(seq))

    num_steps = args.steps if args.steps is not None else max_input_len
    if num_steps <= 0:
        print("No steps to simulate (no inputs provided and --steps not set).")
        return

    # --- Parse, Simulate, and Display Results ---
    try:
        print(f"Parsing circuit file: {args.circuit_file}...")
        circuit = parse_file(args.circuit_file)

        print("Initializing simulator and expanding macros...")
        sim = Simulator(circuit)

        print(f"Running simulation for {num_steps} steps...")
        all_results = sim.run(inputs, num_steps)
        print("-" * 30)
        print("Simulation Complete!")
        print("-" * 30)

        # Determine which signals to display
        signals_to_display = args.output if args.output else sorted(all_results.keys())

        # Display inputs first for clarity
        print("Inputs:")
        for name in sorted(inputs.keys()):
            print(f"  {name:<5}: {inputs[name]}")

        print("\nOutputs & Internal Signals:")
        for name in signals_to_display:
            if name not in inputs:  # Don't print inputs twice
                print(f"  {name:<5}: {all_results.get(name, 'N/A')}")

    except FileNotFoundError as e:
        print(f"\nError: File not found - {e.filename}")
    except Exception as e:
        print(f"\nAn error occurred: {e}")


if __name__ == "__main__":
    main()

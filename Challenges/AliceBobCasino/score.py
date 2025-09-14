import itertools
import os
import sys
from typing import Dict

# Add parent directory to Python path if not already there
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from circuit_parser import parse_file
from simulator import Simulator

def calculate_score(outputs: Dict[str, str], num_bits: int) -> int:
    """
    Calculates the score for a simulation run.
    The score is the number of time steps where A == B == C.
    """
    a_seq = outputs.get('A', '?' * num_bits)
    b_seq = outputs.get('B', '?' * num_bits)
    c_seq = outputs.get('C', '?' * num_bits)
    
    score = 0
    for i in range(num_bits-1):
        # Ensure all signals are valid at this time step before comparing
        if a_seq[i] != '?' and b_seq[i+1] != '?' and c_seq[i+1] != '?':
            if a_seq[i] == b_seq[i+1] == c_seq[i+1]:
                score += 1
    return score

def find_worst_c(circuit_file: str, num_bits: int):
    """
    Analyzes the circuit to find the "worst" C input.

    For each possible C input signal (of length num_bits):
    1. It finds the "best" B input signal that maximizes the score (where A=B=C).
    2. The score for that (C, best_B) pair is the "best score for C".

    The function then finds the C signal that has the minimum "best score".
    This is the "worst C".
    """
    print(f"--- Starting Circuit Analysis ---")
    print(f"Circuit file: {circuit_file}")
    print(f"Signal length: {num_bits} bits")
    total_sims = (2**num_bits)**2
    print(f"This will test {2**num_bits} C signals and {2**num_bits} B signals for each C.")
    print(f"Total simulations: {total_sims:,}")
    print("This may take some time...")

    try:
        circuit = parse_file(circuit_file)
    except Exception as e:
        print(f"Error parsing circuit file: {e}")
        return

    worst_c_info = {
        "c_signal": None,
        "best_b_for_c": None,
        "min_best_score": float('inf')
    }

    # Generate all possible bit strings of length num_bits
    possible_signals = ["".join(p) for p in itertools.product('01', repeat=num_bits)]

    # Outer loop: Iterate through every possible C signal
    for i, c_signal in enumerate(possible_signals):
        max_score_for_this_c = -1
        best_b_for_this_c = None

        # Inner loop: Find the best B for this C
        for b_signal in possible_signals:
            sim = Simulator(circuit)
            inputs = {'B': b_signal, 'C': c_signal}
            outputs = sim.run(inputs, num_steps=num_bits)
            
            # Add inputs to outputs dict to make scoring easier
            outputs['B'] = b_signal
            outputs['C'] = c_signal

            current_score = calculate_score(outputs, num_bits)

            if current_score > max_score_for_this_c:
                max_score_for_this_c = current_score
                best_b_for_this_c = b_signal
        
        # We've found the best score for the current C.
        # Now, check if this C is the "worst" one we've seen so far.
        if max_score_for_this_c < worst_c_info["min_best_score"]:
            worst_c_info["min_best_score"] = max_score_for_this_c
            worst_c_info["c_signal"] = c_signal
            worst_c_info["best_b_for_c"] = best_b_for_this_c

        # Progress update
        progress = (i + 1) / len(possible_signals)
        sys.stdout.write(f"\r  Progress: [{int(progress * 20) * '=':20s}] {progress:.1%} - Current worst score: {worst_c_info['min_best_score']}")
        sys.stdout.flush()

    print("\n\n--- Analysis Complete ---")
    print(f"Worst C Signal:     {worst_c_info['c_signal']}")
    print(f"Best B for that C:  {worst_c_info['best_b_for_c']}")
    print(f"Score (min of max): {worst_c_info['min_best_score']} / {num_bits}")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Analyze circuit for worst-case inputs')
    parser.add_argument('--circuit', '-c', 
                      default=os.path.join(root_dir, 'circuit.cir'),
                      help='Path to the circuit file (default: circuit.cir in root directory)')
    parser.add_argument('--bits', '-b', 
                      type=int, 
                      default=9,
                      help='Number of bits to test (default: 9)')
    
    args = parser.parse_args()
    find_worst_c(args.circuit, args.bits)

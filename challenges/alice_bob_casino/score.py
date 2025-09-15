import itertools
import os
import sys
import time
from typing import Dict, Optional, List, Tuple
from multiprocessing import Pool, cpu_count
import numpy as np

# Add parent directory to Python path if not already there
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, root_dir)

# Direct imports from the root directory
from simulator import Simulator
from circuit_parser import Circuit, parse_file

def calculate_score(outputs: Dict[str, str], num_bits: int) -> int:
    """
    Calculates the score for a simulation run.
    The score is the number of time steps where A == B == C.
    """
    # Convert strings to numpy arrays for faster comparison
    a = np.array([int(x) if x != '?' else -1 for x in outputs.get('A', '?' * num_bits)])
    b = np.array([int(x) if x != '?' else -1 for x in outputs.get('B', '?' * num_bits)])
    c = np.array([int(x) if x != '?' else -1 for x in outputs.get('C', '?' * num_bits)])
    
    # Vectorized comparison
    valid_indices = (a[:-1] != -1) & (b[1:] != -1) & (c[1:] != -1)
    matches = (a[:-1] == b[1:]) & (b[1:] == c[1:]) & valid_indices
    return np.sum(matches)

def process_c_signal(args: Tuple[str, List[str], Circuit, int]) -> Tuple[str, str, int]:
    """Process a single C signal against all possible B signals."""
    c_signal, possible_signals, circuit, num_bits = args
    sim = Simulator(circuit)  # Create simulator once per C signal
    max_score = -1
    best_b = None

    for b_signal in possible_signals:
        outputs = sim.run({'B': b_signal, 'C': c_signal}, num_bits)
        outputs['B'] = b_signal
        outputs['C'] = c_signal
        current_score = calculate_score(outputs, num_bits)
        
        if current_score > max_score:
            max_score = current_score
            best_b = b_signal

    return c_signal, best_b, max_score

def find_worst_c(circuit_file: str, num_bits: int, cached_circuit: Optional[Circuit] = None):
    """
    Analyzes the circuit to find the "worst" C input.
    Args:
        circuit_file: Path to the circuit file
        num_bits: Number of bits to simulate
        cached_circuit: Optional pre-parsed circuit to avoid reparsing
    """
    print(f"--- Starting Circuit Analysis ---")
    print(f"Circuit file: {circuit_file}")
    print(f"Signal length: {num_bits} bits")
    
    if cached_circuit is None:
        try:
            circuit = parse_file(circuit_file)
        except Exception as e:
            print(f"Error parsing circuit file: {e}")
            return
    else:
        circuit = cached_circuit

    # Pre-generate all possible signals
    possible_signals = ["".join(p) for p in itertools.product('01', repeat=num_bits)]
    
    # Prepare arguments for parallel processing
    num_processes = cpu_count()
    print(f"Using {num_processes} CPU cores for parallel processing")
    args_list = [(c, possible_signals, circuit, num_bits) for c in possible_signals]
    
    start_time = time.time()
    worst_c_info = {"c_signal": None, "best_b_for_c": None, "min_best_score": float('inf')}

    # Process C signals in parallel
    with Pool(num_processes) as pool:
        for i, (c_signal, best_b, max_score) in enumerate(pool.imap(process_c_signal, args_list)):
            if max_score < worst_c_info["min_best_score"]:
                worst_c_info.update({
                    "min_best_score": max_score,
                    "c_signal": c_signal,
                    "best_b_for_c": best_b
                })
            
            # Progress update
            progress = (i + 1) / len(possible_signals)
            elapsed = time.time() - start_time
            eta = (elapsed / progress) * (1 - progress) if progress > 0 else 0
            
            sys.stdout.write(
                f"\r  Progress: [{int(progress * 20) * '=':20s}] {progress:.1%} "
                f"- Current worst score: {worst_c_info['min_best_score']} "
                f"- ETA: {int(eta/60)}m {int(eta%60)}s"
            )
            sys.stdout.flush()

    print("\n\n--- Analysis Complete ---")
    print(f"Total time: {int(time.time() - start_time)} seconds")
    print(f"Worst C Signal:     {worst_c_info['c_signal']}")
    print(f"Best B for that C:  {worst_c_info['best_b_for_c']}")
    print(f"Score (min of max): {worst_c_info['min_best_score']} / {num_bits}")

    return worst_c_info

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Analyze circuit for worst-case inputs')
    parser.add_argument('--circuit', '-c', 
                      default=os.path.join(root_dir, 'alice.cir'),
                      help='Path to the circuit file (default: alice.cir in root directory)')
    parser.add_argument('--bits', '-b', 
                      type=int, 
                      default=9,
                      help='Number of bits to test (default: 9)')   
    
    args = parser.parse_args()
    find_worst_c(args.circuit, args.bits)

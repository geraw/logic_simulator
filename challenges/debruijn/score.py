import os
import sys
from collections import defaultdict

def find_project_root():
    """Find the project root directory containing simulator.py and circuit_parser.py"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    while current_dir != os.path.dirname(current_dir):
        if all(os.path.exists(os.path.join(current_dir, f)) 
               for f in ['simulator.py', 'circuit_parser.py', 'grammar.lark']):
            return current_dir
        current_dir = os.path.dirname(current_dir)
    return None

# Add project root to Python path if not already there
root_dir = find_project_root()
if root_dir and root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from simulator import Simulator
    from circuit_parser import Circuit, parse_file
except ImportError as e:
    print(f"Error: Could not import required modules.")
    print(f"Project root detected as: {root_dir}")
    print(f"Import error: {e}")
    sys.exit(1)

def verify_debruijn(sequence: str, n: int = 4) -> bool:
    """Verify if a sequence is a valid De Bruijn sequence of order n."""
    if len(sequence) != 2**n:
        return False
    
    # Check if every n-bit pattern appears exactly once
    seen = defaultdict(int)
    for i in range(len(sequence)):
        pattern = sequence[i:i+n] if i+n <= len(sequence) else \
                 sequence[i:] + sequence[:(i+n-len(sequence))]
        seen[pattern] += 1
    
    # Verify each pattern appears exactly once
    return all(seen[format(i, f'0{n}b')] == 1 
              for i in range(2**n))

def verify_prefer_one_construction(sequence: str) -> bool:
    """Verify the sequence follows the prefer-one construction rule."""
    seen = set()
    current = '0000'  # Initial state
    seen.add(current)
    
    for bit in sequence:
        # Try to append 1
        next_try = current[1:] + '1'
        if next_try not in seen:
            if bit != '1':
                return False
            current = next_try
        else:
            # Must append 0
            if bit != '0':
                return False
            current = current[1:] + '0'
        seen.add(current)
    
    return True

def verify_circuit(circuit_file: str) -> bool:
    """Verify the circuit generates a valid De Bruijn sequence."""
    try:
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)
        
        # Run simulation for 16 steps
        outputs = sim.run({}, 16)
        sequence = outputs.get('Y', '?' * 16)
        
        # Verify the sequence
        if not verify_debruijn(sequence):
            print(f"Failed: {sequence} is not a valid De Bruijn sequence")
            return False
            
        if not verify_prefer_one_construction(sequence):
            print(f"Failed: {sequence} does not follow prefer-one construction")
            return False
        
        print(f"Success! Generated valid De Bruijn sequence: {sequence}")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Verify De Bruijn sequence generator circuit')
    default_circuit = os.path.join(os.path.dirname(__file__), 'solution.cir')
    parser.add_argument('--circuit', '-c', 
                      default=default_circuit,
                      help='Path to the circuit file')
    
    args = parser.parse_args()
    verify_circuit(args.circuit)

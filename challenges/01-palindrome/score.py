import itertools
import os
import sys
from typing import Dict

def find_project_root():
    """Find the project root directory containing simulator.py and circuit_parser.py"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    while current_dir != os.path.dirname(current_dir):  # Stop at root directory
        if os.path.exists(os.path.join(current_dir, 'simulator.py')) and \
           os.path.exists(os.path.join(current_dir, 'circuit_parser.py')):
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
    print(f"Error: Could not import required modules. Make sure you're running from the project root or challenges directory.")
    print(f"Project root detected as: {root_dir}")
    print(f"Import error: {e}")
    sys.exit(1)

def is_palindrome(bits: str) -> bool:
    """Check if a bit string is a palindrome."""
    return bits == bits[::-1]

def verify_circuit(circuit_file: str):
    """Verify the circuit works correctly for all possible 6-bit inputs."""
    try:
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)
        
        # Test all possible 6-bit combinations
        for x in itertools.product('01', repeat=6):
            x_str = ''.join(x)
            expected = '000001' if is_palindrome(x_str) else '000000'
            
            # Run simulation
            outputs = sim.run({'X': x_str}, 6)
            result = outputs.get('Y', '?' * 7)
            
            # Verify output
            if result != expected:
                print(f"Failed for input X={x_str}")
                print(f"Expected Y={expected}")
                print(f"Got      Y={result}")
                return False
                
        print("Success! Circuit works correctly for all inputs.")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Verify palindrome detector circuit')
    
    # Update default circuit path to be relative to the script
    default_circuit = os.path.join(os.path.dirname(__file__), 'solution.cir')
    parser.add_argument('--circuit', '-c', 
                      default=default_circuit,
                      help='Path to the circuit file (default: solution.cir in script directory)')
    
    args = parser.parse_args()
    verify_circuit(args.circuit)

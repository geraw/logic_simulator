import os
import sys
import unittest
from typing import Dict

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from circuit_parser import parse_file
from simulator import Simulator

class TestBasicFunctionality(unittest.TestCase):
    def setUp(self):
        self.test_dir = os.path.join(os.path.dirname(__file__), 'test_circuits')

    def verify_simulation(self, circuit_path: str, inputs: Dict[str, str], 
                         expected_outputs: Dict[str, str], steps: int):
        circuit = parse_file(circuit_path)
        sim = Simulator(circuit)
        results = sim.run(inputs, steps)
        
        for signal, expected in expected_outputs.items():
            self.assertIn(signal, results, f"Signal {signal} not found in outputs")
            self.assertEqual(results[signal], expected, 
                           f"Signal {signal} mismatch. Expected {expected}, got {results[signal]}")

    def test_basic_gates(self):
        circuit_path = os.path.join(self.test_dir, 'basic_gates.cir')
        inputs = {
            'A': '1010',  # NOT test input
            'B': '1100',  # Input 1 for other gates
            'C': '1010'   # Input 2 for other gates
        }
        expected = {
            'N': '0101',  # NOT of A
            'W': '1000',  # AND of B,C
            'X': '1110',  # OR of B,C
            'Y': '0110',  # XOR of B,C
            'Z': '0111'   # NAND of B,C
        }
        self.verify_simulation(circuit_path, inputs, expected, 4)

    def test_sequential(self):
        circuit_path = os.path.join(self.test_dir, 'sequential.cir')
        inputs = {
            'I': '1010'
        }
        expected = {
            'O1': '0101',  # Delayed I
            'O2': '0010',  # Double delayed I
            'Toggle': '1100'  # Toggle flip-flop output
        }
        self.verify_simulation(circuit_path, inputs, expected, 4)

class TestErrorCases(unittest.TestCase):
    def setUp(self):
        self.test_dir = os.path.join(os.path.dirname(__file__), 'test_circuits')

    def test_undefined_macro(self):
        circuit_file = os.path.join(self.test_dir, 'error_undefined_macro.cir')
        with self.assertRaises(ValueError) as context:
            circuit = parse_file(circuit_file)
            sim = Simulator(circuit)
            sim.run({}, 1)
        self.assertIn("UNDEFINED_MACRO", str(context.exception))

    def test_wrong_params(self):
        circuit_file = os.path.join(self.test_dir, 'error_wrong_params.cir')
        with self.assertRaises(ValueError) as context:
            circuit = parse_file(circuit_file)
            sim = Simulator(circuit)
            sim.run({}, 1)
        self.assertIn("args", str(context.exception))

    def test_combo_loop(self):
        circuit_file = os.path.join(self.test_dir, 'error_combo_loop.cir')
        with self.assertRaises(RuntimeError) as context:
            circuit = parse_file(circuit_file)
            sim = Simulator(circuit)
            sim.run({}, 1)
        self.assertIn("Combinational loop", str(context.exception))

    def test_duplicate_macro(self):
        circuit_file = os.path.join(self.test_dir, 'error_duplicate_macro.cir')
        with self.assertRaises(RuntimeError) as context:
            parse_file(circuit_file)
        self.assertIn("defined more than once", str(context.exception))

    def test_undefined_signal(self):
        circuit_file = os.path.join(self.test_dir, 'error_undefined_signal.cir')
        with self.assertRaises(RuntimeError) as context:
            circuit = parse_file(circuit_file)
            sim = Simulator(circuit)
            sim.run({}, 1)
        self.assertIn("unresolved dependency", str(context.exception))

if __name__ == '__main__':
    unittest.main()

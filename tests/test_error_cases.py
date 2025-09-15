import os
import unittest
import sys

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from circuit_parser import parse_file
from simulator import Simulator

class TestErrorCases(unittest.TestCase):
    def setUp(self):
        self.test_dir = os.path.join(os.path.dirname(__file__), 'test_circuits')

    def test_undefined_macro(self):
        circuit_file = os.path.join(self.test_dir, 'error_undefined_macro.cir')
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)
        with self.assertRaises(ValueError) as context:
            sim.run({}, 1)
        self.assertIn("Unknown function", str(context.exception))

    def test_wrong_params(self):
        circuit_file = os.path.join(self.test_dir, 'error_wrong_params.cir')
        circuit = parse_file(circuit_file)
        with self.assertRaises(ValueError) as context:
            sim = Simulator(circuit)
        self.assertIn("called with", str(context.exception))

    def test_combo_loop(self):
        circuit_file = os.path.join(self.test_dir, 'error_combo_loop.cir')
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)
        with self.assertRaises(RuntimeError) as context:
            sim.run({}, 1)
        self.assertIn("Combinational loop", str(context.exception))

    def test_duplicate_macro(self):
        circuit_file = os.path.join(self.test_dir, 'error_duplicate_macro.cir')
        with self.assertRaises(RuntimeError) as context:
            parse_file(circuit_file)
        self.assertIn("defined more than once", str(context.exception))

    def test_undefined_signal(self):
        circuit_file = os.path.join(self.test_dir, 'error_undefined_signal.cir')
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)
        with self.assertRaises(RuntimeError) as context:
            sim.run({}, 1)
        self.assertIn("unresolved dependency", str(context.exception))

if __name__ == '__main__':
    unittest.main()

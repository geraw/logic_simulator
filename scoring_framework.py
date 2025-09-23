"""
Common scoring framework for logic circuit challenges.

This module provides base functionality that's shared across all challenge
scoring scripts, eliminating code duplication and providing a consistent
interface for circuit verification.
"""

import os
import sys
from typing import Dict, Any, Callable, Optional, List
from abc import ABC, abstractmethod


class ScoringFramework:
    """Base framework for circuit scoring with common functionality."""
    
    def __init__(self):
        """Initialize the scoring framework."""
        self._setup_imports()
    
    def _setup_imports(self) -> None:
        """Setup imports by finding project root and importing required modules."""
        root_dir = self._find_project_root()
        if root_dir not in sys.path:
            sys.path.insert(0, root_dir)
        
        try:
            # Lazy import so the modules are only loaded if the script is run
            from simulator import Simulator  # type: ignore
            from circuit_parser import parse_file  # type: ignore
            self.Simulator = Simulator
            self.parse_file = parse_file
        except ImportError as e:
            print("Error: Could not import required modules. Make sure you're running from the project root or challenges directory.")
            print(f"Project root detected as: {root_dir}")
            print(f"Import error: {e}")
            sys.exit(1)
    
    def _find_project_root(self) -> str:
        """Find the project root directory containing simulator.py and circuit_parser.py.

        The scoring script may be run from within the challenge directory or from
        elsewhere. This helper walks up the directory hierarchy until it finds
        required files to ensure imports work.
        """
        # Start from the directory containing the file that's importing this framework
        import inspect
        caller_file = inspect.stack()[2].filename  # Get the file that called this
        current_dir = os.path.dirname(os.path.abspath(caller_file))
        
        while current_dir != os.path.dirname(current_dir):
            required_files = ['simulator.py', 'circuit_parser.py']
            required_paths = [os.path.join(current_dir, f) for f in required_files]
            if all(os.path.exists(path) for path in required_paths):
                return current_dir
            current_dir = os.path.dirname(current_dir)
        return os.path.dirname(os.path.abspath(caller_file))
    
    def run_circuit_test(self, 
                        circuit_file: str,
                        test_cases: List[Dict[str, Any]],
                        steps: int,
                        validator: Callable[[Dict[str, str], Dict[str, Any]], bool],
                        error_reporter: Optional[Callable[[Dict[str, Any], Dict[str, str], Dict[str, str]], None]] = None) -> bool:
        """
        Generic circuit testing framework.
        
        Args:
            circuit_file: Path to the circuit file
            test_cases: List of test case dictionaries with 'inputs' and 'expected' keys
            steps: Number of simulation steps
            validator: Function to validate outputs against expected results
            error_reporter: Optional function to report detailed errors
            
        Returns:
            True if all tests pass, False otherwise
        """
        try:
            circuit = self.parse_file(circuit_file)
            sim = self.Simulator(circuit)
            
            for test_case in test_cases:
                inputs = test_case['inputs']
                expected = test_case.get('expected', {})
                
                # Run simulation
                outputs = sim.run(inputs, steps)
                
                # Validate results
                if not validator(outputs, test_case):
                    if error_reporter:
                        error_reporter(test_case, outputs, expected)
                    else:
                        self._default_error_reporter(test_case, outputs, expected)
                    return False
            
            print("Success! Circuit produces correct outputs for all inputs.")
            return True
            
        except Exception as e:
            print(f"Error: {e}")
            return False
    
    def _default_error_reporter(self, test_case: Dict[str, Any], 
                               outputs: Dict[str, str], 
                               expected: Dict[str, str]) -> None:
        """Default error reporting function."""
        inputs = test_case['inputs']
        print(f"Failed for inputs {inputs}")
        if expected:
            for signal, exp_value in expected.items():
                actual = outputs.get(signal, '?')
                print(f"Expected {signal}={exp_value}")
                print(f"Got      {signal}={actual}")
    
    def create_default_cli(self, 
                          description: str,
                          default_circuit_name: str = 'solution.cir',
                          additional_args: Optional[List[Dict[str, Any]]] = None):
        """
        Create a standard command-line interface for scoring scripts.
        
        Args:
            description: Description for the argument parser
            default_circuit_name: Default circuit filename
            additional_args: Additional arguments to add to the parser
            
        Returns:
            Parsed arguments namespace
        """
        import argparse
        import inspect
        
        parser = argparse.ArgumentParser(description=description)
        
        # Standard arguments - use the directory of the calling script
        caller_file = inspect.stack()[1].filename
        caller_dir = os.path.dirname(os.path.abspath(caller_file))
        default_circuit = os.path.join(caller_dir, default_circuit_name)
        
        parser.add_argument('--circuit', '-c', default=default_circuit,
                           help=f'Path to the circuit file (default: {default_circuit_name} in this directory)')
        
        # Add any additional arguments
        if additional_args:
            for arg in additional_args:
                parser.add_argument(*arg.get('names', []), **{k: v for k, v in arg.items() if k != 'names'})
        
        return parser.parse_args()


class IterativeTestGenerator:
    """Helper class for generating test cases through iteration."""
    
    @staticmethod
    def generate_all_bitstring_combinations(num_bits: int, signal_names: List[str]) -> List[Dict[str, Any]]:
        """Generate all possible bitstring combinations for given signals."""
        import itertools
        
        bitstrings = ["".join(bits) for bits in itertools.product('01', repeat=num_bits)]
        test_cases = []
        
        # Generate all combinations
        for combination in itertools.product(bitstrings, repeat=len(signal_names)):
            inputs = dict(zip(signal_names, combination))
            test_cases.append({'inputs': inputs})
        
        return test_cases
    
    @staticmethod
    def generate_single_signal_combinations(num_bits: int, signal_name: str) -> List[Dict[str, Any]]:
        """Generate all possible bitstring values for a single signal."""
        import itertools
        
        test_cases = []
        for bits in itertools.product('01', repeat=num_bits):
            bitstring = "".join(bits)
            test_cases.append({'inputs': {signal_name: bitstring}})
        
        return test_cases
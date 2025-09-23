# Scoring Framework Refactoring

## Overview

This refactoring eliminates code duplication across challenge scoring scripts by extracting common functionality into a reusable `ScoringFramework` class.

## Benefits

### 1. **Eliminated Code Duplication**
- **Before**: Each scoring script had 30-40 lines of boilerplate code for:
  - Finding project root directory
  - Setting up Python path
  - Importing required modules
  - Creating argument parsers
  - Basic error handling

- **After**: All common functionality is centralized in `scoring_framework.py`, reducing each scoring script by ~60% in size.

### 2. **Consistent Interface**
- All scoring scripts now follow the same pattern
- Standardized command-line interface
- Consistent error reporting format
- Uniform test case structure

### 3. **Easier Maintenance**
- Bug fixes in common functionality only need to be made in one place
- New features can be added to the framework and benefit all challenges
- Easier to add new challenges following the established pattern

### 4. **Better Testability**
- Clear separation of concerns between framework and challenge-specific logic
- Testable components with well-defined interfaces
- Easier to mock dependencies for unit testing

## Usage Pattern

### Before Refactoring
```python
# 40+ lines of boilerplate code for imports, path setup, CLI...

def verify_circuit(circuit_file: str, num_bits: int = 3) -> bool:
    try:
        circuit = parse_file(circuit_file)
        sim = Simulator(circuit)
        
        # Generate test cases inline
        bitstrings = ["".join(bits) for bits in itertools.product('01', repeat=num_bits)]
        for x1 in bitstrings:
            for x2 in bitstrings:
                for x3 in bitstrings:
                    # Validation logic mixed with test execution
                    expected = max_of_three(x1, x2, x3)
                    outputs = sim.run({'X1': x1, 'X2': x2, 'X3': x3}, num_bits)
                    result = outputs.get('Y', '?' * num_bits)
                    if result != expected:
                        # Inline error reporting
                        print(f"Failed for inputs X1={x1}, X2={x2}, X3={x3}")
                        print(f"Expected Y={expected}")
                        print(f"Got      Y={result}")
                        return False
        
        print("Success! Circuit produces correct outputs for all inputs.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# More boilerplate for CLI
```

### After Refactoring
```python
from scoring_framework import ScoringFramework, IterativeTestGenerator

def validate_max_of_three(outputs: Dict[str, str], test_case: Dict[str, Any]) -> bool:
    """Clean validation logic separated from test execution."""
    # ... validation logic only

def verify_circuit(circuit_file: str, num_bits: int = 3) -> bool:
    """Clean, focused function using the framework."""
    framework = ScoringFramework()
    test_cases = IterativeTestGenerator.generate_all_bitstring_combinations(
        num_bits, ['X1', 'X2', 'X3']
    )
    
    return framework.run_circuit_test(
        circuit_file=circuit_file,
        test_cases=test_cases,
        steps=num_bits,
        validator=validate_max_of_three,
        error_reporter=error_reporter
    )

# CLI creation is now a one-liner
args = framework.create_default_cli('Verify largest‑of‑three circuit', ...)
```

## Framework Components

### 1. **ScoringFramework Class**
- Handles project root discovery
- Manages imports and path setup
- Provides generic circuit testing functionality
- Creates standardized CLI interfaces

### 2. **IterativeTestGenerator Class**
- Helper methods for common test case generation patterns
- Supports single signal and multi-signal combinations
- Extensible for custom test case generation

### 3. **Standardized Callback Interface**
- `validator(outputs, test_case) -> bool`: Validates test results
- `error_reporter(test_case, outputs, expected)`: Reports failures
- Clean separation between framework and challenge logic

## Migration Guide

To refactor an existing scoring script:

1. **Extract validation logic** into a pure function that takes outputs and test case
2. **Replace test generation** with appropriate `IterativeTestGenerator` methods
3. **Replace circuit execution loop** with `framework.run_circuit_test()`
4. **Replace CLI boilerplate** with `framework.create_default_cli()`
5. **Remove import and path setup** code

## Future Enhancements

The framework can be extended with:
- Parallel test execution for performance
- Test result caching
- Detailed performance metrics
- Automated test report generation
- Integration with CI/CD systems
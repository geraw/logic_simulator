# Palindrome Detector Challenge

## Description of the Challenge
Design a logic circuit that detects if a 6-bit input sequence X is a palindrome (reads the same forwards and backwards).

## Input/Output Specification
- Input: X (6 bits)
- Output: Y (6 bits)
- Y should output 000001 if X is a palindrome, 000000 otherwise

## Examples
```
X = 101101 -> Y = 000001 (palindrome)
X = 101100 -> Y = 000000 (not a palindrome)
X = 110011 -> Y = 000001 (palindrome)
```

## Scoring
The score is binary - either your circuit works correctly for all possible 6-bit inputs (pass) or it doesn't (fail).

## Usage
Run the scoring script:
```bash
python score.py --circuit your_circuit.cir
```

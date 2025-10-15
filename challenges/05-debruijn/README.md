# De Bruijn Sequence Generator Challenge

## The Challenge
Create a circuit that generates a 16-bit De Bruijn sequence using the prefer-one construction method.

## What is a De Bruijn Sequence?
A De Bruijn sequence of order n is a cyclic sequence of bits where every possible sequence of n bits appears exactly once as a consecutive substring.

## Requirements
- Input: None (autonomous sequence generator)
- Output: Y (16 bits)
- Y should be a valid De Bruijn sequence of order 4
- Use the prefer-one construction method:
  1. Start with state 0000
  2. For each state, append 1 if possible (if the resulting 4-bit window wasn't seen before)
  3. Otherwise, append 0

## Example (for n=3)
A valid 8-bit De Bruijn sequence would be: 00011101
This contains all 3-bit patterns exactly once:
- 000
- 001
- 011
- 111
- 110
- 101
- 010
- 100

## Scoring
The score is binary:
- PASS if the output is a valid 16-bit De Bruijn sequence
- FAIL otherwise

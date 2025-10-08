# 3-Bit Synchronous Counter

## Description

Implement a 3-bit synchronous counter. The counter should have one input, `I`, which acts as an enable signal. When `I` is `1`, the counter should increment its value on each clock cycle. When `I` is `0`, the counter should hold its current value.

The counter has three outputs: `O2`, `O1`, and `O0`, which represent the 3-bit binary value of the counter, with `O2` being the most significant bit.

## Requirements

- The counter must be synchronous, meaning all state changes should be based on the same clock edge (implicitly, each simulation step).
- The counter should increment only when the input `I` is `1`.
- The counter should wrap around from `7` (binary `111`) back to `0`.

## Example Behavior

If the input `I` is held high (`1`), the output should cycle through the binary numbers from 0 to 7:
- Step 0: `000`
- Step 1: `001`
- Step 2: `010`
- ...
- Step 7: `111`
- Step 8: `000`

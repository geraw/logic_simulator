# Majority Bit Challenge

## The Challenge

Design a logic circuit that reads **three binary input signals**—`X1`, `X2`, and `X3`—each of the same length, and produces a **binary output signal** `Y` such that for each time step, `Yₜ` is the majority value among `X1ₜ`, `X2ₜ`, and `X3ₜ`. In other words, for each bit position, the output is `1` if at least two of the three inputs are `1`, and `0` otherwise.

**Note:** The length of the input signals is not fixed; your circuit should work for any length, as long as all three inputs are the same length.

### Example

If the three inputs are of length four:

```
X1 = 1101
X2 = 1011
X3 = 0111
```

The output should be:

```
Y  = 1111
```

Explanation:
- At each time step, the output bit is the majority of the three input bits at that position.

## Input/Output Specification

- **Inputs:**
  - `X1` – bit sequence (most significant bit arrives at `t=0`)
  - `X2` – bit sequence (same length as `X1`)
  - `X3` – bit sequence (same length as `X1`)
- **Output:**
  - `Y` – bit sequence where each bit is the majority of the corresponding input bits

The circuit will be simulated for as many time steps as the length of the input signals. At each time step `t`, your circuit should produce one bit of `Y`.

## Scoring

The scoring script will test all possible bit combinations for `X1`, `X2`, and `X3` of the specified length. For each test case, it will check that the output at each time step is the majority value of the three inputs at that time step.

## Usage

From the `challenges/04-majority` directory, run:

```bash
python score.py --circuit your_solution.cir
```

You can specify a different bit-width using the `--bits`/`-b` flag (default is 3):

```bash
python score.py --circuit your_solution.cir --bits 4
```

## Tips

- **Use simple logic.** The majority function for three bits can be implemented as `Y = (X1 & X2) | (X1 & X3) | (X2 & X3)`.
- **No memory required.** This challenge does not require D-flip-flops or state, as each output depends only on the current input bits.

Good luck!

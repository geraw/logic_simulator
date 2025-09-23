
# Largest of Three Challenge

## The Challenge

Design a logic circuit that reads **three binary input signals**,`X1`, `X2` and `X3`, of of the same length, and produces a **binary output signal** `Y` that equals the largest of the three inputs.  Each input signal represents an binary number with the most significant bit arriving first.  Your circuit must output the entire sequence of the largest value.  

### Example

If the three inputs are of length three:

```
X1 = 110
X2 = 101
X3 = 111
```

`X3` (`111₂ = 7₁₀`) is strictly greater than both `X1` (`110₂ = 6₁₀`) and `X2` (`101₂ = 5₁₀`).  Therefore the output should be

```
Y  = 111
```

Another example where two inputs tie:

```
X1 = 0111
X2 = 0111
X3 = 0101
```

Here `X1` and `X2` are both `7` and share the maximum value.  `Y` should be `0111` (the bits of `X1`).

## Input/Output Specification

- **Inputs:**
  - `X1` – bit sequence (most significant bit arrives at `t=0`).
  - `X2` – bit sequence.
  - `X3` – bit sequence.
- **Output:**
  - `Y` – bit sequence that matches the bits of the largest input.

The circuit will be simulated for time steps.  At each time step `t ∈ {0,1,..}`, your circuit should produce one bit of `Y`.  After reading the whole input the full bit output is available as the concatenation `Y = Y₀Y₁...`.

## Scoring

The scoring script exhaustively tests **all** possible bit combinations for `X1`, `X2` and `X3`.  For each test case it runs your circuit, captures the output sequence `Y`, and compares it to the expected largest.  If your circuit produces the correct output for every test case, you pass; otherwise you fail.

## Usage

From the `challenges/04-max_of_three` directory, run:

```bash
python score.py --circuit your_solution.cir
```

You can specify a different bit‑width using the `--bits`/`-b` flag, though the default is 3.

```bash
python score.py --circuit your_solution.cir --bits 4
```

This will test 4‑bit inputs instead of 3‑bit inputs.  Note that the number of test cases grows exponentially with the number of bits (`2^(3·bits)`), so testing large widths may take a long time.

## Tips

When designing your circuit:

1. **Use macros wisely.**  Create helper macros for common logic such as comparators (`greater_than`) and multiplexers (`MUX`).
2. **Store intermediate decisions.**  Because the comparison decision depends on bits seen at earlier time steps, you may need D‑flip‑flops (`D(expr, default)`) to store whether one input is currently larger than another.
3. **Break ties deterministically.**  Remember that ties are resolved in favour of `X1` over `X2` over `X3`.

Good luck!

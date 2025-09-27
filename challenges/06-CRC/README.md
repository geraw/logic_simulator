# 3-bit CRC Challenge (Polynomial x³ + x + 1)

## The Challenge

Design a logic circuit that reads a single binary input signal `X` of arbitrary length and produces a 3-bit output signal `CRC` that is the **cyclic redundancy check (CRC)** of the input, using the polynomial $x^3 + x + 1$ (binary 1011).

The CRC is computed by treating the input as a binary polynomial, appending three zero bits, and dividing by the generator polynomial $x^3 + x + 1$ using modulo-2 division. The remainder after division is the CRC value.

**Note:** The length of the input signal is not fixed; your circuit should work for any length.

### Example

If the input is:

```
X = 1101
```

The CRC is computed as follows:
- Append three zeros: 1101000
- Divide by 1011 (modulo-2)
- The remainder is the 3-bit CRC value

## Input/Output Specification

- **Input:**
  - `X` – bit sequence (most significant bit arrives at `t=0`)
- **Output:**
  - `CRC` – 3-bit sequence, the CRC remainder after all bits have been processed

The circuit will be simulated for as many time steps as the length of the input signal. After all input bits have been read, the output `CRC` should be the 3-bit CRC of the entire input.

## Scoring

The scoring script will test all possible bit combinations for `X` of the specified length. For each test case, it will check that the output is the correct CRC value.

## Usage

From the `challenges/06-CRC` directory, run:

```bash
python score.py --circuit your_solution.cir
```

You can specify a different bit-width using the `--bits`/`-b` flag (default is 4):

```bash
python score.py --circuit your_solution.cir --bits 6
```

## Tips

- **Use shift registers and XOR logic.** CRC computation can be implemented using a 3-bit shift register and XOR gates according to the feedback defined by the polynomial.
- **Store intermediate results.** You will need D-flip-flops to store the CRC state as each bit arrives.

Good luck!

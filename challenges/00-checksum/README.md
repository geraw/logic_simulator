# Checksum Challenge

## The Challenge

Design a logic circuit that reads a single binary input signal `X` of arbitrary length and produces a binary output signal `Y` that is the **checksum** (parity) of the input. The checksum is defined as the sum (modulo 2) of all bits in the input sequence. In other words, `Y` should be `1` if the number of `1`s in `X` is odd, and `0` if it is even.

**Note:** The length of the input signal is not fixed; your circuit should work for any length.

### Example

If the input is:

```
X = 1011
```

The checksum is `1` (since there are three `1`s, which is odd), so the output should be:

```
Y = 1
```

If the input is:

```
X = 1100
```

The checksum is `0` (since there are two `1`s, which is even), so the output should be:

```
Y = 0
```

## Input/Output Specification

- **Input:**
  - `X` – bit sequence (most significant bit arrives at `t=0`)
- **Output:**
  - `Y` – a single bit, the checksum (parity) of the input sequence

The circuit will be simulated for as many time steps as the length of the input signal. After all input bits have been read, the output `Y` should be the checksum of the entire input.

## Scoring

The scoring script will test all possible bit combinations for `X` of the specified length. For each test case, it will check that the output is the correct checksum.

## Tips

- **Use XOR logic.** The checksum (parity) can be computed by XOR-ing all the bits of the input.
- **Store intermediate results.** You may need to use D-flip-flops to accumulate the running checksum as each bit arrives.

Good luck!

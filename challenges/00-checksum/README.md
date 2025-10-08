# Checksum Challenge

## The Challenge

Design a logic circuit that reads a single binary input signal `X` of arbitrary length. The circuit should produce a binary output signal `Y`. At any time `t`, the output `Y(t)` should be the **checksum** (parity) of the input sequence `X` from the beginning up to time `t`. The checksum is the sum (modulo 2) of the bits. In other words, `Y(t)` should be `1` if the number of `1`s in `X[0...t]` is odd, and `0` if it is even.

**Note:** The length of the input signal is not fixed; your circuit should work for any length.

### Example

If the input sequence `X` is `1011`, the output `Y` should be the running checksum:

- At `t=0`, `X` seen so far is `1`. The checksum is `1`.
- At `t=1`, `X` seen so far is `10`. The checksum is `1`.
- At `t=2`, `X` seen so far is `101`. The checksum is `0`.
- At `t=3`, `X` seen so far is `1011`. The checksum is `1`.

So, for `X = 1011`, the output sequence is `Y = 1101`.

If the input is `X = 1100`, the output is `Y = 1000`.

## Input/Output Specification

- **Input:**
  - `X` – bit sequence (most significant bit arrives at `t=0`)
- **Output:**
  - `Y` – bit sequence, where `Y(t)` is the running checksum of `X[0...t]`.

The circuit will be simulated for as many time steps as the length of the input signal. At each time step `t`, the output `Y(t)` should be the checksum of the input received so far.

## Scoring

The scoring script will test your circuit with various input sequences `X`. For each sequence, it will verify that the output `Y` at each time step `t` is the correct running checksum of the input `X[0...t]`.

## Tips

- **Use XOR logic.** The checksum (parity) can be computed by XOR-ing all the bits of the input.
- **Store intermediate results.** You need to use D-flip-flops to accumulate the running checksum as each bit arrives.

Good luck!
